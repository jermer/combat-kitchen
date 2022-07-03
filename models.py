"""Models for Monster app."""

from unicodedata import name
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey

db = SQLAlchemy()


class Monster(db.Model):
    """Model for monsters"""

    __tablename__ = "monsters"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    name = db.Column(db.String(30), nullable=False)
    size = db.Column(db.String(30), nullable=False)
    type = db.Column(db.String(30), nullable=False)
    subtype = db.Column(db.String(30))

    armor_class = db.Column(db.Integer, nullable=False)
    hit_points = db.Column(db.Integer, nullable=False)
    hit_dice = db.Column(db.String(30), nullable=False)

    strength = db.Column(db.Integer, nullable=False)
    dexterity = db.Column(db.Integer, nullable=False)
    constitution = db.Column(db.Integer, nullable=False)
    intelligence = db.Column(db.Integer, nullable=False)
    wisdom = db.Column(db.Integer, nullable=False)
    charisma = db.Column(db.Integer, nullable=False)

    challenge_rating = db.Column(db.Float, nullable=False)
    xp = db.Column(db.Integer, nullable=False)

    special_abilities = db.relationship("SpecialAbility")
    actions = db.relationship("Action")

    @classmethod
    def columns(cls):
        """Return a list of class properties"""

        arr = [k for k in Monster.__dict__.keys()
               if not k.startswith('_')]
        arr.remove('id')
        arr.remove('columns')

        return arr

    def __repr__(self):
        """Stringify a monster in a helpful way"""
        
        return( f"<Monster: {self.name}>" )

    def serialize(self):
        """Turn monster object into dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'size': self.size,
            'type': self.type,
            'subtype': self.subtype,
            'cr': self.cr()
        }

    def cr(self):
        if self.challenge_rating == 0.125:
            return "1/8"
        elif self.challenge_rating == 0.25:
            return "1/4"
        elif self.challenge_rating == 0.5:
            return "1/2"
        else:
            return str(int(self.challenge_rating))


class SpecialAbility(db.Model):
    """Model for monster special abilities"""

    __tablename__ = "special_abilities"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    monster_id = db.Column(db.Integer, ForeignKey(
        'monsters.id', ondelete="CASCADE"))
    name = db.Column(db.String(50), nullable=False)
    desc = db.Column(db.Text, nullable=False)

    def __repr__(self):
        """Stringify a special ability in a helpful way"""
        
        return( f"<Special Ability: {self.name}>" )


class Action(db.Model):
    """Model for monster actions"""

    __tablename__ = "actions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    monster_id = db.Column(db.Integer, ForeignKey(
        'monsters.id', ondelete="CASCADE"))
    name = db.Column(db.String(50), nullable=False)
    desc = db.Column(db.Text, nullable=False)
    
    def __repr__(self):
        """Stringify an action in a helpful way"""
        
        return( f"<Action: {self.name}>" )

def connect_db(app):
    """Connect to database."""

    db.app = app
    db.init_app(app)


##
## To add "legendary"
## To check for "recharge" type actions
##


# class LegendaryActions(db.Model):
#     """Model for legendary actions"""
#     __tablename__ = "legendary_actions"
#     id = db.Column(db.Integer, primary_key=True, autoincrement=True)
#     monster_id = db.Column(db.Integer, ForeignKey(
#         'monsters.id', ondelete="CASCADE"))
