"""
    User model tests
"""

from unittest import TestCase

from models import db, User, Encounter

import os
uri = os.environ.get(
    "DATABASE_URL", 'postgresql:///monsters-test')

if uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)

from app import app
db.create_all()

class UserModelTestCase(TestCase):
    """Test the user model"""

    def setUp(self):
        """Create test client and add sample data."""

        User.query.delete()
        Encounter.query.delete()

        """User.signup( email, username, password )"""
        u1 = User.signup("email1@email.com", "testuser1", "password")
        uid1 = 111
        u1.id = uid1

        u2 = User.signup("email2@email.com", "testuser2", "password")
        uid2 = 222
        u2.id = uid2

        db.session.commit()

        self.u1 = u1
        self.uid1 = uid1

        self.u2 = u2
        self.uid2 = uid2

        self.client = app.test_client()

    def tearDown(self):
        res = super().tearDown()
        db.session.rollback()
        return res

    def test_user_model(self):
        """Does basic model work?"""

        u = User(username="testuser", email="test@test.com", password="HASHED_PASSWORD")

        db.session.add(u)
        db.session.commit()

        # User should have no encounters
        self.assertEqual(len(u.encounters), 0)

