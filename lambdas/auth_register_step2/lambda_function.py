import os
import json
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.types import TypeSerializer

# AWS Configuration
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
DYNAMODB_TABLE = os.getenv("DYNAMODB_DOCTORS_TABLE", "doctors")
EXTRACT_FORMAT_LAMBDA = os.getenv("EXTRACT_FORMAT_LAMBDA", "extract_format")

# AWS clients
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
lambda_client = boto3.client('lambda', region_name=AWS_REGION)
table = dynamodb.Table(DYNAMODB_TABLE)


def invoke_extract_format_lambda(example_history_text):
    """
    Invoke the extract_format lambda to process the example clinical history

    Args:
        example_history_text: Raw text of the example clinical history

    Returns:
        Structured JSON format of the clinical history
    """
    try:
        # Prepare payload for extract_format lambda
        payload = {
            'medical_record_example': example_history_text
        }

        # Invoke lambda
        response = lambda_client.invoke(
            FunctionName=EXTRACT_FORMAT_LAMBDA,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )

        # Parse response
        response_payload = json.loads(response['Payload'].read())

        # Check if there was an error in the lambda execution
        if 'errorMessage' in response_payload:
            raise Exception(f"Extract format lambda error: {response_payload['errorMessage']}")

        return response_payload

    except Exception as e:
        print(f"Error invoking extract_format lambda: {e}")
        raise


def lambda_handler(event, context):
    """
    Lambda function to complete doctor registration (Step 2)

    This function:
    1. Receives the example clinical history text
    2. Invokes extract_format lambda to structure it
    3. Saves doctor data to DynamoDB with structured example

    Expected event body:
    {
        "doctorID": "cognito-user-sub-id",
        "email": "doctor@example.com",
        "name": "Juan",
        "familyName": "Pérez",
        "specialty": "Cardiología",
        "medicalRegistry": "MED-12345",
        "exampleHistory": "Paciente masculino de 45 años que acude por..."
    }

    Returns:
    - Success: Confirmation with doctor ID
    - Error: Error message and status code
    """

    try:
        # Parse request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})

        # Extract and validate required fields
        doctor_id = body.get('doctorID')
        email = body.get('email')
        name = body.get('name')
        family_name = body.get('familyName')
        specialty = body.get('specialty')
        medical_registry = body.get('medicalRegistry')
        example_history_text = body.get('exampleHistory')

        # Validate required fields
        if not all([doctor_id, email, name, family_name, specialty, medical_registry, example_history_text]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'All fields are required: doctorID, email, name, familyName, specialty, medicalRegistry, exampleHistory'
                })
            }

        # Validate example history has minimum length
        if len(example_history_text.strip()) < 100:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Example clinical history must be at least 100 characters long'
                })
            }

        # Process example history with extract_format lambda
        print(f"Processing example history for doctor {doctor_id}")
        structured_history = invoke_extract_format_lambda(example_history_text)
        
        # Parse the response body if it's wrapped in API Gateway format
        if 'body' in structured_history:
            structured_history = json.loads(structured_history['body']) if isinstance(structured_history['body'], str) else structured_history['body']

        # Prepare doctor item for DynamoDB
        # Store structured_history as JSON string to avoid DynamoDB type conversion issues
        doctor_item = {
            'doctorID': doctor_id,
            'email': email,
            'name': name,
            'lastName': family_name,
            'especiality': specialty,  # Keep Spanish spelling as per requirements
            'medicalRegistry': medical_registry,
            'example_history': json.dumps(structured_history) if isinstance(structured_history, dict) else structured_history,
            'example_history_raw': example_history_text,
            'createdAt': context.aws_request_id if context else 'local',
            'registrationComplete': True
        }

        # Save to DynamoDB
        table.put_item(Item=doctor_item)

        print(f"Successfully saved doctor {doctor_id} to DynamoDB")

        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Doctor registration completed successfully',
                'doctorID': doctor_id,
                'email': email,
                'structuredHistoryFields': len(structured_history) if isinstance(structured_history, dict) else 0
            })
        }

    except ClientError as e:
        print(f"DynamoDB error: {e}")
        error_code = e.response['Error']['Code']

        if error_code == 'ConditionalCheckFailedException':
            return {
                'statusCode': 409,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Doctor record already exists'
                })
            }

        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'Database error: {str(e)}'
            })
        }

    except Exception as e:
        print(f"Unexpected error: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'Internal server error: {str(e)}'
            })
        }
