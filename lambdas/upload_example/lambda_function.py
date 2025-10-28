import json
import boto3
import os
from datetime import datetime
from typing import Dict, Any

s3_client = boto3.client('s3')
BUCKET_NAME = os.getenv('S3_BUCKET_NAME', 'recordings-clinicalops')
EXPIRATION = int(os.getenv('PRESIGNED_URL_EXPIRATION', '3600'))  # 1 hour default
MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE_MB', '1')) * 1024 * 1024  # Default 1MB in bytes

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Generate presigned URL for uploading text files to S3.

    Expected event structure:
    {
        "file_name": "ejemplo-nota-clinica.txt",
        "user_id": "user123"  # optional, defaults to "default"
    }

    Returns:
    {
        "statusCode": 200,
        "body": {
            "upload_url": "https://...",
            "file_key": "examples/user123/20251027-143022-ejemplo-nota-clinica.txt",
            "bucket": "recordings-clinicalops",
            "expires_in": 3600
        }
    }
    """
    try:
        # Parse body if it's a string (API Gateway proxy integration)
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event

        # Extract parameters
        file_name = body.get('file_name')
        user_id = body.get('user_id', 'default')

        # Validation
        if not file_name:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'file_name is required'})
            }

        # Validate file extension - only .txt files
        if not file_name.lower().endswith('.txt'):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Only .txt files are allowed',
                    'received_file': file_name
                })
            }

        # Generate unique file key with timestamp
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        file_key = f"examples/{user_id}/{timestamp}-{file_name}"

        # Generate presigned URL for PUT operation
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': file_key,
                'ContentType': 'text/plain',
                'ContentLength': MAX_FILE_SIZE  # Client must send Content-Length header
            },
            ExpiresIn=EXPIRATION
        )

        response_body = {
            'upload_url': presigned_url,
            'file_key': file_key,
            'bucket': BUCKET_NAME,
            'expires_in': EXPIRATION,
            'max_file_size_mb': MAX_FILE_SIZE / (1024 * 1024),
            'instructions': {
                'method': 'PUT',
                'headers': {
                    'Content-Type': 'text/plain'
                },
                'note': 'Use the upload_url to PUT your file directly to S3'
            }
        }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_body)
        }

    except json.JSONDecodeError as e:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Invalid JSON in request body',
                'details': str(e)
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            })
        }
