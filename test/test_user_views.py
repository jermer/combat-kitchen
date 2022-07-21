"""
    User view tests
"""

from unittest import TestCase

from models import db, User, Encounter

from sqlalchemy.exc import IntegrityError, PendingRollbackError

import os
os.environ["DATABASE_URL"] = "postgresql:///monsters-test"

from app import app

db.create_all()
