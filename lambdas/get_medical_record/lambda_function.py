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


def extract_field_order_from_json(format_json):
    """
    Extrae el orden de los campos del formato del médico.
    """
    try:
        if isinstance(format_json, str):
            template = json.loads(format_json)
        else:
            template = format_json

        if not isinstance(template, dict):
            return []

        # Si tiene estructura anidada, extraer de ahí
        if "estructura_historia_clinica" in template:
            nested = template.get("estructura_historia_clinica", {})
            if isinstance(nested, dict):
                return list(nested.keys())

        # Estructura plana
        return list(template.keys())

    except Exception as e:
        print(f"Warning: Could not extract field order: {e}")
        return []


def reorder_json_fields(json_str, doctor_id):
    """
    Reordena los campos de un JSON string según el formato del médico.
    Obtiene el formato del médico de DynamoDB para determinar el orden.
    """
    try:
        # Obtener el formato del médico
        doctors_table = dynamodb.Table('doctors')
        doctor_response = doctors_table.get_item(Key={'doctorID': doctor_id})

        field_order = []
        if 'Item' in doctor_response:
            doctor_data = doctor_response['Item']
            medical_record_structure = doctor_data.get('medical_record_structure')

            if medical_record_structure:
                field_order = extract_field_order_from_json(medical_record_structure)
                print(f"Extracted field order from doctor format: {field_order}")

        # Si no hay orden, retornar sin cambios
        if not field_order:
            print("No field order found, keeping original order")
            return json_str

        # Parsear y reordenar
        data = json.loads(json_str)

        if not isinstance(data, dict):
            return json_str

        ordered = {}

        # Verificar si tiene estructura anidada
        if "estructura_historia_clinica" in data:
            nested = data["estructura_historia_clinica"]
            if isinstance(nested, dict):
                reordered_nested = {}

                # Aplicar orden del formato del médico
                for field in field_order:
                    if field in nested:
                        reordered_nested[field] = nested[field]

                # Agregar campos adicionales
                for key, value in nested.items():
                    if key not in reordered_nested:
                        reordered_nested[key] = value

                # Agregar campos de nivel superior primero
                for key, value in data.items():
                    if key != "estructura_historia_clinica":
                        ordered[key] = value

                # Agregar la estructura reordenada
                ordered["estructura_historia_clinica"] = reordered_nested
            else:
                ordered = data
        else:
            # Estructura plana - aplicar orden del médico
            for field in field_order:
                if field in data:
                    ordered[field] = data[field]

            # Agregar campos adicionales
            for key, value in data.items():
                if key not in ordered:
                    ordered[key] = value

        # Convertir de vuelta a JSON string
        return json.dumps(ordered, ensure_ascii=False)

    except Exception as e:
        print(f"Warning: Could not reorder JSON fields: {e}")
        return json_str


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

        # Reordenar campos según el formato del médico
        doctor_id = record.get('doctorID')
        if doctor_id and structured_note:
            try:
                structured_note = reorder_json_fields(structured_note, doctor_id)
                print(f"Reordered fields for medical record {history_id}")
            except Exception as e:
                print(f"Warning: Could not reorder fields: {e}")

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
