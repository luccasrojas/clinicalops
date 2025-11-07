import os
import json
import boto3
from decimal import Decimal
from boto3.dynamodb.types import TypeDeserializer

dynamodb = boto3.resource('dynamodb')

MEDICAL_HISTORIES_TABLE = os.environ.get('DYNAMODB_MEDICAL_HISTORIES_TABLE', 'medical-histories')
table = dynamodb.Table(MEDICAL_HISTORIES_TABLE)

_type_deserializer = TypeDeserializer()
_dynamodb_type_keys = {'S', 'N', 'M', 'L', 'BOOL', 'NULL', 'SS', 'NS', 'BS'}


def _normalize_dynamodb_json(value):
    if isinstance(value, dict):
        if len(value) == 1 and next(iter(value)) in _dynamodb_type_keys:
            return _type_deserializer.deserialize(value)
        return {k: _normalize_dynamodb_json(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_normalize_dynamodb_json(item) for item in value]
    return value


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj) if obj % 1 else int(obj)
        return super().default(obj)


def _ensure_structured_note(history_id, record):
    """Ensure the record has structuredClinicalNote and structuredClinicalNoteOriginal."""
    structured_note = record.get('structuredClinicalNote')

    if structured_note:
        return structured_note

    print(f"No structuredClinicalNote found for {history_id}, generating fallback from jsonData")
    fallback_payload = record.get('jsonData', {})

    try:
        structured_note = json.dumps(
            _normalize_dynamodb_json(fallback_payload),
            cls=DecimalEncoder,
            ensure_ascii=False
        )
    except Exception:
        structured_note = json.dumps({}, ensure_ascii=False)

    try:
        table.update_item(
            Key={'historyID': history_id},
            UpdateExpression='SET structuredClinicalNote = :note, structuredClinicalNoteOriginal = if_not_exists(structuredClinicalNoteOriginal, :note)',
            ExpressionAttributeValues={
                ':note': structured_note
            }
        )
        print(f"Stored fallback structuredClinicalNote for {history_id}")
    except Exception as update_error:
        print(f"Warning: failed to persist fallback structured note for {history_id}: {update_error}")

    return structured_note


def lambda_handler(event, context):
    """
    Get the structured clinical note for a medical history.

    Path parameters:
    - historyID (string, required)
    """
    try:
        path_params = event.get('pathParameters', {}) or {}
        history_id = path_params.get('historyID')

        if not history_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'historyID is required'})
            }

        response = table.get_item(Key={'historyID': history_id})

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Medical history not found'})
            }

        record = response['Item']
        structured_note = _ensure_structured_note(history_id, record)

        meta = record.get('metaData') or {}
        normalized_meta = _normalize_dynamodb_json(meta)

        record_payload = {
            'historyID': history_id,
            'doctorID': record.get('doctorID'),
            'patientID': record.get('patientID'),
            'patientName': normalized_meta.get('patientName') or record.get('patientName'),
            'status': record.get('status', 'completed'),
            'structuredClinicalNote': structured_note,
            'structuredClinicalNoteOriginal': record.get('structuredClinicalNoteOriginal'),
            'lastEditedAt': record.get('lastEditedAt'),
            'lastEditedBy': record.get('lastEditedBy'),
            'createdAt': record.get('createdAt'),
            'updatedAt': record.get('updatedAt'),
            'metaData': normalized_meta,
            'readOnly': record.get('status') in {'archived', 'locked'}
        }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'record': record_payload}, cls=DecimalEncoder, ensure_ascii=False)
        }

    except Exception as e:
        print(f"Error getting medical record: {e}")
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
