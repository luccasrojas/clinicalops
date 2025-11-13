import os
import json
import boto3
from datetime import datetime
from decimal import Decimal
from boto3.dynamodb.conditions import Attr

# AWS Clients
dynamodb = boto3.resource('dynamodb')

# DynamoDB tables
MEDICAL_HISTORIES_TABLE = os.environ.get('DYNAMODB_MEDICAL_HISTORIES_TABLE', 'medical-histories')
VERSIONS_TABLE = os.environ.get('DYNAMODB_VERSIONS_TABLE', 'medical_record_versions')
CONNECTIONS_TABLE = os.environ.get('DYNAMODB_CONNECTIONS_TABLE', 'websocket_connections')
WS_API_ENDPOINT = os.environ.get('WS_API_ENDPOINT', '')

medical_histories_table = dynamodb.Table(MEDICAL_HISTORIES_TABLE)
versions_table = dynamodb.Table(VERSIONS_TABLE)
connections_table = dynamodb.Table(CONNECTIONS_TABLE)


def lambda_handler(event, context):
    """
    Update medical record with new clinical note content.
    Also creates a version snapshot and broadcasts to WebSocket connections.

    Expected payload:
    {
        "body": {
            "historyID": "string",
            "structuredClinicalNote": "string (JSON)",
            "userId": "string",
            "changeDescription": "string (optional)"
        }
    }
    """
    try:
        # Parse request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})

        history_id = body.get('historyID')
        structured_note = body.get('structuredClinicalNote')
        estructura_clinica = body.get('estructuraClinica')
        user_id = body.get('userId')
        change_description = body.get('changeDescription', 'Manual edit')

        # Validate required fields
        if not history_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'historyID is required'})
            }

        if not structured_note and not estructura_clinica:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'structuredClinicalNote or estructuraClinica is required'})
            }

        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'userId is required'})
            }

        # Validate JSON structure
        parsed_structure = None
        if structured_note:
            try:
                parsed_structure = json.loads(structured_note)
            except json.JSONDecodeError:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'structuredClinicalNote must be valid JSON string'})
                }

        parsed_estructura = None
        if estructura_clinica:
            try:
                parsed_estructura = json.loads(estructura_clinica)
            except json.JSONDecodeError:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'estructuraClinica must be valid JSON string'})
                }

        # Get current record to check if it exists and user has permissions
        response = medical_histories_table.get_item(Key={'historyID': history_id})

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Medical history not found'})
            }

        current_record = response['Item']

        # TODO: Verify user has permission to edit this record
        # For now, we trust the userId from the request
        # In production, validate against Cognito token

        # Check if content actually changed (avoid unnecessary writes)
        current_note = current_record.get('structuredClinicalNote')
        if not current_note:
            fallback_payload = current_record.get('jsonData', {})
            try:
                current_note = json.dumps(fallback_payload, default=_decimal_default, ensure_ascii=False)
            except Exception:
                current_note = '{}'

        # Always start with current note to preserve metadata
        try:
            updated_note_obj = json.loads(current_note) if current_note else {}
        except json.JSONDecodeError:
            updated_note_obj = {}

        # Update only estructura_historia_clinica (never replace root keys)
        if parsed_estructura is not None:
            # User edited only estructura_historia_clinica
            updated_note_obj['estructura_historia_clinica'] = parsed_estructura
            print(f"Updated estructura_historia_clinica via estructuraClinica parameter")
        elif parsed_structure is not None:
            # Frontend sent full structure, extract estructura_historia_clinica
            if 'estructura_historia_clinica' in parsed_structure:
                updated_note_obj['estructura_historia_clinica'] = parsed_structure['estructura_historia_clinica']
                print(f"Updated estructura_historia_clinica from structuredClinicalNote")
            else:
                # Fallback: assume the whole thing is estructura_historia_clinica
                updated_note_obj['estructura_historia_clinica'] = parsed_structure
                print(f"Warning: No estructura_historia_clinica key found, treating whole payload as estructura")

        # Preserve tipo_historia and especialidad_probable from current record
        # These should NEVER be overwritten by editor changes
        if 'tipo_historia' not in updated_note_obj and 'tipo_historia' in current_record.get('jsonData', {}):
            updated_note_obj['tipo_historia'] = current_record['jsonData']['tipo_historia']
        if 'especialidad_probable' not in updated_note_obj and 'especialidad_probable' in current_record.get('jsonData', {}):
            updated_note_obj['especialidad_probable'] = current_record['jsonData']['especialidad_probable']

        updated_note_str = json.dumps(updated_note_obj, ensure_ascii=False)

        if updated_note_str == current_note:
            print(f"No changes detected for history {history_id}, skipping update")
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'message': 'No changes detected',
                    'historyID': history_id,
                    'timestamp': int(datetime.now().timestamp() * 1000)
                })
            }

        # Create version snapshot before updating
        version_timestamp = int(datetime.now().timestamp() * 1000)

        try:
            versions_table.put_item(
                Item={
                    'historyID': history_id,
                    'versionTimestamp': version_timestamp,
                    'structuredClinicalNote': current_note,  # Save the OLD version
                    'userId': user_id,
                    'changeDescription': f'Snapshot before: {change_description}',
                    'createdAt': datetime.now().isoformat(),
                }
            )
            print(f"Created version snapshot at timestamp {version_timestamp}")
        except Exception as e:
            print(f"Warning: Failed to create version snapshot: {e}")
            # Continue anyway - version history is nice-to-have

        # Update main record
        update_timestamp = int(datetime.now().timestamp() * 1000)

        update_expression = 'SET structuredClinicalNote = :note, lastEditedAt = :timestamp, lastEditedBy = :user'
        expression_values = {
            ':note': updated_note_str,
            ':timestamp': update_timestamp,
            ':user': user_id
        }

        if not current_record.get('structuredClinicalNoteOriginal'):
            update_expression += ', structuredClinicalNoteOriginal = if_not_exists(structuredClinicalNoteOriginal, :original)'
            expression_values[':original'] = current_note or updated_note_str

        medical_histories_table.update_item(
            Key={'historyID': history_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )

        print(f"Updated medical history {history_id} at {update_timestamp}")

        # Broadcast update via WebSocket (if connections exist)
        try:
            broadcast_update(history_id, user_id, updated_note_str)
        except Exception as e:
            print(f"Warning: Failed to broadcast WebSocket update: {e}")
            # Continue anyway - WebSocket is optional

        # Return success
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Medical record updated successfully',
                'historyID': history_id,
                'timestamp': update_timestamp,
                'versionTimestamp': version_timestamp
            })
        }

    except Exception as e:
        print(f"Error updating medical record: {e}")
        import traceback
        traceback.print_exc()

        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }


