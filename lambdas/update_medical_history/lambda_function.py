import os
import json
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
histories_table = dynamodb.Table('medical-histories')
versions_table = dynamodb.Table('medical-histories-versions')


class DecimalEncoder(json.JSONEncoder):
    """Helper to convert DynamoDB Decimal types to Python types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj) if obj % 1 else int(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event, context):
    """
    Update a medical history and create a version record

    Expected input:
    {
        "historyID": "string",
        "jsonData": {...},  # Updated medical history JSON
        "metaData": {...}   # Optional: updated metadata
    }

    Process:
    1. Get current version from medical-histories table
    2. Save current version to medical-histories-versions table
    3. Update medical-histories table with new data
    4. Return updated history
    """
    try:
        # Parse input
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})

        history_id = body.get('historyID')
        new_json_data = body.get('jsonData')
        new_metadata = body.get('metaData')

        # Validate required fields
        if not history_id or not new_json_data:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'historyID and jsonData are required'})
            }

        # Get current history
        response = histories_table.get_item(Key={'historyID': history_id})

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Medical history not found'})
            }

        current_history = response['Item']
        current_json_data = current_history.get('jsonData', {})

        # Create version record with current data
        version_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + 'Z'

        version_record = {
            'versionID': version_id,
            'historyID': history_id,
            'createdAt': timestamp,
            'jsonData': current_json_data,
            'metaData': current_history.get('metaData', {})
        }

        # Save version
        versions_table.put_item(Item=version_record)

        # Update medical history with new data
        update_expression = "SET jsonData = :json, updatedAt = :updated"
        expression_values = {
            ':json': new_json_data,
            ':updated': timestamp
        }

        # Update metadata if provided
        if new_metadata:
            update_expression += ", metaData = :meta"
            expression_values[':meta'] = new_metadata

        histories_table.update_item(
            Key={'historyID': history_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )

        # Get updated history
        updated_response = histories_table.get_item(Key={'historyID': history_id})
        updated_history = updated_response['Item']

        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'history': updated_history,
                'versionID': version_id,
                'message': 'Medical history updated successfully'
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
