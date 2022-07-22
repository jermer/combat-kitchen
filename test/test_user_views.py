"""
    User view tests
"""

from unittest import TestCase

from models import db, User, Encounter

# from sqlalchemy.exc import IntegrityError, PendingRollbackError
from flask import request

import os
os.environ["DATABASE_URL"] = "postgresql:///monsters-test"

from app import app, CURR_USER_KEY

db.create_all()

# Don't have WTForms use CSRF
app.config["WTF_CSRF_ENABLED"] = False


class UserViewTestCase(TestCase):
    """Test the routes and views for users"""

    def setUp(self) -> None:

        User.query.delete()

        self.client = app.test_client()

        # self.testuser = User.signup(
        #     username="testuser",
        #     email="test@test.com",
        #     password="testuser",
        #     image_url=None,
        # )
        # self.testuser_id = 8989
        # self.testuser.id = self.testuser_id

        """User.signup( email, username, password )"""
        self.u1 = User.signup("test1@test.com", "username_abc", "password")
        self.u1_id = 777
        self.u1.id = self.u1_id

        self.u2 = User.signup("test2@test.com", "username_efg", "password")
        self.u2_id = 888
        self.u2.id = self.u2_id

        # self.u3 = User.signup("hij", "test3@test.com", "password", None)
        # self.u4 = User.signup("testing", "test4@test.com", "password", None)

        db.session.commit()


    def tearDown(self):
        resp = super().tearDown()
        db.session.rollback()
        return resp

    def test_signup(self):
        with self.client as c:
            resp = c.get("/signup")
            self.assertIn(
                '<h2 class="join-message">Register a new account</h2>', str(resp.data))

    def test_login(self):
        with self.client as c:
            resp = c.get("/login")
            self.assertIn('<h2 class="join-message">Log in</h2>',
                          str(resp.data))

    # def test_logout(self):
    #     with self.client as c:
    #         resp = c.get("/login")
    #         self.assertIn( '<h2 class="join-message">Log in</h2>', str(resp.data) )

    def test_authorized_user_page(self):
        with self.client as c:
            with c.session_transaction() as sess:
                sess[CURR_USER_KEY] = self.u1_id

            self.assertTrue(True)

            resp = c.get(f"/users/{self.u1_id}", follow_redirects=True)

            self.assertEqual(resp.status_code, 200)
            
            self.assertIn('username_abc', str(resp.data))