def broadcast_update(history_id, sender_user_id, new_content):
    """
    Broadcast update to all WebSocket connections for this history.
    Notifies other users that the medical record has been updated.
    """
    if not WS_API_ENDPOINT:
        print("Warning: WS_API_ENDPOINT not configured, skipping broadcast")
        return

    try:
        # Query all connections for this historyID
        connections = []
        scan_kwargs = {
            'FilterExpression': Attr('historyID').eq(history_id)
        }

        while True:
            response = connections_table.scan(**scan_kwargs)
            connections.extend(response.get('Items', []))

            if 'LastEvaluatedKey' not in response:
                break

            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']

        print(f"Found {len(connections)} WebSocket connections for history {history_id}")

        if not connections:
            print("No active connections to broadcast to")
            return

        # Prepare broadcast message
        message = json.dumps({
            'action': 'update',
            'historyID': history_id,
            'updatedBy': sender_user_id,
            'timestamp': int(datetime.now().timestamp() * 1000),
            'message': 'Medical record has been updated'
        })

        # Create API Gateway Management API client with endpoint
        apigateway = boto3.client('apigatewaymanagementapi', endpoint_url=WS_API_ENDPOINT)

        # Send to all connections except sender
        broadcast_count = 0
        stale_connections = []

        for connection in connections:
            connection_id = connection.get('connectionId')
            conn_user_id = connection.get('userId')

            # Skip sender's own connection
            if conn_user_id == sender_user_id:
                print(f"Skipping sender's connection: {connection_id}")
                continue

            try:
                apigateway.post_to_connection(
                    ConnectionId=connection_id,
                    Data=message.encode('utf-8')
                )
                broadcast_count += 1
                print(f"Broadcasted to connection: {connection_id}")

            except apigateway.exceptions.GoneException:
                print(f"Connection {connection_id} is stale, marking for cleanup")
                stale_connections.append(connection_id)

            except Exception as e:
                print(f"Error sending to connection {connection_id}: {e}")

        # Clean up stale connections
        for stale_id in stale_connections:
            try:
                connections_table.delete_item(Key={'connectionId': stale_id})
                print(f"Cleaned up stale connection: {stale_id}")
            except Exception as e:
                print(f"Error cleaning up connection {stale_id}: {e}")

        print(f"Successfully broadcasted to {broadcast_count} connections")

    except Exception as e:
        print(f"Error broadcasting update: {e}")
        import traceback
        traceback.print_exc()
        # Don't raise - broadcasting is optional


def _decimal_default(value):
    if isinstance(value, Decimal):
        return float(value) if value % 1 else int(value)
    raise TypeError(f'Object of type {type(value)} is not JSON serializable')
