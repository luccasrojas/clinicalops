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
    # CORS headers for browser requests
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "POST,OPTIONS"
    }
    
    try:
        # Handle preflight OPTIONS request
        if event.get('httpMethod') == 'OPTIONS':
            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({"message": "CORS preflight"})
            }
        
        # Only allow POST method
        if event.get('httpMethod') != 'POST':
            return {
                "statusCode": 405,
                "headers": headers,
                "body": json.dumps({"error": "Method not allowed. Use POST."})
            }
        
        # Parse request body
        if not event.get('body'):
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": "Request body is required"})
            }
        
        try:
            body = json.loads(event['body'])
        except json.JSONDecodeError:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": "Invalid JSON in request body"})