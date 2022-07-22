"""
    User model tests
"""

from unittest import TestCase

from models import db, User, Encounter

from sqlalchemy.exc import IntegrityError, PendingRollbackError

import os
os.environ["DATABASE_URL"] = "postgresql:///monsters-test"

from app import app

db.create_all()


class UserModelTestCase(TestCase):
    """Test the user model"""

    def setUp(self) -> None:
        """Create test client and add sample data."""

        User.query.delete()
        Encounter.query.delete()

        """User.signup( email, username, password )"""
        u1 = User.signup("email1@email.com", "testuser1", "password")
        uid1 = 111
        u1.id = uid1

        db.session.commit()

        self.u1 = u1
        self.uid1 = uid1

        self.client = app.test_client()

    def tearDown(self):
        resp = super().tearDown()
        db.session.rollback()
        return resp

    def test_user_model(self):
        """test the basic model"""

        u = User(username="testuser", email="test@test.com",
                 password="HASHED_PASSWORD")

        db.session.add(u)
        db.session.commit()

        # User should have no encounters
        self.assertEqual(len(u.encounters), 0)

    def test_user_repr(self):
        self.assertEqual(
            self.u1.__repr__(),
            f'<User #{self.u1.id}: email1@email.com>'
        )

    def test_signup(self):
        """sign up a new user with valid inputs"""

        new_user = User.signup(
            "newtestuser@test.com",
            "newtestuser",
            "HASHED_PASSWORD"
        )
        # set the id explicitly
        new_uid = 12345
        new_user.id = new_uid
        db.session.commit()

        test_user = User.query.get(new_uid)

        self.assertIsNotNone(test_user)
        self.assertEqual(new_user.username, test_user.username)
        self.assertEqual(new_user.email, test_user.email)
        self.assertEqual(new_user.password, test_user.password)
        self.assertNotEqual("password", test_user.username)
        self.assertTrue(test_user.password.startswith("$2b$"))

    def test_no_email(self):
        """attempt to create new user with no email"""

        with self.assertRaises(IntegrityError) as context:
            new_user = User.signup(
                None,
                "newtestuser",
                "HASHED_PASSWORD"
            )
            db.session.commit()

        with self.assertRaises(PendingRollbackError) as context:
            new_user = User.signup(
                "",
                "newtestuser",
                "HASHED_PASSWORD"
            )
            db.session.commit()

    def test_duplicate_email(self):
        """attempt to create new user with duplicate email"""

        with self.assertRaises(IntegrityError) as context:
            new_user = User.signup(
                self.u1.email,
                "newtestuser",
                "HASHED_PASSWORD"
            )
            db.session.commit()

    def test_no_username(self):
        """attempt to create new user with no username"""

        with self.assertRaises(IntegrityError) as context:
            new_user = User.signup(
                "newtestuser@test.com",
                None,
                "HASHED_PASSWORD"
            )
            db.session.commit()

        with self.assertRaises(PendingRollbackError) as context:
            new_user = User.signup(
                "newtestuser@test.com",
                "",
                "HASHED_PASSWORD"
            )
            db.session.commit()

    def test_duplicate_username(self):
        """attempt to create new user with duplicate username"""

        with self.assertRaises(IntegrityError) as context:
            User.signup(
                "newtestuser@test.com",
                self.u1.username,
                "HASHED_PASSWORD"
            )
            db.session.commit()

    def test_invalid_password(self):
        """attempt to create a new user with no password"""

        with self.assertRaises(ValueError) as context:
            new_user = User.signup(
                "newtestuser@test.com",
                "newtestuser",
                None
            )

        with self.assertRaises(ValueError) as context:
            new_user = User.signup(
                "newtestuser@test.com",
                "newtestuser",
                ""
            )

    def test_authentication(self):
        """test correct authentication"""
        test_user = User.authenticate(self.u1.username, "password")
        self.assertIsNotNone(test_user)
        self.assertEqual(self.uid1, test_user.id)

    def test_bad_password(self):
        """test authentication with incorrect password"""
        test_user = User.authenticate(self.u1.username, "wrongpassword")
        self.assertFalse(test_user)

    def test_bad_username(self):
        """test authentication with unknown username"""
        test_user = User.authenticate("unknown_username", "password")
        self.assertFalse(test_user)
