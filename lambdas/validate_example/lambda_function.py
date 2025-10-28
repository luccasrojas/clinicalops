import json
import boto3
import os
from typing import Dict, Any
from urllib.parse import unquote_plus

s3_client = boto3.client('s3')
MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE_MB', '5')) * 1024 * 1024  # Default 5MB in bytes

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Validate text files uploaded to S3 via event trigger.

    This lambda is triggered automatically when a file is uploaded to the examples/ prefix.
    It validates:
    1. File size (max 1MB by default)
    2. Content is valid text (UTF-8 decodable)
    3. File is not empty

    If validation fails, the file is deleted and an error is logged.
    If validation passes, metadata is updated on the S3 object.

    Event structure from S3:
    {
        "Records": [
            {
                "s3": {
                    "bucket": {"name": "recordings-clinicalops"},
                    "object": {"key": "examples/user123/20251027-143022-ejemplo.txt", "size": 1024}
                }
            }
        ]
    }
    """
    try:
        # Process each record from S3 event
        results = []

        for record in event.get('Records', []):
            s3_info = record.get('s3', {})
            bucket_name = s3_info.get('bucket', {}).get('name')
            object_key = unquote_plus(s3_info.get('object', {}).get('key', ''))
            object_size = s3_info.get('object', {}).get('size', 0)

            print(f"Processing file: {object_key} ({object_size} bytes) from bucket: {bucket_name}")

            # Skip if not in examples/ prefix
            if not object_key.startswith('examples/'):
                print(f"Skipping file not in examples/ prefix: {object_key}")
                continue

            # Validate file size
            if object_size > MAX_FILE_SIZE:
                error_msg = f"File too large: {object_size} bytes (max: {MAX_FILE_SIZE} bytes)"
                print(f"VALIDATION FAILED - {error_msg}")

                # Delete the file
                s3_client.delete_object(Bucket=bucket_name, Key=object_key)
                print(f"Deleted file: {object_key}")

                results.append({
                    'file': object_key,
                    'status': 'failed',
                    'reason': error_msg
                })
                continue

            # Validate file is not empty
            if object_size == 0:
                error_msg = "File is empty"
                print(f"VALIDATION FAILED - {error_msg}")

                s3_client.delete_object(Bucket=bucket_name, Key=object_key)
                print(f"Deleted file: {object_key}")

                results.append({
                    'file': object_key,
                    'status': 'failed',
                    'reason': error_msg
                })
                continue

            # Get file content and validate it's valid text
            try:
                response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
                content = response['Body'].read()

                # Try to decode as UTF-8 text
                text_content = content.decode('utf-8')

                # Basic validation: check if it's printable text
                if not text_content.strip():
                    error_msg = "File contains only whitespace"
                    print(f"VALIDATION FAILED - {error_msg}")

                    s3_client.delete_object(Bucket=bucket_name, Key=object_key)
                    print(f"Deleted file: {object_key}")

                    results.append({
                        'file': object_key,
                        'status': 'failed',
                        'reason': error_msg
                    })
                    continue

                # Validation passed - update object metadata
                import datetime
                timestamp = datetime.datetime.utcnow().isoformat()

                s3_client.copy_object(
                    Bucket=bucket_name,
                    CopySource={'Bucket': bucket_name, 'Key': object_key},
                    Key=object_key,
                    Metadata={
                        'validated': 'true',
                        'validation-timestamp': timestamp,
                        'character-count': str(len(text_content)),
                        'line-count': str(len(text_content.splitlines()))
                    },
                    MetadataDirective='REPLACE',
                    ContentType='text/plain; charset=utf-8'
                )

                print(f"VALIDATION PASSED - File validated and metadata updated: {object_key}")
                print(f"Character count: {len(text_content)}, Line count: {len(text_content.splitlines())}")

                results.append({
                    'file': object_key,
                    'status': 'success',
                    'size_bytes': object_size,
                    'character_count': len(text_content),
                    'line_count': len(text_content.splitlines())
                })

            except UnicodeDecodeError as e:
                error_msg = f"File is not valid UTF-8 text: {str(e)}"
                print(f"VALIDATION FAILED - {error_msg}")

                s3_client.delete_object(Bucket=bucket_name, Key=object_key)
                print(f"Deleted file: {object_key}")

                results.append({
                    'file': object_key,
                    'status': 'failed',
                    'reason': error_msg
                })
                continue

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Validation complete',
                'results': results
            })
        }

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error during validation',
                'details': str(e)
            })
        }
