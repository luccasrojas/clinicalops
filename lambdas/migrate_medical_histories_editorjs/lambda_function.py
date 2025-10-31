"""
Lambda function to migrate existing medical histories to include editorData

This is a one-time migration script that:
1. Scans all medical histories
2. For each history with jsonData but no editorData
3. Generates editorData from jsonData
4. Updates the record

This lambda should be run once manually after deployment.
"""

import os
import json
import boto3
from datetime import datetime
from decimal import Decimal
from editorjs_converter import json_to_editorjs

dynamodb = boto3.resource('dynamodb')
histories_table = dynamodb.Table('medical-histories')


class DecimalEncoder(json.JSONEncoder):
    """Helper to convert DynamoDB Decimal types to Python types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj) if obj % 1 else int(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event, context):
    """
    Migrate medical histories to include editorData field

    This function can be invoked with optional parameters:
    - dryRun (bool): If true, only reports what would be migrated without updating
    - limit (int): Maximum number of records to process (default: all)

    Returns:
        Report of migration results
    """
    try:
        # Parse input
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {}) or {}

        dry_run = body.get('dryRun', False)
        limit = body.get('limit')

        print(f"Starting migration - Dry run: {dry_run}, Limit: {limit or 'None'}")

        # Statistics
        stats = {
            'total_scanned': 0,
            'needs_migration': 0,
            'migrated': 0,
            'errors': 0,
            'skipped': 0
        }

        # Scan table
        scan_kwargs = {}
        if limit:
            scan_kwargs['Limit'] = limit

        migrated_items = []
        error_items = []

        while True:
            response = histories_table.scan(**scan_kwargs)
            items = response.get('Items', [])

            for item in items:
                stats['total_scanned'] += 1
                history_id = item.get('historyID')

                # Check if migration needed
                has_json_data = 'jsonData' in item and item['jsonData']
                has_editor_data = 'editorData' in item and item['editorData']

                if has_json_data and not has_editor_data:
                    stats['needs_migration'] += 1

                    try:
                        # Generate editorData
                        json_data = item['jsonData']
                        editor_data = json_to_editorjs(json_data)

                        if dry_run:
                            print(f"[DRY RUN] Would migrate history {history_id}")
                            migrated_items.append({
                                'historyID': history_id,
                                'action': 'would_migrate'
                            })
                        else:
                            # Update the record
                            timestamp = datetime.utcnow().isoformat() + 'Z'
                            histories_table.update_item(
                                Key={'historyID': history_id},
                                UpdateExpression='SET editorData = :edata, updatedAt = :updated',
                                ExpressionAttributeValues={
                                    ':edata': editor_data,
                                    ':updated': timestamp
                                }
                            )
                            stats['migrated'] += 1
                            print(f"Migrated history {history_id}")
                            migrated_items.append({
                                'historyID': history_id,
                                'action': 'migrated'
                            })

                    except Exception as e:
                        stats['errors'] += 1
                        error_msg = f"Error migrating {history_id}: {str(e)}"
                        print(error_msg)
                        error_items.append({
                            'historyID': history_id,
                            'error': str(e)
                        })

                elif has_editor_data:
                    stats['skipped'] += 1
                    print(f"Skipped {history_id} - already has editorData")

                elif not has_json_data:
                    stats['skipped'] += 1
                    print(f"Skipped {history_id} - no jsonData to migrate")

            # Check if more pages
            if 'LastEvaluatedKey' not in response:
                break

            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']

        # Prepare result
        result = {
            'success': True,
            'dry_run': dry_run,
            'statistics': stats,
            'migrated_items': migrated_items if len(migrated_items) <= 50 else migrated_items[:50],
            'error_items': error_items,
            'message': f"Migration {'simulation' if dry_run else 'completed'}. "
                      f"Scanned: {stats['total_scanned']}, "
                      f"Needed migration: {stats['needs_migration']}, "
                      f"{'Would migrate' if dry_run else 'Migrated'}: {stats['migrated']}, "
                      f"Errors: {stats['errors']}, "
                      f"Skipped: {stats['skipped']}"
        }

        print(json.dumps(result, indent=2, cls=DecimalEncoder))

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result, cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Fatal error: {e}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Migration failed',
                'details': str(e)
            })
        }
