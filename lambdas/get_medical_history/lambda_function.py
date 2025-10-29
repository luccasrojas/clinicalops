import os
import json
import boto3
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
    Get a single medical history by ID

    Path Parameters:
    - historyID (required): History ID

    Returns complete medical history with full jsonData
    """
    try:
        # Get historyID from path parameters
        path_params = event.get('pathParameters', {}) or {}
        history_id = path_params.get('historyID')

        if not history_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'historyID is required'})
            }

        # Get item from DynamoDB
        response = table.get_item(Key={'historyID': history_id})

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Medical history not found'})
            }

        item = response['Item']

        # Return success response with full data
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'history': item
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
