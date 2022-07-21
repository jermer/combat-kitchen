"""
    Models for Monster app.

    Future iterations might include:
        -- monster reactions
        -- monster condition/damage immunity
"""

from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
import json

db = SQLAlchemy()
bcrypt = Bcrypt()


def connect_db(app):
    """Connect to database."""

    db.app = app
    db.init_app(app)


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
    legendary_actions = db.relationship("LegendaryAction")

    @classmethod
    def columns(cls):
        """Return a list of monster class properties"""

        arr = [k for k in Monster.__dict__.keys()
               if not k.startswith('_')]
        arr.remove('id')
        arr.remove('columns')

        return arr

    @classmethod
    def types(cls):
        """Return a list of monster types present in the db"""

        result = (Monster.query
                  .with_entities(Monster.type)
                  .group_by(Monster.type)
                  .order_by(Monster.type)
                  .all())
        result = [t[0] for t in result]
        return result

    @classmethod
    def sizes(cls):
        """Return a list of monster sizes present in the db"""

        result = (Monster.query
                  .with_entities(Monster.size)
                  .group_by(Monster.size)
                  .order_by(Monster.size.desc())
                  .all())
        result = [t[0] for t in result]
        return result

    def __repr__(self):
        """Stringify a monster in a helpful way"""

        return(f"<Monster: {self.name}>")

    def serialize(self):
        """Turn monster object into dictionary"""

        return {
            'id': self.id,
            'name': self.name,
            'challenge_rating': self.challenge_rating,
            'cr': self.cr(),
            'size': self.size,
            'type': self.type,
            'subtype': self.subtype,
            'xp': self.xp
        }

    def cr(self):
        """Certain challenge_ratings are fractions"""

        if self.challenge_rating == 0.125:
            return "1/8"
        elif self.challenge_rating == 0.25:
            return "1/4"
        elif self.challenge_rating == 0.5:
            return "1/2"
        else:
            return str(int(self.challenge_rating))

    def mod(self, attr):
        """Monster attributes are associated with a modifier"""

        if attr % 2 == 1:
            attr -= 1

        attr = int((attr-10)/2)

        return (str(attr) if attr < 0 else f"+{attr}")


class SpecialAbility(db.Model):
    """Model for monster special abilities"""

    __tablename__ = "special_abilities"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    monster_id = db.Column(
        db.Integer,
        db.ForeignKey(
            'monsters.id',
            ondelete="CASCADE")
    )

    name = db.Column(
        db.String(50),
        nullable=False
    )

    desc = db.Column(
        db.Text,
        nullable=False
    )

    usage = db.Column(
        db.String(50)
    )

    def __repr__(self):
        """Stringify a special ability in a helpful way"""

        return(f"<Special Ability: {self.name}>")


class Action(db.Model):
    """Model for monster actions"""

    __tablename__ = "actions"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    monster_id = db.Column(
        db.Integer,
        db.ForeignKey(
            'monsters.id',
            ondelete="CASCADE")
    )

    name = db.Column(
        db.String(50),
        nullable=False
    )

    desc = db.Column(
        db.Text,
        nullable=False
    )

    usage = db.Column(
        db.String(50)
    )

    def __repr__(self):
        """Stringify an action in a helpful way"""

        return(f"<Action: {self.name}>")


class LegendaryAction(db.Model):
    """Model for legendary actions"""

    __tablename__ = "legendary_actions"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    monster_id = db.Column(
        db.Integer,
        db.ForeignKey(
            'monsters.id',
            ondelete="CASCADE")
    )

    name = db.Column(
        db.String(50),
        nullable=False
    )

    desc = db.Column(
        db.Text,
        nullable=False
    )

    def __repr__(self):
        """Stringify a legendary action in a helpful way"""

        return(f"<Legendary Action: {self.name}>")


class User (db.Model):
    """Model for users"""

    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    email = db.Column(
        db.String(50),
        nullable=False,
        unique=True
    )

    username = db.Column(
        db.String(50),
        nullable=False,
        unique=True
    )

    password = db.Column(
        db.Text,
        nullable=False
    )

    encounters = db.relationship("Encounter", backref="user")

    def __repr__(self):
        """Stringify users in a helpful way"""

        return f"<User #{self.id}: {self.email}>"

    @classmethod
    def signup(cls, email, username, password):
        """Sign up new user."""

        hashed_pwd = bcrypt.generate_password_hash(password).decode('UTF-8')

        user = User(
            email=email,
            username=username,
            password=hashed_pwd,
        )

        db.session.add(user)
        return user

    @classmethod
    def authenticate(cls, username, password):
        """Find user with `username` and `password` and return that user object.

        If a matching user cannot be found (or if password is wrong), returns False.
        """

        user = cls.query.filter_by(username=username).first()

        if user:
            is_auth = bcrypt.check_password_hash(user.password, password)
            if is_auth:
                return user

        return False


class Encounter(db.Model):
    """Model for encounters"""

    __tablename__ = "encounters"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey('users.id',
                      ondelete="CASCADE")
    )

    # JSON string representing hero list
    #   string is of the form "[{"num":"2","lvl":"1"},{"num":"2","lvl":"2"}]"
    heroes = db.Column(
        db.Text
    )

    # JSON string representing monster list
    #   string is of the form "[{"id":72,"name":"Skeleton","cr":"1/4","xp":50,"num":2},{"id":4,"name":"Bat","cr":0,"xp":10,"num":5}]"
    monsters = db.Column(
        db.Text
    )

    def __repr__(self):
        """Stringify encounter in a helpful way"""

        return f"<Encounter {self.id}: {self.heroes} // {self.monsters}>"

    def serialize(self):
        """Turn encounter object into dictionary"""

        return {
            'id': self.id,
            'user_id': self.user_id,
            'heroes': self.heroes,
            'monsters': self.monsters,
        }

    def summarize(self, length=50):
        """Return a summary string for the encounter (up to 30 characters)"""

        h_obj = json.loads( self.heroes )
        m_obj = json.loads( self.monsters )

        # import pdb; pdb.set_trace()

        numHeroes = 0
        for h in h_obj:
            numHeroes += int(h['num'])
                
        response = "No Heroes" if numHeroes == 0 else f"Heroes x {numHeroes}"
        response += " vs. "

        if m_obj:
            for m in m_obj:
                monster = Monster.query.get(m['id'])
                response += f"{monster.name} x {m['num']}, "
            # trim off the closing comma and whitespace
            response = response.rstrip(', ')

        else:
            response += "No Monsters"

        # Trim string to 'length' characters
        if len(response) > length:
            response = response[:length-3] + "..."

        return response
