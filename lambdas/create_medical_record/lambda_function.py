import os
import openai
from datetime import datetime
import json

from prompts import SYSTEM_PROMPT, CLINICAL_NOTE_EXAMPLE, DEFAULT_MEDICAL_RECORD_FORMAT

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

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
            body.get('example_format') or
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
