"""
    Monster view tests
"""

from unittest import TestCase

from models import db, Monster, SpecialAbility, Action, LegendaryAction

# from sqlalchemy.exc import IntegrityError, PendingRollbackError
from flask import request

import os
os.environ["DATABASE_URL"] = "postgresql:///monsters-test"

from app import app

db.create_all()

# Don't have WTForms use CSRF
app.config["WTF_CSRF_ENABLED"] = False


class MonsterViewTestCase(TestCase):
    """Test the routes and views for monsters"""

    def setUp(self):
        """Create test client and add sample data."""

        Monster.query.delete()
        SpecialAbility.query.delete()
        Action.query.delete()
        LegendaryAction.query.delete()

        self.m1_id = 111
        self.m2_id = 222

        m1 = Monster(
            id=self.m1_id,
            name="Python",
            size="medium",
            type="beast",
            armor_class=15,
            hit_points=50,
            hit_dice="5d6+7",
            strength=8,
            dexterity=10,
            constitution=12,
            intelligence=15,
            wisdom=17,
            charisma=19,
            challenge_rating=0.5,
            xp=1000
        )
        db.session.add(m1)

        m2 = Monster(
            id=self.m2_id,
            name="Unicorn",
            size="large",
            type="monstrosity",
            subtype="horse",
            armor_class=15,
            hit_points=50,
            hit_dice="5d6+7",
            strength=10,
            dexterity=11,
            constitution=12,
            intelligence=13,
            wisdom=14,
            charisma=15,
            challenge_rating=4,
            xp=1000
        )
        db.session.add(m2)

        db.session.commit()

        self.m1 = m1
        self.m2 = m2

        self.client = app.test_client()

    def tearDown(self):
        res = super().tearDown()
        db.session.rollback()
        return res

    def test_home_page(self):
        with self.client as c:
            resp = c.get("/")

            self.assertEqual(resp.status_code, 200)

            # check for page components
            self.assertIn("<h5>HEROES</h5>", str(resp.data))
            self.assertIn("enter search string...", str(resp.data))

            # check for monster data
            # self.assertIn( "Python", str(resp.data))
            # self.assertIn( "Unicorn", str(resp.data))

    def test_api_all_monsters(self):
        with self.client as c:

            resp = c.get("/api/monsters")

            self.assertEqual(resp.status_code, 200)

            # check for monster data
            self.assertIn( "Python", str(resp.data))
            self.assertIn( "Unicorn", str(resp.data))

    def test_api_filter_cr(self):
        with self.client as c:
            # should filter out 'python' and keep 'unicorn'
            query_string={'min_cr': '3'}
            resp = c.get("/api/monsters", query_string=query_string)

            self.assertEqual( resp.status_code, 200)

            self.assertNotIn( "Python", str(resp.data))
            self.assertIn( "Unicorn", str(resp.data))


    def test_api_filter_type(self):
        with self.client as c:
            # should filter out 'python' and keep 'unicorn'
            query_string={'type': 'monstrosity'}
            resp = c.get("/api/monsters", query_string=query_string)

            self.assertEqual( resp.status_code, 200)

            self.assertNotIn( "Python", str(resp.data))
            self.assertIn( "Unicorn", str(resp.data))


    def test_api_filter_size(self):
        with self.client as c:
            # should filter out 'python' and keep 'unicorn'
            query_string={'size': 'large'}
            resp = c.get("/api/monsters", query_string=query_string)

            self.assertEqual( resp.status_code, 200)

            self.assertNotIn( "Python", str(resp.data))
            self.assertIn( "Unicorn", str(resp.data))

    def test_api_monster_page(self):
        with self.client as c:

            resp = c.get(f"/api/monsters/{self.m1_id}")

            self.assertEqual(resp.status_code, 200)

            # check for monster data
            self.assertIn( f"Challenge {self.m1.cr()} ({self.m1.xp} XP)", str(resp.data))