import os
import json
import boto3

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

SYSTEM_PROMPT = """Eres un asistente médico experto que analiza historias clínicas en español.
Tu tarea es extraer información clave de una historia clínica en formato JSON.

Instrucciones:
1. Identifica el DIAGNÓSTICO PRINCIPAL de la historia clínica
2. Genera un RESUMEN BREVE de máximo 15 palabras que describa lo que pasó en la consulta
3. Responde ÚNICAMENTE en formato JSON sin texto adicional

Formato de respuesta (JSON):
{
  "diagnosis": "diagnóstico principal aquí",
  "summary": "resumen breve de máximo 15 palabras"
}

Ejemplos:
- diagnosis: "Hipertensión arterial no controlada"
- summary: "Paciente presenta hipertensión no controlada, se ajusta medicación y control en 2 semanas"

- diagnosis: "Diabetes tipo 2 descompensada"
- summary: "Descompensación glicémica con hiperglicemia, ajuste de insulina y dieta"

IMPORTANTE:
- El summary debe tener MÁXIMO 15 palabras
- Usa lenguaje médico profesional pero conciso
- NO incluyas nombres de pacientes ni datos personales
- Enfócate en el diagnóstico y plan de acción"""


def lambda_handler(event, context):
    """
    Generate diagnosis and summary from medical record using AWS Bedrock

    Input:
    {
        "jsonData": {...}  # Medical record JSON
    }

    Output:
    {
        "diagnosis": "string",
        "summary": "string (max 15 words)"
    }
    """
    try:
        # Parse input
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})

        json_data = body.get('jsonData')

        if not json_data:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'jsonData es requerido'})
            }

        print(f"[generate_summary] Generando resumen para historia clínica")

        # Prepare medical record as string
        medical_record_string = json.dumps(json_data, indent=2, ensure_ascii=False)

        # Get model ID from environment or use default
        model_id = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-haiku-20240307-v1:0')

        # Build request for Bedrock
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 500,
            "temperature": 0.3,
            "messages": [
                {
                    "role": "user",
                    "content": f"Analiza la siguiente historia clínica y extrae el diagnóstico principal y un resumen breve:\n\n{medical_record_string}"
                }
            ],
            "system": SYSTEM_PROMPT
        }

        print(f"[generate_summary] Invocando Bedrock con modelo: {model_id}")

        # Invoke Bedrock
        response = bedrock.invoke_model(
            modelId=model_id,
            contentType='application/json',
            accept='application/json',
            body=json.dumps(request_body)
        )

        # Parse response
        response_body = json.loads(response['body'].read())

        print(f"[generate_summary] Respuesta de Bedrock recibida")

        # Extract text from response
        content = response_body.get('content', [])
        if not content or len(content) == 0:
            raise Exception('Respuesta vacía de Bedrock')

        text = content[0].get('text', '')
        print(f"[generate_summary] Texto extraído: {text[:100]}...")

        # Parse JSON from text (handle markdown code blocks)
        try:
            # Try to find JSON in the text
            import re
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                summary_data = json.loads(json_match.group(0))
            else:
                summary_data = json.loads(text)
        except json.JSONDecodeError as e:
            print(f"[generate_summary] Error parseando JSON: {e}")
            print(f"[generate_summary] Texto recibido: {text}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'No se pudo parsear la respuesta del modelo',
                    'details': text
                })
            }

        # Validate response
        diagnosis = summary_data.get('diagnosis')
        summary = summary_data.get('summary')

        if not diagnosis or not summary:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Respuesta del modelo incompleta',
                    'data': summary_data
                })
            }

        # Validate summary word count (max 15 words)
        word_count = len(summary.strip().split())
        if word_count > 15:
            print(f"[generate_summary] Resumen excede 15 palabras ({word_count}), truncando...")
            words = summary.strip().split()
            summary = ' '.join(words[:15]) + '...'

        result = {
            'diagnosis': diagnosis,
            'summary': summary
        }

        print(f"[generate_summary] Resumen generado exitosamente")
        print(f"[generate_summary] Diagnosis: {diagnosis}")
        print(f"[generate_summary] Summary: {summary}")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
        }

    except Exception as e:
        print(f"[generate_summary] Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Error generando el resumen',
                'details': str(e)
            })
        }
