import os
import openai
import json
import boto3
from urllib.parse import urlparse

from prompts import EXTRACT_STRUCTURE_SYSTEM_PROMPT

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def parse_s3_url(url):
    """
    Parse S3 URL to extract bucket and key
    Supports formats: https://bucket.s3.region.amazonaws.com/key or https://storage.clinicalops.co/bucket/key
    """
    parsed = urlparse(url)
    
    if 'storage.clinicalops.co' in parsed.netloc:
        # Custom domain format: https://storage.clinicalops.co/bucket/key
        path_parts = parsed.path.strip('/').split('/', 1)
        if len(path_parts) >= 2:
            return path_parts[0], path_parts[1]
    elif 's3' in parsed.netloc:
        # Standard S3 format: https://bucket.s3.region.amazonaws.com/key
        bucket = parsed.netloc.split('.')[0]
        key = parsed.path.strip('/')
        return bucket, key
    
    raise ValueError(f"Unable to parse S3 URL: {url}")

def read_txt_file(file_path=None, s3_bucket=None, s3_key=None):
    """
    Read text file from local path or S3
    """
    if s3_bucket and s3_key:
        # Read from S3
        s3_client = boto3.client('s3')
        response = s3_client.get_object(Bucket=s3_bucket, Key=s3_key)
        return response['Body'].read().decode('utf-8')
    elif file_path:
        # Read from local file
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    else:
        raise ValueError("Either file_path or both s3_bucket and s3_key must be provided")

def generate_structure_from_medical_record(medical_record_example):

    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    completion = client.responses.create(
        model="gpt-5",
        reasoning={"effort": "minimal"},
        input=[
            {
                "role": "system",
                "content": EXTRACT_STRUCTURE_SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": (
                    medical_record_example
                ),
            },
        ],
        text={"format": {"type": "json_object"}},
    )
    data = json.loads(completion.output[1].content[0].text)
    return data

def lambda_handler(event, context):
    # Handle different input formats
    if 'medical_record_example' in event:
        # Direct text input (backward compatibility)
        medical_record_example = event['medical_record_example']
    elif 'file_path' in event:
        file_path = event['file_path']
        # Check if file_path is a URL
        if file_path.startswith('http'):
            # Parse S3 URL
            bucket, key = parse_s3_url(file_path)
            medical_record_example = read_txt_file(s3_bucket=bucket, s3_key=key)
        else:
            # Local file path
            medical_record_example = read_txt_file(file_path=file_path)
    elif 's3_bucket' in event and 's3_key' in event:
        # S3 file
        medical_record_example = read_txt_file(
            s3_bucket=event['s3_bucket'], 
            s3_key=event['s3_key']
        )
    else:
        raise ValueError("Event must contain 'medical_record_example', 'file_path', or 's3_bucket' and 's3_key'")

    return generate_structure_from_medical_record(medical_record_example)
