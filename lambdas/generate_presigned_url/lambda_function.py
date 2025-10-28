import os
import json
import boto3
from botocore.exceptions import ClientError
from datetime import datetime

s3_client = boto3.client('s3')

BUCKET_NAME = 'recordings-clinicalops'
EXPIRATION = 3600  # 1 hour


def lambda_handler(event, context):
    """
    Generate pre-signed URL for uploading recordings to S3

    Expected input:
    {
        "doctorID": "string",
        "fileName": "string",
        "contentType": "audio/webm" | "audio/wav" | "audio/mp3" etc.
    }

    Returns:
    {
        "uploadURL": "https://...",
        "fileKey": "doctors/{doctorID}/recordings/{timestamp}_{fileName}",
        "expiresIn": 3600
    }
    """
    try:
        # Parse input
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})

        doctor_id = body.get('doctorID')
        file_name = body.get('fileName')
        content_type = body.get('contentType', 'audio/webm')

        # Validate required fields
        if not doctor_id or not file_name:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'doctorID and fileName are required'})
            }

        # Generate unique file key with timestamp
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        file_key = f"doctors/{doctor_id}/recordings/{timestamp}_{file_name}"

        # Generate pre-signed URL for PUT operation
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': file_key,
                'ContentType': content_type
            },
            ExpiresIn=EXPIRATION
        )

        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'uploadURL': presigned_url,
                'fileKey': file_key,
                'expiresIn': EXPIRATION,
                'bucketName': BUCKET_NAME
            })
        }

    except ClientError as e:
        print(f"AWS Error: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Failed to generate pre-signed URL'})
        }

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
