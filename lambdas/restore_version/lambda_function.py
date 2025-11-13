import os
import json
import boto3
from datetime import datetime

# AWS Clients
dynamodb = boto3.resource('dynamodb')

# DynamoDB tables
MEDICAL_HISTORIES_TABLE = os.environ.get('DYNAMODB_MEDICAL_HISTORIES_TABLE', 'medical_histories')
VERSIONS_TABLE = os.environ.get('DYNAMODB_VERSIONS_TABLE', 'medical_record_versions')

medical_histories_table = dynamodb.Table(MEDICAL_HISTORIES_TABLE)
versions_table = dynamodb.Table(VERSIONS_TABLE)


def lambda_handler(event, context):
    """
    Restore a medical record to a previous version.

    Expected payload:
    {
        "body": {
            "historyID": "string",
            "versionTimestamp": number,
            "userId": "string"
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
        version_timestamp = body.get('versionTimestamp')
        user_id = body.get('userId')

        # Validate required fields
        if not history_id or not version_timestamp or not user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'historyID, versionTimestamp, and userId are required'})
            }

        # Get the version to restore
        version_response = versions_table.get_item(
            Key={
                'historyID': history_id,
                'versionTimestamp': version_timestamp
            }
        )

        if 'Item' not in version_response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Version not found'})
            }

        version_data = version_response['Item']
        old_content = version_data.get('structuredClinicalNote', '')

        # Get current record to save as snapshot before restoring
        current_response = medical_histories_table.get_item(Key={'historyID': history_id})

        if 'Item' not in current_response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Medical history not found'})
            }

        current_record = current_response['Item']
        current_content = current_record.get('structuredClinicalNote', '')

        # Create snapshot of current version before restoring
        snapshot_timestamp = int(datetime.now().timestamp() * 1000)

        versions_table.put_item(
            Item={
                'historyID': history_id,
                'versionTimestamp': snapshot_timestamp,
                'structuredClinicalNote': current_content,
                'userId': user_id,
                'changeDescription': f'Snapshot before restoring to version {version_timestamp}',
                'createdAt': datetime.now().isoformat(),
            }
        )

        print(f"Created snapshot at {snapshot_timestamp} before restoring")

        # Restore old version to current
        update_timestamp = int(datetime.now().timestamp() * 1000)

        medical_histories_table.update_item(
            Key={'historyID': history_id},
            UpdateExpression='SET structuredClinicalNote = :note, lastEditedAt = :timestamp, lastEditedBy = :user',
            ExpressionAttributeValues={
                ':note': old_content,
                ':timestamp': update_timestamp,
                ':user': user_id
            }
        )

        print(f"Restored medical history {history_id} to version {version_timestamp}")

        # Create a "restore" snapshot to track the restoration
        restore_snapshot_timestamp = int(datetime.now().timestamp() * 1000)

        versions_table.put_item(
            Item={
                'historyID': history_id,
                'versionTimestamp': restore_snapshot_timestamp,
                'structuredClinicalNote': old_content,
                'userId': user_id,
                'changeDescription': f'Restored from version {version_timestamp}',
                'createdAt': datetime.now().isoformat(),
            }
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Version restored successfully',
                'historyID': history_id,
                'restoredFrom': version_timestamp,
                'timestamp': update_timestamp,
                'structuredClinicalNote': old_content
            })
        }

    except Exception as e:
        print(f"Error restoring version: {e}")
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
