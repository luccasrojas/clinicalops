import os
from dotenv import load_dotenv
import openai
from datetime import datetime
import json

load_dotenv()

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

def generate_clinical_note(transcription, prompt, clinical_note_example):
    client = openai.OpenAI(api_key=OPENAI_API_KEY)

    temporal_context = generate_temporal_context()
    formatted_prompt = prompt.format(temporal_context=temporal_context, clinical_note_example=clinical_note_example)

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
    
    # Log the raw output for debugging
    print("Raw completion output:", completion.output[1].content[0].text)

    data = json.loads(completion.output[1].content[0].text, 
                      # to preserve order of keys in Python
                      object_pairs_hook=dict)
    
    # Debug: print the generated JSON data
    print("Generated clinical note JSON:", json.dumps(data, indent=2, ensure_ascii=False))

    return data


def lambda_handler(event, context):
    return {"statusCode": 200, "body": "OK"}
