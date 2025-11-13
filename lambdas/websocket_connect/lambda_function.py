import os
import json
import boto3
from datetime import datetime

# AWS Clients
dynamodb = boto3.resource('dynamodb')

# DynamoDB table
CONNECTIONS_TABLE = os.environ.get('DYNAMODB_CONNECTIONS_TABLE', 'websocket_connections')
connections_table = dynamodb.Table(CONNECTIONS_TABLE)


def lambda_handler(event, context):
    """
    Handle WebSocket connection.
    Store connectionId with historyID and userId for broadcasting.

    Query parameters expected:
    - historyID: Medical record ID
    - userId: User ID (from auth)
    """
    try:
        connection_id = event['requestContext']['connectionId']
        query_params = event.get('queryStringParameters', {}) or {}

        history_id = query_params.get('historyID')
        user_id = query_params.get('userId')

        print(f"New WebSocket connection: {connection_id}")
        print(f"History ID: {history_id}, User ID: {user_id}")

        if not history_id or not user_id:
            print("Warning: Missing historyID or userId in connection")
            # Allow connection anyway, but log warning
            history_id = history_id or "unknown"
            user_id = user_id or "unknown"

        # Store connection in DynamoDB
        connections_table.put_item(
            Item={
                'connectionId': connection_id,
                'historyID': history_id,
                'userId': user_id,
                'connectedAt': datetime.now().isoformat(),
                'ttl': int(datetime.now().timestamp()) + 86400  # 24 hour TTL
            }
        )

        print(f"Stored connection {connection_id} for history {history_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Connected successfully'})
        }

    except Exception as e:
        print(f"Error handling connection: {e}")
        import traceback
        traceback.print_exc()

        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
