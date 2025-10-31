import os
import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('medical-histories')


class DecimalEncoder(json.JSONEncoder):
    """Helper to convert DynamoDB Decimal types to Python types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj) if obj % 1 else int(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event, context):
    """
    Get medical histories for a doctor with optional filters and pagination

    Query Parameters:
    - doctorID (required): Doctor ID
    - patientName (optional): Search by patient name (case-insensitive)
    - startDate (optional): Filter from date (ISO format: YYYY-MM-DD)
    - endDate (optional): Filter to date (ISO format: YYYY-MM-DD)
    - patientID (optional): Filter by specific patient
    - limit (optional): Number of results per page (default: 20)
    - lastKey (optional): Pagination token from previous response

    Returns:
    {
        "histories": [...],
        "lastKey": "..." (for pagination, null if no more results),
        "count": 10
    }
    """
    try:
        # Parse query parameters
        query_params = event.get('queryStringParameters', {}) or {}

        doctor_id = query_params.get('doctorID')
        patient_name = query_params.get('patientName')
        start_date = query_params.get('startDate')
        end_date = query_params.get('endDate')
        patient_id = query_params.get('patientID')
        limit = int(query_params.get('limit', 20))
        last_key = query_params.get('lastKey')

        # Validate required fields
        if not doctor_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'doctorID is required'})
            }

        # Build query using GSI
        query_kwargs = {
            'IndexName': 'doctorID-createdAt-index',
            'KeyConditionExpression': Key('doctorID').eq(doctor_id),
            'ScanIndexForward': False,  # Sort by createdAt descending (newest first)
            'Limit': limit
        }

        # Add date range filter if provided
        if start_date and end_date:
            query_kwargs['KeyConditionExpression'] = query_kwargs['KeyConditionExpression'] & \
                Key('createdAt').between(start_date, end_date + 'T23:59:59Z')
        elif start_date:
            query_kwargs['KeyConditionExpression'] = query_kwargs['KeyConditionExpression'] & \
                Key('createdAt').gte(start_date)
        elif end_date:
            query_kwargs['KeyConditionExpression'] = query_kwargs['KeyConditionExpression'] & \
                Key('createdAt').lte(end_date + 'T23:59:59Z')

        # Add filter expression for patient name or ID
        filter_expressions = []
        if patient_name:
            # Case-insensitive contains search on patient name
            filter_expressions.append(Attr('metaData.patientName').contains(patient_name.lower()))

        if patient_id:
            filter_expressions.append(Attr('patientID').eq(patient_id))

        if filter_expressions:
            filter_expr = filter_expressions[0]
            for expr in filter_expressions[1:]:
                filter_expr = filter_expr & expr
            query_kwargs['FilterExpression'] = filter_expr

        # Handle pagination
        if last_key:
            try:
                query_kwargs['ExclusiveStartKey'] = json.loads(last_key)
            except:
                pass

        # Execute query
        response = table.query(**query_kwargs)

        items = response.get('Items', [])

        # Process items to extract relevant metadata
        histories = []
        for item in items:
            # boto3.resource already converts DynamoDB types to Python types
            metadata = item.get('metaData', {})

            history_data = {
                'historyID': item.get('historyID'),
                'doctorID': item.get('doctorID'),
                'patientID': item.get('patientID'),
                'recordingURL': item.get('recordingURL'),
                'createdAt': item.get('createdAt'),
                'metaData': metadata,
            }

            # Extract key patient info from jsonData if available
            json_data = item.get('jsonData', {})
            if json_data:
                # Try to extract patient name from various possible locations
                patient_name_from_json = (
                    json_data.get('nombre_paciente') or
                    json_data.get('paciente', {}).get('nombre') or
                    json_data.get('patient_name') or
                    json_data.get('datos_paciente', {}).get('nombre')
                )

                if patient_name_from_json and 'patientName' not in history_data['metaData']:
                    history_data['metaData']['patientName'] = patient_name_from_json

                # Store a preview of the clinical data
                history_data['preview'] = {
                    'diagnosis': json_data.get('diagnostico') or json_data.get('diagnosis'),
                    'symptoms': json_data.get('sintomas') or json_data.get('symptoms'),
                    'treatment': json_data.get('tratamiento') or json_data.get('treatment')
                }

            history_data['jsonData'] = json_data

            histories.append(history_data)

        # Prepare pagination token
        next_key = None
        if 'LastEvaluatedKey' in response:
            next_key = json.dumps(response['LastEvaluatedKey'], cls=DecimalEncoder)

        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'histories': histories,
                'lastKey': next_key,
                'count': len(histories)
            }, cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error', 'details': str(e)})
        }
