import os
import openai
import json

from prompts import EXTRACT_STRUCTURE_SYSTEM_PROMPT

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def generate_structure_from_medical_record(medical_record_example):

    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    completion = client.responses.create(
        model="gpt-5",
        reasoning={"effort": "minimal"},
        input=[
            {
                "role": "system",
                "content": EXTRACT_STRUCTURE_SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": (
                    medical_record_example
                ),
            },
        ],
        text={"format": {"type": "json_object"}},
    )
    data = json.loads(completion.output[1].content[0].text)
    return data

def lambda_handler(event, context):
    medical_record_example = event['medical_record_example']

    return generate_structure_from_medical_record(medical_record_example)
