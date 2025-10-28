import os
import json
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

lambda_client = boto3.client('lambda')
dynamodb = boto3.resource('dynamodb')
histories_table = dynamodb.Table('medical-histories')
doctors_table = dynamodb.Table('doctors')
patients_table = dynamodb.Table('pacients')


class DecimalEncoder(json.JSONEncoder):
    """Helper to convert DynamoDB Decimal types to Python types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj) if obj % 1 else int(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event, context):
    """
    Orchestrate the creation of a medical history from a recording

    Expected input:
    {
        "doctorID": "string",
        "recordingURL": "https://storage.clinicalops.co/doctors/{doctorID}/recordings/{file}",
        "patientID": "string" (optional - will be created/extracted from transcription)
    }

    Process:
    1. Call transcribe lambda with recordingURL
    2. Get doctor's example_history from DynamoDB
    3. Call create_medical_record lambda with transcription + example_history
    4. Extract patient info from medical record
    5. Create/update patient record if needed
    6. Save medical history to DynamoDB
    7. Return complete medical history
    """
    try:
        # Parse input
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})

        doctor_id = body.get('doctorID')
        recording_url = body.get('recordingURL')
        patient_id = body.get('patientID')

        # Validate required fields
        if not doctor_id or not recording_url:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'doctorID and recordingURL are required'})
            }

        print(f"Starting medical history creation for doctor {doctor_id}")

        # Step 1: Transcribe audio
        print("Step 1: Transcribing audio...")
        transcribe_payload = {'body': json.dumps({'audio_url': recording_url})}
        transcribe_response = lambda_client.invoke(
            FunctionName='transcribe',
            InvocationType='RequestResponse',
            Payload=json.dumps(transcribe_payload)
        )

        transcribe_result = json.loads(transcribe_response['Payload'].read())
        if transcribe_result.get('statusCode') != 200:
            raise Exception(f"Transcription failed: {transcribe_result}")

        transcribe_body = json.loads(transcribe_result['body'])
        transcription = transcribe_body.get('transcription')
        print(f"Transcription completed: {len(transcription)} characters")

        # Step 2: Get doctor's example history
        print("Step 2: Getting doctor's example history...")
        doctor_response = doctors_table.get_item(Key={'doctorID': doctor_id})

        if 'Item' not in doctor_response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Doctor not found'})
            }

        doctor_data = doctor_response['Item']
        example_history = doctor_data.get('example_history', {})

        # Step 3: Create medical record
        print("Step 3: Generating medical record with AI...")
        create_record_payload = {
            'body': json.dumps({
                'transcription': transcription,
                'example_format': example_history
            })
        }

        create_record_response = lambda_client.invoke(
            FunctionName='create_medical_record',
            InvocationType='RequestResponse',
            Payload=json.dumps(create_record_payload)
        )

        create_record_result = json.loads(create_record_response['Payload'].read())
        if create_record_result.get('statusCode') != 200:
            raise Exception(f"Medical record creation failed: {create_record_result}")

        create_record_body = json.loads(create_record_result['body'])
        medical_record_json = create_record_body.get('medical_record')
        print("Medical record generated successfully")

        # Step 4: Extract patient info from medical record
        print("Step 4: Extracting patient information...")
        patient_name = (
            medical_record_json.get('nombre_paciente') or
            medical_record_json.get('paciente', {}).get('nombre') or
            medical_record_json.get('patient_name') or
            medical_record_json.get('datos_paciente', {}).get('nombre') or
            'Desconocido'
        )

        patient_lastname = (
            medical_record_json.get('apellido_paciente') or
            medical_record_json.get('paciente', {}).get('apellido') or
            medical_record_json.get('patient_lastname') or
            medical_record_json.get('datos_paciente', {}).get('apellido') or
            ''
        )

        # Step 5: Create/update patient record if needed
        if not patient_id:
            print("Step 5: Creating new patient record...")
            patient_id = str(uuid.uuid4())
            patient_record = {
                'pacientID': patient_id,
                'nombre': patient_name,
                'apellido': patient_lastname,
                'createdAt': datetime.utcnow().isoformat() + 'Z'
            }
            patients_table.put_item(Item=patient_record)
            print(f"Patient created: {patient_id}")
        else:
            print(f"Using existing patient: {patient_id}")

        # Step 6: Save medical history to DynamoDB
        print("Step 6: Saving medical history...")
        history_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + 'Z'

        # Extract metadata for easier querying
        metadata = {
            'patientName': f"{patient_name} {patient_lastname}".strip().lower(),
            'diagnosis': medical_record_json.get('diagnostico') or medical_record_json.get('diagnosis'),
            'createdBy': doctor_data.get('name', '') + ' ' + doctor_data.get('lastName', '')
        }

        medical_history = {
            'historyID': history_id,
            'doctorID': doctor_id,
            'patientID': patient_id,
            'recordingURL': recording_url,
            'jsonData': medical_record_json,
            'metaData': metadata,
            'createdAt': timestamp,
            'updatedAt': timestamp
        }

        histories_table.put_item(Item=medical_history)
        print(f"Medical history created: {history_id}")

        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'history': medical_history,
                'message': 'Medical history created successfully'
            }, cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error', 'details': str(e)})
        }
