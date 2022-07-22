"""
    Monster model tests
"""

from unittest import TestCase

from models import db, Monster, SpecialAbility, Action, LegendaryAction

# from sqlalchemy.exc import IntegrityError, PendingRollbackError

import os
os.environ["DATABASE_URL"] = "postgresql:///monsters-test"

from app import app

db.create_all()


class MonsterModelTestCase(TestCase):
    """Test the monster model"""

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

    def test_monster_model(self):
        """test the basic model"""

        m = Monster(
            name="Zombie Hand",
            size="small",
            type="undead",
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
        db.session.add(m)
        db.session.commit()

        self.assertTrue(isinstance(m.id, int))

    def test_monster_repr(self):
        self.assertEqual(
            self.m1.__repr__(),
            f'<Monster: Python>'
        )
        self.assertEqual(
            self.m2.__repr__(),
            f'<Monster: Unicorn>'
        )

    def test_type_list(self):
        self.assertTrue("beast" in Monster.types())
        self.assertTrue("monstrosity" in Monster.types())
        self.assertTrue("undead" not in Monster.types())

    def test_size_list(self):
        self.assertTrue("medium" in Monster.sizes())
        self.assertTrue("large" in Monster.sizes())
        self.assertTrue("small" not in Monster.sizes())

    def test_serialize(self):
        s1 = self.m1.serialize()

        # check that keys exist
        self.assertTrue('id' in s1.keys())
        self.assertTrue('name' in s1.keys())
        self.assertTrue('challenge_rating' in s1.keys())
        self.assertTrue('cr' in s1.keys())
        self.assertTrue('size' in s1.keys())
        self.assertTrue('type' in s1.keys())
        self.assertTrue('subtype' in s1.keys())
        self.assertTrue('xp' in s1.keys())

        # check that keys have expected values
        self.assertEqual(s1['id'], 111)
        self.assertEqual(s1['name'], 'Python')
        self.assertEqual(s1['challenge_rating'], 0.5)
        self.assertEqual(s1['cr'], '1/2')
        self.assertEqual(s1['size'], 'medium')
        self.assertEqual(s1['type'], 'beast')
        self.assertEqual(s1['subtype'], None)
        self.assertEqual(s1['xp'], 1000)

        s2 = self.m2.serialize()
        self.assertEqual(s2['subtype'], 'horse')

    def test_cr(self):
        self.assertEqual(self.m1.cr(), '1/2')
        self.assertEqual(self.m2.cr(), '4')

        # check other fraction CRs
        self.m2.challenge_rating = 0.25
        db.session.add(self.m2)
        db.session.commit()
        self.assertEqual(self.m2.cr(), '1/4')

        self.m2.challenge_rating = 0.125
        db.session.add(self.m2)
        db.session.commit()
        self.assertEqual(self.m2.cr(), '1/8')

    def test_mod(self):
        """test ability score modifiers"""
        self.assertEqual(self.m1.mod(1), '-5')
        self.assertEqual(self.m1.mod(3), '-4')
        self.assertEqual(self.m1.mod(4), '-3')
        self.assertEqual(self.m1.mod(7), '-2')
        self.assertEqual(self.m1.mod(8), '-1')
        self.assertEqual(self.m1.mod(11), '+0')
        self.assertEqual(self.m1.mod(12), '+1')
        self.assertEqual(self.m1.mod(15), '+2')
        self.assertEqual(self.m1.mod(16), '+3')
        self.assertEqual(self.m1.mod(19), '+4')
        self.assertEqual(self.m1.mod(20), '+5')

    def test_special_ability_model(self):
        """test the special ability model"""

        feature = SpecialAbility(
            monster_id=self.m1_id,
            name="Epic Special Ability",
            desc="Some dangerous behavior of ability!",
        )

        db.session.add(feature)
        db.session.commit()

        self.assertTrue(isinstance(feature.id, int))
        self.assertTrue(len(self.m1.special_abilities), 1)
        self.assertEqual(self.m1.special_abilities[0].name, feature.name)

    def test_special_ability_repr(self):
        feature = SpecialAbility(
            monster_id=self.m1_id,
            name="Epic Special Ability",
            desc="Some dangerous behavior of ability!",
        )

        db.session.add(feature)
        db.session.commit()

        self.assertEqual(
            feature.__repr__(),
            f'<Special Ability: Epic Special Ability>'
        )

    def test_action_model(self):
        """test the action model"""

        feature = Action(
            monster_id=self.m1_id,
            name="Epic Action",
            desc="Some dangerous behavior of ability!",
        )

        db.session.add(feature)
        db.session.commit()

        self.assertTrue(isinstance(feature.id, int))
        self.assertTrue(len(self.m1.actions), 1)
        self.assertEqual(self.m1.actions[0].name, feature.name)

    def test_action_repr(self):
        feature = Action(
            monster_id=self.m1_id,
            name="Epic Action",
            desc="Some dangerous behavior of ability!",
        )

        db.session.add(feature)
        db.session.commit()

        self.assertEqual(
            feature.__repr__(),
            f'<Action: Epic Action>'
        )

    def test_legendary_action_model(self):
        """test the legendary action model"""

        feature = LegendaryAction(
            monster_id=self.m1_id,
            name="Epic Legendary Action",
            desc="Some dangerous behavior of ability!",
        )

        db.session.add(feature)
        db.session.commit()

        self.assertTrue(isinstance(feature.id, int))
        self.assertTrue(len(self.m1.legendary_actions), 1)
        self.assertEqual(self.m1.legendary_actions[0].name, feature.name)

    def test_legendary_action_repr(self):
        feature = LegendaryAction(
            monster_id=self.m1_id,
            name="Epic Legendary Action",
            desc="Some dangerous behavior of ability!",
        )

        db.session.add(feature)
        db.session.commit()

        self.assertEqual(
            feature.__repr__(),
            f'<Legendary Action: Epic Legendary Action>'
        )