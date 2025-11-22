import os
import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
from boto3.dynamodb.types import TypeDeserializer
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('medical-histories')

_type_deserializer = TypeDeserializer()
_dynamodb_type_keys = {'S', 'N', 'M', 'L', 'BOOL', 'NULL', 'SS', 'NS', 'BS'}


def _normalize_dynamodb_json(value):
    if isinstance(value, dict):
        if len(value) == 1 and next(iter(value)) in _dynamodb_type_keys:
            return _type_deserializer.deserialize(value)
        return {k: _normalize_dynamodb_json(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_normalize_dynamodb_json(item) for item in value]
    return value


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
    - searchKeywords (optional): Search by diagnosis or summary keywords (case-insensitive)
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
        search_keywords = query_params.get('searchKeywords')
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

        # Add filter expression for search keywords or patient ID
        filter_expressions = []
        if search_keywords:
            # Case-insensitive contains search on diagnosis or summary
            keywords_lower = search_keywords.lower()
            filter_expressions.append(
                Attr('metaData.diagnosis').contains(keywords_lower) |
                Attr('metaData.summary').contains(keywords_lower)
            )

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
            metadata = _normalize_dynamodb_json(item.get('metaData', {}))

            history_data = {
                'historyID': item.get('historyID'),
                'doctorID': item.get('doctorID'),
                'patientID': item.get('patientID'),
                'recordingURL': item.get('recordingURL'),
                'createdAt': item.get('createdAt'),
                'updatedAt': item.get('updatedAt', item.get('createdAt')),
                'versionCount': item.get('versionCount', 0),
                'metaData': metadata,
            }

            # Extract key clinical data from jsonData if available
            json_data = _normalize_dynamodb_json(item.get('jsonData', {}))
            if json_data:
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
