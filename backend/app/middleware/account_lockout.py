"""
Account Lockout Middleware
Tracks failed login attempts and locks accounts after threshold
"""
from datetime import datetime, timedelta
from typing import Dict
import logging

logger = logging.getLogger(__name__)

# In-memory storage for failed login attempts
# Format: { email: { 'attempts': int, 'locked_until': datetime, 'last_attempt': datetime } }
failed_login_attempts: Dict[str, Dict] = {}

# Configuration
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION = timedelta(minutes=15)
ATTEMPT_WINDOW = timedelta(minutes=5)  # Reset counter if no attempts in 5 minutes


def check_account_locked(email: str) -> tuple[bool, str | None]:
    """
    Check if account is locked due to failed login attempts
    
    Returns:
        (is_locked: bool, message: str | None)
    """
    email_lower = email.lower()
    
    if email_lower not in failed_login_attempts:
        return False, None
    
    attempt_data = failed_login_attempts[email_lower]
    
    # Check if account is currently locked
    if 'locked_until' in attempt_data and attempt_data['locked_until']:
        if datetime.utcnow() < attempt_data['locked_until']:
            remaining = (attempt_data['locked_until'] - datetime.utcnow()).total_seconds() / 60
            logger.warning(f"Account locked for {email_lower}: {remaining:.1f} minutes remaining")
            return True, f"Account locked due to too many failed attempts. Try again in {int(remaining) + 1} minutes."
        else:
            # Lockout expired - reset
            logger.info(f"Lockout expired for {email_lower}, resetting counter")
            del failed_login_attempts[email_lower]
            return False, None
    
    # Check if attempts are stale (reset counter if no attempts in 5 minutes)
    if 'last_attempt' in attempt_data:
        time_since_last = datetime.utcnow() - attempt_data['last_attempt']
        if time_since_last > ATTEMPT_WINDOW:
            logger.info(f"Resetting stale attempt counter for {email_lower}")
            del failed_login_attempts[email_lower]
            return False, None
    
    return False, None


def record_failed_login(email: str) -> None:
    """
    Record a failed login attempt and lock account if threshold exceeded
    """
    email_lower = email.lower()
    
    if email_lower not in failed_login_attempts:
        failed_login_attempts[email_lower] = {
            'attempts': 1,
            'last_attempt': datetime.utcnow()
        }
        logger.warning(f"Failed login attempt 1/{MAX_FAILED_ATTEMPTS} for {email_lower}")
    else:
        attempt_data = failed_login_attempts[email_lower]
        attempt_data['attempts'] += 1
        attempt_data['last_attempt'] = datetime.utcnow()
        
        attempts = attempt_data['attempts']
        logger.warning(f"Failed login attempt {attempts}/{MAX_FAILED_ATTEMPTS} for {email_lower}")
        
        # Lock account if threshold exceeded
        if attempts >= MAX_FAILED_ATTEMPTS:
            attempt_data['locked_until'] = datetime.utcnow() + LOCKOUT_DURATION
            logger.error(
                f"Account locked for {email_lower} after {attempts} failed attempts. "
                f"Locked until {attempt_data['locked_until']}"
            )


def record_successful_login(email: str) -> None:
    """
    Clear failed login attempts after successful login
    """
    email_lower = email.lower()
    
    if email_lower in failed_login_attempts:
        attempts = failed_login_attempts[email_lower].get('attempts', 0)
        logger.info(f"Successful login for {email_lower}, clearing {attempts} failed attempts")
        del failed_login_attempts[email_lower]


def clear_lockout(email: str) -> None:
    """
    Manually clear lockout for an account (admin function)
    """
    email_lower = email.lower()
    
    if email_lower in failed_login_attempts:
        logger.info(f"Manually clearing lockout for {email_lower}")
        del failed_login_attempts[email_lower]
