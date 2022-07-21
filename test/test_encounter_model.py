"""
    Encounter model tests
"""

from app import app
from unittest import TestCase

from models import db, User, Encounter

from sqlalchemy.exc import IntegrityError, PendingRollbackError

import os
os.environ["DATABASE_URL"] = "postgresql:///monsters-test"


db.create_all()


class EncounterModelTestCase(TestCase):
    """Test the encounter model"""

    def setUp(self):
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

        e1 = Encounter(
            user_id=uid1,
            heroes='[{"num":"4","lvl":"1"}]',
            monsters='[{"id":72,"name":"Skeleton","cr":"1/4","xp":50,"num":2}]'
        )
        e2 = Encounter(
            user_id=uid1,
            heroes='[{"num":"2","lvl":"1"},{"num":"2","lvl":"2"}]',
            monsters='[{"id":72,"name":"Skeleton","cr":"1/4","xp":50,"num":2},{"id":4,"name":"Bat","cr":0,"xp":10,"num":5}]'
        )

        db.session.add_all([e1, e2])
        db.session.commit()

        self.e1 = e1
        self.e2 = e2

        self.client = app.test_client()

    def tearDown(self):
        res = super().tearDown()
        db.session.rollback()
        return res

    def test_encounter_model(self):
        """test the basic model"""

        e = Encounter(
            user_id=self.uid1,
            heroes='[{"num":"4","lvl":"5"}]',
            monsters='[{"id":230,"name":"Hill Giant","cr":5,"xp":1800,"num":1},{"id":196,"name":"Owlbear","cr":3,"xp":700,"num":1}]'
        )

        db.session.add(e)
        db.session.commit()

        # User should have no encounters
        self.assertEqual(len(self.u1.encounters), 3)

    def test_encounter_repr(self):
        self.assertEqual(
            self.e1.__repr__(),
            f'<Encounter {self.e1.id}: [{{"num":"4","lvl":"1"}}] // [{{"id":72,"name":"Skeleton","cr":"1/4","xp":50,"num":2}}]>'
        )