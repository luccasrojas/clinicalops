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
    transcription = event['transcription']

    medical_record_example = event['medical_record_example'] if 'medical_record_example' in event else CLINICAL_NOTE_EXAMPLE
    medical_record_format = event['medical_record_format'] if 'medical_record_format' in event else DEFAULT_MEDICAL_RECORD_FORMAT
    
    return generate_medical_record(transcription, medical_record_example, medical_record_format)
