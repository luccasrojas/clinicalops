import os
import json
import boto3
from boto3.dynamodb.conditions import Key

# AWS Clients
dynamodb = boto3.resource('dynamodb')

# DynamoDB table
VERSIONS_TABLE = os.environ.get('DYNAMODB_VERSIONS_TABLE', 'medical_record_versions')
versions_table = dynamodb.Table(VERSIONS_TABLE)


def lambda_handler(event, context):
    """
    Get version history for a medical record.

    Expected input:
    - pathParameters: { historyID: "string" }
    - queryStringParameters: { limit: "10" (optional) }

    Returns list of versions ordered by timestamp DESC.
    """
    try:
        # Parse parameters
        path_params = event.get('pathParameters', {})
        query_params = event.get('queryStringParameters', {}) or {}

        history_id = path_params.get('historyID')
        limit = int(query_params.get('limit', 20))  # Default 20 versions

        if not history_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'historyID is required'})
            }

        # Query versions table
        response = versions_table.query(
            KeyConditionExpression=Key('historyID').eq(history_id),
            ScanIndexForward=False,  # DESC order (newest first)
            Limit=limit
        )

        versions = response.get('Items', [])

        # Format versions for response
        formatted_versions = []
        for version in versions:
            formatted_versions.append({
                'versionTimestamp': version['versionTimestamp'],
                'structuredClinicalNote': version.get('structuredClinicalNote', ''),
                'userId': version.get('userId', 'unknown'),
                'changeDescription': version.get('changeDescription', ''),
                'createdAt': version.get('createdAt', ''),
            })

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'historyID': history_id,
                'versions': formatted_versions,
                'count': len(formatted_versions)
            })
        }

    except Exception as e:
        print(f"Error getting version history: {e}")
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
