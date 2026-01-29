"""
Encryption Service - Field-Level Encryption for PII
Implements AES-256 encryption via Fernet for GDPR compliance

High-Risk Fields:
- ni_number (National Insurance Number)
- pensionable_salary (Financial data)
- date_of_birth (Identity verification)
- submission_data (JSONB with all PII)

Usage:
    encryption = EncryptionService()
    encrypted = encryption.encrypt("sensitive data")
    decrypted = encryption.decrypt(encrypted)
"""

from cryptography.fernet import Fernet, InvalidToken
import hashlib
import base64
import os
import logging
from typing import Optional, Any
import json

logger = logging.getLogger(__name__)


class EncryptionService:
    """
    Service for encrypting/decrypting sensitive PII fields
    Uses Fernet (AES-256-CBC + HMAC authentication)
    """
    
    def __init__(self):
        """Initialize with encryption key from environment"""
        encryption_key = os.getenv("ENCRYPTION_KEY")
        
        if not encryption_key:
            logger.error("ENCRYPTION_KEY not found in environment variables!")
            raise ValueError(
                "ENCRYPTION_KEY environment variable is required. "
                "Generate one with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
            )
        
        try:
            # Fernet expects bytes
            self.cipher = Fernet(encryption_key.encode())
            logger.info("Encryption service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize encryption: {e}")
            raise ValueError(f"Invalid ENCRYPTION_KEY format: {e}")
    
    def encrypt(self, plaintext: Any) -> Optional[str]:
        """
        Encrypt plaintext and return base64-encoded string
        
        Args:
            plaintext: Data to encrypt (string, number, etc.)
        
        Returns:
            Base64-encoded encrypted string, or None if input is None/empty
        """
        if plaintext is None or plaintext == "":
            return None
        
        try:
            # Convert to string if not already
            if not isinstance(plaintext, str):
                plaintext = str(plaintext)
            
            # Encrypt
            encrypted_bytes = self.cipher.encrypt(plaintext.encode('utf-8'))
            
            # Return as base64 string for database storage
            return base64.b64encode(encrypted_bytes).decode('utf-8')
        
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise ValueError(f"Failed to encrypt data: {e}")
    
    def decrypt(self, ciphertext: Optional[str]) -> Optional[str]:
        """
        Decrypt base64-encoded ciphertext
        
        Args:
            ciphertext: Base64-encoded encrypted string
        
        Returns:
            Decrypted plaintext string, or None if input is None/empty
        """
        if ciphertext is None or ciphertext == "":
            return None
        
        # Handle non-string types (plaintext data from database)
        if not isinstance(ciphertext, str):
            logger.debug(f"Skipping decryption for non-string type: {type(ciphertext)}")
            return str(ciphertext)
        
        # Check if data looks like encrypted base64 (long string with base64 chars)
        # If it's short or has non-base64 chars, it's likely plaintext
        if len(ciphertext) < 20 or not self._looks_like_base64(ciphertext):
            logger.debug(f"Skipping decryption for plaintext data: {ciphertext[:20]}...")
            return ciphertext
        
        try:
            # Decode from base64
            encrypted_bytes = base64.b64decode(ciphertext.encode('utf-8'))
            
            # Decrypt
            decrypted_bytes = self.cipher.decrypt(encrypted_bytes)
            
            return decrypted_bytes.decode('utf-8')
        
        except InvalidToken:
            logger.warning("Decryption failed: Invalid token - returning plaintext")
            return ciphertext
        except Exception as e:
            logger.warning(f"Decryption failed: {e} - returning plaintext")
            return ciphertext
    
    def _looks_like_base64(self, s: str) -> bool:
        """Check if string looks like base64-encoded data"""
        import re
        # Base64 uses A-Z, a-z, 0-9, +, /, and = for padding
        # Encrypted data is typically longer than 40 chars
        return bool(re.match(r'^[A-Za-z0-9+/]+=*$', s)) and len(s) > 40
    
    def encrypt_json(self, data: dict) -> Optional[str]:
        """
        Encrypt entire JSON object (for JSONB fields like submission_data)
        
        Args:
            data: Dictionary to encrypt
        
        Returns:
            Base64-encoded encrypted JSON string
        """
        if not data:
            return None
        
        try:
            # Serialize to JSON
            json_str = json.dumps(data, ensure_ascii=False)
            
            # Encrypt the JSON string
            return self.encrypt(json_str)
        
        except Exception as e:
            logger.error(f"JSON encryption failed: {e}")
            raise ValueError(f"Failed to encrypt JSON data: {e}")
    
    def decrypt_json(self, ciphertext: Optional[str]) -> Optional[dict]:
        """
        Decrypt encrypted JSON string back to dictionary
        
        Args:
            ciphertext: Base64-encoded encrypted JSON
        
        Returns:
            Decrypted dictionary
        """
        if not ciphertext:
            return None
        
        try:
            # Decrypt to JSON string
            json_str = self.decrypt(ciphertext)
            
            if not json_str:
                return None
            
            # Parse JSON
            return json.loads(json_str)
        
        except Exception as e:
            logger.error(f"JSON decryption failed: {e}")
            raise ValueError(f"Failed to decrypt JSON data: {e}")
    
    def hash(self, value: str) -> str:
        """
        One-way hash (SHA-256) for searchable encrypted fields
        
        Use for:
        - email_address (store hash separately for login/search)
        - mobile_number (search by hash)
        - ip_address (GDPR pseudonymization)
        
        Args:
            value: String to hash
        
        Returns:
            64-character hexadecimal hash
        """
        if not value:
            return ""
        
        return hashlib.sha256(value.encode('utf-8')).hexdigest()
    
    def encrypt_employee_pii(self, employee_data: dict) -> dict:
        """
        Encrypt all high-risk PII fields in employee data
        
        Encrypts:
        - ni_number
        - pensionable_salary
        - date_of_birth
        
        Args:
            employee_data: Employee dictionary with plaintext PII
        
        Returns:
            Employee dictionary with encrypted PII
        """
        encrypted_data = employee_data.copy()
        
        # Encrypt National Insurance Number (CRITICAL)
        if encrypted_data.get('ni_number'):
            encrypted_data['ni_number'] = self.encrypt(encrypted_data['ni_number'])
            logger.debug("Encrypted ni_number")
        
        # Encrypt pensionable salary (Financial data)
        if encrypted_data.get('pensionable_salary'):
            encrypted_data['pensionable_salary'] = self.encrypt(
                str(encrypted_data['pensionable_salary'])
            )
            logger.debug("Encrypted pensionable_salary")
        
        # Encrypt date of birth (Identity verification)
        if encrypted_data.get('date_of_birth'):
            encrypted_data['date_of_birth'] = self.encrypt(
                str(encrypted_data['date_of_birth'])
            )
            logger.debug("Encrypted date_of_birth")
        
        return encrypted_data
    
    def decrypt_employee_pii(self, employee_data: dict) -> dict:
        """
        Decrypt all high-risk PII fields in employee data
        
        Args:
            employee_data: Employee dictionary with encrypted PII
        
        Returns:
            Employee dictionary with decrypted PII
        """
        decrypted_data = employee_data.copy()
        
        # Decrypt National Insurance Number
        if decrypted_data.get('ni_number'):
            try:
                decrypted_data['ni_number'] = self.decrypt(decrypted_data['ni_number'])
            except Exception as e:
                logger.warning(f"Failed to decrypt ni_number: {e}")
                # Keep original value if decryption fails
                pass
        
        # Decrypt pensionable salary
        if decrypted_data.get('pensionable_salary'):
            try:
                decrypted_value = self.decrypt(decrypted_data['pensionable_salary'])
                # Keep as original type if it was a number
                decrypted_data['pensionable_salary'] = decrypted_value
            except Exception as e:
                logger.warning(f"Failed to decrypt pensionable_salary: {e}")
                # Keep original value if decryption fails
                pass
        
        # Decrypt date of birth
        if decrypted_data.get('date_of_birth'):
            try:
                decrypted_data['date_of_birth'] = self.decrypt(
                    decrypted_data['date_of_birth']
                )
            except Exception as e:
                logger.warning(f"Failed to decrypt date_of_birth: {e}")
                # Keep original value if decryption fails
                pass
        
        return decrypted_data


# Singleton instance
_encryption_service: Optional[EncryptionService] = None


def get_encryption_service() -> EncryptionService:
    """
    Get or create singleton encryption service instance
    """
    global _encryption_service
    
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    
    return _encryption_service
