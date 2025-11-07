import os
import json
import boto3

# AWS Clients
dynamodb = boto3.resource('dynamodb')

# DynamoDB table
CONNECTIONS_TABLE = os.environ.get('DYNAMODB_CONNECTIONS_TABLE', 'websocket_connections')
connections_table = dynamodb.Table(CONNECTIONS_TABLE)


def lambda_handler(event, context):
    """
    Handle WebSocket disconnection.
    Remove connectionId from DynamoDB.
    """
    try:
        connection_id = event['requestContext']['connectionId']

        print(f"WebSocket disconnected: {connection_id}")

        # Remove connection from DynamoDB
        connections_table.delete_item(
            Key={'connectionId': connection_id}
        )

        print(f"Removed connection {connection_id} from table")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Disconnected successfully'})
        }

    except Exception as e:
        print(f"Error handling disconnection: {e}")
        import traceback
        traceback.print_exc()

        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
