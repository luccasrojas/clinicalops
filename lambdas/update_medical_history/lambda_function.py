import os
import json
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
histories_table = dynamodb.Table('medical-histories')
versions_table = dynamodb.Table('medical-histories-versions')

# Common section titles (for reference, but sections can vary)
COMMON_SECTION_TITLES = {
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


def _generate_title_from_key(key):
    """Generate a human-readable title from a section key"""
    # Check if we have a common title
    if key in COMMON_SECTION_TITLES:
        return COMMON_SECTION_TITLES[key]
    
    # Otherwise, convert snake_case to Title Case
    return ' '.join(word.capitalize() for word in key.replace('_', ' ').split())


class DecimalEncoder(json.JSONEncoder):
    """Helper to convert DynamoDB Decimal types to Python types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj) if obj % 1 else int(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event, context):
    """
    Update a medical history and create a version record

    Expected input:
    {
        "historyID": "string",
        "jsonData": {...},  # Updated medical history JSON
        "metaData": {...},  # Optional: updated metadata
        "sectionTitles": {...},  # Optional: custom section titles
        "changeDescription": "string"  # Optional: description of changes made
    }

    Process:
    1. Get current version from medical-histories table
    2. Save current version to medical-histories-versions table with change tracking
    3. Update medical-histories table with new data preserving section order
    4. Return updated history
    """
    try:
        # Parse input
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})

        history_id = body.get('historyID')
        new_json_data = body.get('jsonData')
        new_metadata = body.get('metaData')
        section_titles = body.get('sectionTitles', {})
        change_description = body.get('changeDescription', 'Historia clínica actualizada')

        # Validate required fields
        if not history_id or not new_json_data:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'historyID and jsonData are required'})
            }

        # Get current history
        response = histories_table.get_item(Key={'historyID': history_id})

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Medical history not found'})
            }

        current_history = response['Item']
        current_json_data = current_history.get('jsonData', {})
        current_section_titles = current_history.get('sectionTitles', {})

        # Detect changes between current and new data
        changes = _detect_changes(current_json_data, new_json_data)

        # Create version record with current data
        version_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + 'Z'

        version_record = {
            'versionID': version_id,
            'historyID': history_id,
            'createdAt': timestamp,
            'jsonData': current_json_data,
            'metaData': current_history.get('metaData', {}),
            'sectionTitles': current_section_titles,
            'changeDescription': change_description,
            'changedSections': changes
        }

        # Save version
        versions_table.put_item(Item=version_record)

        # Generate section titles for all sections in new data
        # Preserve existing custom titles, generate defaults for new sections
        merged_section_titles = current_section_titles.copy()
        for section_key in new_json_data.keys():
            if section_key not in merged_section_titles:
                merged_section_titles[section_key] = _generate_title_from_key(section_key)
        
        # Update with any custom titles provided in the request
        merged_section_titles.update(section_titles)

        # Update medical history with new data (preserve order from input)
        update_expression = "SET jsonData = :json, updatedAt = :updated, sectionTitles = :titles, versionCount = if_not_exists(versionCount, :zero) + :one"
        expression_values = {
            ':json': new_json_data,  # Preserve order as provided
            ':updated': timestamp,
            ':titles': merged_section_titles,
            ':zero': 0,
            ':one': 1
        }

        # Update metadata if provided
        if new_metadata:
            update_expression += ", metaData = :meta"
            expression_values[':meta'] = new_metadata

        histories_table.update_item(
            Key={'historyID': history_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )

        # Get updated history
        updated_response = histories_table.get_item(Key={'historyID': history_id})
        updated_history = updated_response['Item']

        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'history': updated_history,
                'versionID': version_id,
                'changedSections': changes,
                'message': 'Medical history updated successfully'
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


def _detect_changes(old_data, new_data):
    """
    Detect which sections changed between old and new data
    Returns list of changed section names
    """
    changes = []
    
    # Check all sections in new data
    for section in new_data:
        if section not in old_data:
            changes.append(section)
        elif json.dumps(old_data[section], sort_keys=True) != json.dumps(new_data[section], sort_keys=True):
            changes.append(section)
    
    # Check for removed sections
    for section in old_data:
        if section not in new_data and section not in changes:
            changes.append(section)
    
    return changes
