"""
    Encounter model tests
"""

from app import app
from unittest import TestCase

from models import db, User, Encounter

# from sqlalchemy.exc import IntegrityError, PendingRollbackError

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
        self.uid1 = 111

        u1 = User.signup("email1@email.com", "testuser1", "password")
        u1.id = self.uid1

        db.session.commit()

        self.e1id = 123
        self.e2id = 234

        e1 = Encounter(
            user_id=self.uid1,
            heroes='[{"num":"4","lvl":"1"}]',
            monsters='[{"id":72,"name":"Skeleton","cr":"1/4","xp":50,"num":2}]'
        )
        e1.id = 123

        e2 = Encounter(
            user_id=self.uid1,
            heroes='[{"num":"2","lvl":"1"},{"num":"2","lvl":"2"}]',
            monsters='[{"id":118,"name":"Copper Dragon Wyrmling","cr":1,"xp":200,"num":1},{"id":176,"name":"Swarm of Poisonous Snakes","cr":2,"xp":450,"num":1},{"id":112,"name":"Warhorse Skeleton","cr":"1/2","xp":100,"num":1},{"id":49,"name":"Acolyte","cr":"1/4","xp":50,"num":1}]'
        )
        e2.id = 234

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

        self.assertTrue(isinstance(e.id, int))
        self.assertEqual(len(self.u1.encounters), 3)

    def test_encounter_repr(self):
        self.assertEqual(
            self.e1.__repr__(),
            f'<Encounter 123: [{{"num":"4","lvl":"1"}}] // [{{"id":72,"name":"Skeleton","cr":"1/4","xp":50,"num":2}}]>'
        )

    def test_encounter_serialize(self):
        s1 = self.e1.serialize()

        # check that keys exist
        self.assertTrue('id' in s1.keys())
        self.assertTrue('user_id' in s1.keys())
        self.assertTrue('heroes' in s1.keys())
        self.assertTrue('monsters' in s1.keys())

        # check that keys have expected values
        self.assertEqual(s1['id'], self.e1id)
        self.assertEqual(s1['user_id'], self.uid1)
        self.assertEqual(
            s1['heroes'],
            '[{"num":"4","lvl":"1"}]'
        )
        self.assertEqual(
            s1['monsters'],
            '[{"id":72,"name":"Skeleton","cr":"1/4","xp":50,"num":2}]'
        )

    def test_encounter_summarize(self):
        summ = self.e1.summarize()

        self.assertEqual(summ,
            'Heroes x 4 vs. Skeleton x 2'
        )

        summ = self.e1.summarize(15)

        self.assertEqual(summ,
            'Heroes x 4 v...'
        )

        summ = self.e2.summarize()

        self.assertEqual(summ,
            'Heroes x 4 vs. Copper Dragon Wyrmling x 1, Swar...'
        )
