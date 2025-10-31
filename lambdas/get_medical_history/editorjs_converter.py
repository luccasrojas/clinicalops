"""
Utility functions to convert between JSON data and Editor.js format

This module provides bidirectional conversion between:
- jsonData: Flat JSON structure used by AI models
- editorData: Editor.js block-based format for rich editing
"""

import json
from typing import Dict, List, Any, Union


def _is_list_like(value: Any) -> bool:
    """Check if value should be rendered as a list"""
    return isinstance(value, (list, tuple)) and len(value) > 0


def _create_header_block(text: str, level: int = 2) -> Dict:
    """Create an Editor.js header block"""
    return {
        "type": "header",
        "data": {
            "text": text,
            "level": level
        }
    }


def _create_paragraph_block(text: str) -> Dict:
    """Create an Editor.js paragraph block"""
    return {
        "type": "paragraph",
        "data": {
            "text": str(text)
        }
    }


def _create_list_block(items: List[Any], ordered: bool = False) -> Dict:
    """Create an Editor.js list block"""
    list_items = []
    for item in items:
        if isinstance(item, dict):
            # Convert nested object to string representation
            list_items.append(json.dumps(item, ensure_ascii=False, indent=2))
        else:
            list_items.append(str(item))

    return {
        "type": "list",
        "data": {
            "style": "ordered" if ordered else "unordered",
            "items": list_items
        }
    }


def _format_field_name(key: str) -> str:
    """Format field name for display"""
    # Replace underscores with spaces and capitalize
    return key.replace('_', ' ').title()


def _process_nested_object(obj: Dict, blocks: List[Dict], level: int = 2):
    """Recursively process nested object into Editor.js blocks"""
    for key, value in obj.items():
        # Add header for this field
        blocks.append(_create_header_block(_format_field_name(key), level))

        if value is None or value == "":
            blocks.append(_create_paragraph_block("No especificado"))
        elif _is_list_like(value):
            # Check if list contains simple values or objects
            if all(isinstance(item, (str, int, float, bool)) for item in value):
                blocks.append(_create_list_block(value))
            else:
                # Complex list - render each item
                for i, item in enumerate(value):
                    if isinstance(item, dict):
                        _process_nested_object(item, blocks, level + 1)
                    else:
                        blocks.append(_create_paragraph_block(item))
        elif isinstance(value, dict):
            # Nested object - process recursively
            _process_nested_object(value, blocks, level + 1)
        else:
            # Simple value - paragraph
            blocks.append(_create_paragraph_block(value))


def json_to_editorjs(json_data: Dict[str, Any]) -> Dict:
    """
    Convert jsonData to Editor.js format

    Args:
        json_data: Flat or nested JSON structure

    Returns:
        Editor.js formatted data with blocks

    Example:
        >>> json_data = {
        ...     "diagnostico": "Hipertensión arterial",
        ...     "sintomas": ["Dolor de cabeza", "Mareos"],
        ...     "paciente": {"nombre": "Juan", "edad": 45}
        ... }
        >>> editorjs_data = json_to_editorjs(json_data)
    """
    import time

    blocks = []

    # Process each top-level field
    _process_nested_object(json_data, blocks, level=2)

    return {
        "time": int(time.time() * 1000),
        "blocks": blocks,
        "version": "2.31.0"
    }


def _extract_text_from_block(block: Dict) -> str:
    """Extract plain text from an Editor.js block"""
    block_type = block.get("type", "")
    data = block.get("data", {})

    if block_type == "header":
        return data.get("text", "")
    elif block_type == "paragraph":
        return data.get("text", "")
    elif block_type == "list":
        items = data.get("items", [])
        return " | ".join(items)  # Join list items
    else:
        # Unknown block type - try to extract text
        return str(data.get("text", ""))


def editorjs_to_json(editor_data: Dict) -> Dict[str, Any]:
    """
    Convert Editor.js format back to JSON structure

    This is a best-effort extraction. It attempts to reconstruct the
    original JSON structure based on headers and content.

    Args:
        editor_data: Editor.js formatted data

    Returns:
        Reconstructed JSON structure

    Example:
        >>> editor_data = {
        ...     "blocks": [
        ...         {"type": "header", "data": {"text": "Diagnostico", "level": 2}},
        ...         {"type": "paragraph", "data": {"text": "Hipertensión"}}
        ...     ]
        ... }
        >>> json_data = editorjs_to_json(editor_data)
    """
    blocks = editor_data.get("blocks", [])
    result = {}
    current_key = None
    current_values = []

    for block in blocks:
        block_type = block.get("type", "")
        data = block.get("data", {})

        if block_type == "header":
            # Header indicates a new field
            # Save previous field if exists
            if current_key and current_values:
                if len(current_values) == 1:
                    result[current_key] = current_values[0]
                else:
                    result[current_key] = current_values
                current_values = []

            # Start new field
            header_text = data.get("text", "")
            # Convert back to snake_case
            current_key = header_text.lower().replace(' ', '_')

        elif block_type == "paragraph":
            # Paragraph is content for current field
            text = data.get("text", "")
            if text and text != "No especificado":
                current_values.append(text)

        elif block_type == "list":
            # List items
            items = data.get("items", [])
            if items:
                # Try to parse JSON if items look like JSON objects
                parsed_items = []
                for item in items:
                    try:
                        parsed = json.loads(item)
                        parsed_items.append(parsed)
                    except:
                        parsed_items.append(item)
                current_values.extend(parsed_items if parsed_items else items)

    # Save last field
    if current_key and current_values:
        if len(current_values) == 1:
            result[current_key] = current_values[0]
        else:
            result[current_key] = current_values

    return result


def ensure_editorjs_format(data: Any) -> Dict:
    """
    Ensure data is in valid Editor.js format

    If data is already in Editor.js format, return as-is.
    Otherwise, convert from JSON.

    Args:
        data: Either Editor.js formatted data or plain JSON

    Returns:
        Valid Editor.js formatted data
    """
    if isinstance(data, dict) and "blocks" in data and "version" in data:
        # Already in Editor.js format
        return data
    elif isinstance(data, dict):
        # Plain JSON - convert
        return json_to_editorjs(data)
    else:
        # Invalid input
        raise ValueError(f"Cannot convert {type(data)} to Editor.js format")
