import os
import json
import boto3
from decimal import Decimal

from boto3.dynamodb.types import TypeDeserializer

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('medical-histories')

_type_deserializer = TypeDeserializer()
_dynamodb_type_keys = {'S', 'N', 'M', 'L', 'BOOL', 'NULL', 'SS', 'NS', 'BS'}

# Default section titles
DEFAULT_SECTION_TITLES = {
    'datos_personales': 'Datos personales',
    'motivo_consulta': 'Motivo consulta',
    'enfermedad_actual': 'Enfermedad actual',
    'antecedentes_relevantes': 'Antecedentes relevantes',
    'examen_fisico': 'Examen físico',
    'paraclinicos_imagenes': 'Paraclínicos e imágenes',
    'impresion_diagnostica': 'Impresión diagnóstica',
    'analisis_clinico': 'Análisis clínico',
    'plan_manejo': 'Plan de manejo',
    'notas_calidad_datos': 'Notas de calidad de datos'
}


def _normalize_dynamodb_json(value):
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


def lambda_handler(event, context):
    """
    Get a single medical history by ID

    Path Parameters:
    - historyID (required): History ID

    Returns complete medical history with:
    - Full jsonData (ordered sections)
    - Section titles (customizable)
    - Version information
    - Metadata
    """
    try:
        # Get historyID from path parameters
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

        # Get item from DynamoDB
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

        item = response['Item']
        
        # Normalize DynamoDB JSON types
        item['jsonData'] = _normalize_dynamodb_json(item.get('jsonData', {}))
        if 'metaData' in item:
            item['metaData'] = _normalize_dynamodb_json(item['metaData'])
        
        # Ensure section titles are present (merge with defaults if needed)
        section_titles = item.get('sectionTitles', {})
        if not section_titles:
            section_titles = DEFAULT_SECTION_TITLES.copy()
        else:
            # Merge with defaults to ensure all sections have titles
            merged_titles = DEFAULT_SECTION_TITLES.copy()
            merged_titles.update(section_titles)
            section_titles = merged_titles
        
        item['sectionTitles'] = section_titles
        
        # Add version metadata
        item['versionCount'] = item.get('versionCount', 0)
        item['updatedAt'] = item.get('updatedAt', item.get('createdAt'))

        # Return success response with full data
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'history': item
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
