import os
import json
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

from boto3.dynamodb.types import TypeDeserializer

lambda_client = boto3.client('lambda')
dynamodb = boto3.resource('dynamodb')
histories_table = dynamodb.Table('medical-histories')
doctors_table = dynamodb.Table('doctors')
patients_table = dynamodb.Table('pacients')

_type_deserializer = TypeDeserializer()
_dynamodb_type_keys = {'S', 'N', 'M', 'L', 'BOOL', 'NULL', 'SS', 'NS', 'BS'}


def _normalize_dynamodb_json(value):
    """Convert DynamoDB-encoded JSON to native Python structures recursively."""
    if isinstance(value, dict):
        if len(value) == 1 and next(iter(value)) in _dynamodb_type_keys:
            return _type_deserializer.deserialize(value)
        return {k: _normalize_dynamodb_json(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_normalize_dynamodb_json(item) for item in value]
    return value


class DecimalEncoder(json.JSONEncoder):
    """Helper to convert DynamoDB Decimal types to Python types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj) if obj % 1 else int(obj)
        return super(DecimalEncoder, self).default(obj)


def process_recording_sync(history_id, doctor_id, recording_url, patient_id=None):
    """
    Process the recording synchronously - this is the heavy lifting
    Called asynchronously by lambda_handler
    """
    try:
        print(f"Processing history {history_id} for doctor {doctor_id}")

        # Update status to processing
        histories_table.update_item(
            Key={'historyID': history_id},
            UpdateExpression='SET #status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': 'processing'}
        )

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
            raise Exception('Doctor not found')

        doctor_data = doctor_response['Item']
        medical_record_example = doctor_data.get('medical_record_example', {})
        medical_record_structure = doctor_data.get('medical_record_structure', {})

        # Step 3: Create medical record
        print("Step 3: Generating medical record with AI...")
        create_record_payload = {
            'body': json.dumps({
                'transcription': transcription,
                'medical_record_example': medical_record_example,
                'medical_record_format': medical_record_structure
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

        # Step 6: Update medical history with results
        print("Step 6: Updating medical history...")
        timestamp = datetime.utcnow().isoformat() + 'Z'

        # Extract metadata for easier querying
        metadata = {
            'patientName': f"{patient_name} {patient_lastname}".strip().lower(),
            'diagnosis': medical_record_json.get('diagnostico') or medical_record_json.get('diagnosis'),
            'createdBy': doctor_data.get('name', '') + ' ' + doctor_data.get('lastName', '')
        }

        histories_table.update_item(
            Key={'historyID': history_id},
            UpdateExpression='SET patientID = :pid, jsonData = :jdata, metaData = :meta, #status = :status, updatedAt = :updated, transcription = :trans',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':pid': patient_id,
                ':jdata': medical_record_json,
                ':meta': metadata,
                ':status': 'completed',
                ':updated': timestamp,
                ':trans': transcription
            }
        )
        print(f"Medical history {history_id} completed successfully")

    except Exception as e:
        print(f"Error processing history {history_id}: {e}")
        import traceback
        traceback.print_exc()

        # Update status to failed
        try:
            histories_table.update_item(
                Key={'historyID': history_id},
                UpdateExpression='SET #status = :status, errorMessage = :error, updatedAt = :updated',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'failed',
                    ':error': str(e),
                    ':updated': datetime.utcnow().isoformat() + 'Z'
                }
            )
        except Exception as update_error:
            print(f"Failed to update error status: {update_error}")


def lambda_handler(event, context):
    """
    Create a medical history record immediately and process asynchronously

    Expected input:
    {
        "doctorID": "string",
        "recordingURL": "https://storage.clinicalops.co/doctors/{doctorID}/recordings/{file}",
        "patientID": "string" (optional)
    }

    Returns immediately with historyID and status "pending"
    The actual processing happens asynchronously
    """
    try:
        # Parse input
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})

        # Check if this is an async processing call (internal)
        if body.get('_async_process'):
            # This is the async worker invocation
            history_id = body.get('historyID')
            doctor_id = body.get('doctorID')
            recording_url = body.get('recordingURL')
            patient_id = body.get('patientID')

            process_recording_sync(history_id, doctor_id, recording_url, patient_id)

            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'Processing completed'})
            }

        # Normal API call - create record and process async
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

        print(f"Creating medical history record for doctor {doctor_id}")

        # Create history record immediately with status "pending"
        history_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + 'Z'

        medical_history = {
            'historyID': history_id,
            'doctorID': doctor_id,
            'recordingURL': recording_url,
            'status': 'pending',
            'createdAt': timestamp,
            'updatedAt': timestamp
        }

        if patient_id:
            medical_history['patientID'] = patient_id

        histories_table.put_item(Item=medical_history)
        print(f"Medical history created: {history_id} with status 'pending'")

        # Invoke self asynchronously to process the recording
        async_payload = {
            'body': json.dumps({
                '_async_process': True,
                'historyID': history_id,
                'doctorID': doctor_id,
                'recordingURL': recording_url,
                'patientID': patient_id
            })
        }

        lambda_client.invoke(
            FunctionName=context.function_name,
            InvocationType='Event',  # Asynchronous invocation
            Payload=json.dumps(async_payload)
        )
        print(f"Async processing initiated for history {history_id}")

        # Return immediately
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'history': medical_history,
                'message': 'Medical history creation initiated. Processing in background.'
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
