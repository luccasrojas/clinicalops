import os
import json
import boto3

# AWS Clients
apigateway_management = boto3.client('apigatewaymanagementapi')

# WebSocket API endpoint
WS_ENDPOINT = os.environ.get('WS_API_ENDPOINT', '')


def lambda_handler(event, context):
    """
    Handle messages from WebSocket clients.
    Currently just echoes back for ping/pong.
    """
    try:
        connection_id = event['requestContext']['connectionId']
        domain = event['requestContext']['domainName']
        stage = event['requestContext']['stage']

        # Reconstruct endpoint URL
        endpoint_url = f"https://{domain}/{stage}"

        # Parse message
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', 'unknown')

        print(f"Received message from {connection_id}: {action}")

        # Handle ping/pong for keep-alive
        if action == 'ping':
            response = json.dumps({'action': 'pong', 'timestamp': int(context.get_remaining_time_in_millis())})

            apigateway = boto3.client('apigatewaymanagementapi', endpoint_url=endpoint_url)
            apigateway.post_to_connection(
                ConnectionId=connection_id,
                Data=response.encode('utf-8')
            )

            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'Pong sent'})
            }

        # For other actions, just acknowledge
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Message received'})
        }

    except Exception as e:
        print(f"Error handling message: {e}")
        import traceback
        traceback.print_exc()

        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
