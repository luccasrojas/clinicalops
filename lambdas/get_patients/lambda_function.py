import os
import json
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
histories_table = dynamodb.Table('medical-histories')
patients_table = dynamodb.Table('pacients')


class DecimalEncoder(json.JSONEncoder):
    """Helper to convert DynamoDB Decimal types to Python types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj) if obj % 1 else int(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event, context):
    """
    Get all patients for a doctor with their medical history count

    Query Parameters:
    - doctorID (required): Doctor ID

    Returns list of patients with count of their medical histories
    """
    try:
        # Parse query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        doctor_id = query_params.get('doctorID')

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

        # Get all medical histories for this doctor to extract unique patients
        response = histories_table.query(
            IndexName='doctorID-createdAt-index',
            KeyConditionExpression=Key('doctorID').eq(doctor_id),
            ProjectionExpression='patientID, createdAt, metaData'
        )

        histories = response.get('Items', [])

        # Handle pagination if needed
        while 'LastEvaluatedKey' in response:
            response = histories_table.query(
                IndexName='doctorID-createdAt-index',
                KeyConditionExpression=Key('doctorID').eq(doctor_id),
                ProjectionExpression='patientID, createdAt, metaData',
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            histories.extend(response.get('Items', []))

        # Group by patient and count histories
        patients_map = {}
        for history in histories:
            patient_id = history.get('patientID')
            if not patient_id:
                continue

            if patient_id not in patients_map:
                patients_map[patient_id] = {
                    'pacientID': patient_id,
                    'historyCount': 0,
                    'lastVisit': history.get('createdAt'),
                    'nombre': history.get('metaData', {}).get('patientName', '').split()[0] if history.get('metaData', {}).get('patientName') else 'Desconocido',
                    'apellido': ' '.join(history.get('metaData', {}).get('patientName', '').split()[1:]) if history.get('metaData', {}).get('patientName') and len(history.get('metaData', {}).get('patientName', '').split()) > 1 else ''
                }

            patients_map[patient_id]['historyCount'] += 1

            # Update last visit if this history is more recent
            if history.get('createdAt') > patients_map[patient_id]['lastVisit']:
                patients_map[patient_id]['lastVisit'] = history.get('createdAt')

        # Convert to list and get full patient details
        patients_list = list(patients_map.values())

        # Try to enrich with full patient data from patients table
        for patient in patients_list:
            try:
                patient_response = patients_table.get_item(
                    Key={'pacientID': patient['pacientID']}
                )
                if 'Item' in patient_response:
                    patient_data = patient_response['Item']
                    patient['nombre'] = patient_data.get('nombre', patient['nombre'])
                    patient['apellido'] = patient_data.get('apellido', patient['apellido'])
            except:
                pass  # Use the extracted name from metadata

        # Sort by last visit (most recent first)
        patients_list.sort(key=lambda x: x['lastVisit'], reverse=True)

        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'patients': patients_list,
                'count': len(patients_list)
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
