"""
Input Sanitization Middleware
Sanitizes user input to prevent XSS, SQL injection, and other attacks
"""
from typing import Any, Dict
import bleach
import re
from pydantic import BaseModel


def sanitize_string(value: str, allow_html: bool = False) -> str:
    """
    Sanitize a string value
    
    Args:
        value: String to sanitize
        allow_html: If True, allows safe HTML tags (for rich text fields)
    
    Returns:
        Sanitized string
    """
    if not isinstance(value, str):
        return value
    
    # Strip leading/trailing whitespace
    value = value.strip()
    
    if allow_html:
        # Allow only safe HTML tags
        allowed_tags = ['b', 'i', 'u', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li']
        allowed_attrs = {}
        value = bleach.clean(value, tags=allowed_tags, attributes=allowed_attrs, strip=True)
    else:
        # Strip all HTML tags
        value = bleach.clean(value, tags=[], strip=True)
    
    # Remove null bytes (potential SQL injection)
    value = value.replace('\x00', '')
    
    # Normalize Unicode (prevent homograph attacks)
    value = value.encode('utf-8', errors='ignore').decode('utf-8')
    
    return value


def sanitize_email(value: str) -> str:
    """
    Sanitize email address
    """
    value = sanitize_string(value)
    
    # Basic email validation (Pydantic will do full validation)
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', value):
        return value
    
    return value.lower()


def sanitize_dict(data: Dict[str, Any], allow_html_fields: list = None) -> Dict[str, Any]:
    """
    Recursively sanitize all string values in a dictionary
    
    Args:
        data: Dictionary to sanitize
        allow_html_fields: List of field names that can contain HTML
    
    Returns:
        Sanitized dictionary
    """
    if allow_html_fields is None:
        allow_html_fields = []
    
    sanitized = {}
    
    for key, value in data.items():
        if isinstance(value, str):
            # Check if this field allows HTML
            allow_html = key in allow_html_fields
            sanitized[key] = sanitize_string(value, allow_html=allow_html)
        elif isinstance(value, dict):
            sanitized[key] = sanitize_dict(value, allow_html_fields)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_dict(item, allow_html_fields) if isinstance(item, dict)
                else sanitize_string(item, False) if isinstance(item, str)
                else item
                for item in value
            ]
        else:
            sanitized[key] = value
    
    return sanitized


def validate_uuid(value: str) -> bool:
    """
    Validate UUID format to prevent injection
    """
    uuid_pattern = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    return bool(uuid_pattern.match(value))


def validate_alphanumeric(value: str, allow_spaces: bool = False) -> bool:
    """
    Validate that string contains only alphanumeric characters
    """
    if allow_spaces:
        pattern = r'^[a-zA-Z0-9\s]+$'
    else:
        pattern = r'^[a-zA-Z0-9]+$'
    
    return bool(re.match(pattern, value))


# Size limits to prevent DoS attacks
MAX_STRING_LENGTH = 10000
MAX_JSON_SIZE = 1_000_000  # 1 MB


def validate_size(value: Any) -> bool:
    """
    Validate that input is not too large (prevent DoS)
    """
    if isinstance(value, str):
        return len(value) <= MAX_STRING_LENGTH
    elif isinstance(value, (dict, list)):
        import json
        try:
            json_str = json.dumps(value)
            return len(json_str) <= MAX_JSON_SIZE
        except:
            return False
    return True
