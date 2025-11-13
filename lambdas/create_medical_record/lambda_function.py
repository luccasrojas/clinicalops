import os
import openai
from datetime import datetime
import json

from prompts import SYSTEM_PROMPT, CLINICAL_NOTE_EXAMPLE, DEFAULT_MEDICAL_RECORD_FORMAT

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def extract_field_order(format_template):
    """
    Extrae el orden de los campos del template de formato del médico.
    Soporta tanto JSON string como dict.
    """
    try:
        if isinstance(format_template, str):
            # Intentar parsear como JSON
            template = json.loads(format_template)
        else:
            template = format_template

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
        print(f"Warning: Could not extract field order from format: {e}")
        return []


def reorder_medical_record(data, field_order):
    """
    Reordena los campos del registro médico según el orden del formato del médico.
    Maneja tanto estructura plana como anidada (estructura_historia_clinica).
    Preserva campos adicionales al final si existen.

    Args:
        data: Diccionario con los datos del registro médico
        field_order: Lista con el orden esperado de campos
    """
    if not isinstance(data, dict) or not field_order:
        return data

    ordered = {}

    # Verificar si tiene estructura anidada
    if "estructura_historia_clinica" in data:
        # Reordenar el contenido anidado
        nested = data["estructura_historia_clinica"]
        if isinstance(nested, dict):
            reordered_nested = {}

            # Aplicar orden del formato del médico
            for field in field_order:
                if field in nested:
                    reordered_nested[field] = nested[field]

            # Agregar campos adicionales que GPT-5 haya generado
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
            ordered = data.copy()
    else:
        # Estructura plana - aplicar orden del formato del médico
        for field in field_order:
            if field in data:
                ordered[field] = data[field]

        # Agregar campos adicionales que GPT-5 haya generado
        for key, value in data.items():
            if key not in ordered:
                ordered[key] = value

    return ordered

def generate_temporal_context():
    meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ]
    dias = [
        "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"
    ]

    hoy = datetime.now()
    dia_semana = dias[hoy.weekday()]
    mes = meses[hoy.month - 1]
    fecha = f"{hoy.day} de {mes} de {hoy.year} {hoy.strftime('%H:%M')}"
    return f"hoy es {dia_semana}, {fecha}."

def generate_medical_record(transcription, medical_record_example, medical_record_format):
    client = openai.OpenAI(api_key=OPENAI_API_KEY)

    temporal_context = generate_temporal_context()

    try:
        medical_record_example = json.dumps(medical_record_example, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Nota clínica no es un JSON válido, contiunando como texto plano: {e}")
    medical_record_example = medical_record_example.replace("{", "{{")
    medical_record_example = medical_record_example.replace("}", "}}")
    
    try:
        medical_record_format = json.dumps(medical_record_format, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Formato de historia clínica no es un JSON válido, contiunando como texto plano: {e}")

    medical_record_format = medical_record_format.replace("{", "{{")
    medical_record_format = medical_record_format.replace("}", "}}")
    
    formatted_prompt = SYSTEM_PROMPT.format(temporal_context=temporal_context, medical_record_example=medical_record_example, medical_record_format=medical_record_format)

    completion = client.responses.create(
        model="gpt-5",
        reasoning={"effort": "minimal"},
        input=[
            {
                "role": "system",
                "content": formatted_prompt,
            },
            {
                "role": "user",
                "content": (
                    transcription
                ),
            },
        ],
        text={"format": {"type": "json_object"}},
    )
    
    data = json.loads(completion.output[1].content[0].text,
                      object_pairs_hook=dict)

    # Extraer el orden de campos del formato del médico y reordenar
    field_order = extract_field_order(medical_record_format)
    if field_order:
        print(f"Reordering fields according to doctor's format: {field_order}")
        data = reorder_medical_record(data, field_order)
    else:
        print("Warning: Could not extract field order, keeping GPT-5 output order")

    return data


def lambda_handler(event, context):
    try:
        # Parse input - handle both direct invocation and API Gateway format
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', event)  # Fallback to event itself for direct invocation

        transcription = body.get('transcription')

        if not transcription:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'transcription is required'})
            }

        # Get example format - can be 'example_format' or 'medical_record_example'
        medical_record_example = (
            body.get('medical_record_example') or
            CLINICAL_NOTE_EXAMPLE
        )
        medical_record_format = body.get('medical_record_format', DEFAULT_MEDICAL_RECORD_FORMAT)

        medical_record = generate_medical_record(transcription, medical_record_example, medical_record_format)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'medical_record': medical_record})
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
