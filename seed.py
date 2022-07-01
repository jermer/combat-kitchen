"""Seed file to populate monsters database"""

from models import db, Monster, SpecialAbility, Action
from app import app
import requests
import re

# Create all tables
db.drop_all()
db.create_all()

BASE_API_URL = "https://www.dnd5eapi.co/api"

CHALLENGE_RATINGS = [0, 0.125, 0.25, 0.5, *range(1, 31)]


def get_by_cr_range(min_cr: int, max_cr: int):
    """Get all monsters with challenge ratings between min_cr and max_cr (inclusive)."""

    if min_cr not in CHALLENGE_RATINGS or max_cr not in CHALLENGE_RATINGS:
        return False

    for cr in CHALLENGE_RATINGS:
        if cr >= min_cr and cr <= max_cr:
            get_by_cr(cr)


def get_by_cr(cr: int):
    """Get all monsters with challenge rating equal to cr."""

    if cr not in CHALLENGE_RATINGS:
        return False

    resp = requests.get(
        f"{BASE_API_URL}/monsters",
        params={"challenge_rating": f"{cr}"}
    ).json()

    print(f"*** API returned {resp.get('count')} results ***")

    for m in resp.get('results'):
        name = m.get('name')
        print(f"Fetching monster: {name}")

        # the name requires some processing for api
        # -- remove " Form" from monster that end with this string, e.g., "Werewolf, Human Form"
        if name.endswith(' Form'):
            name = name.replace(' Form', '')

        # -- replace spaces with dashes
        # -- remove special characters (),/'
        d = {**{ord(x): "-" for x in " /"}, **{ord(x): "" for x in ",()'"}}
        name = name.translate(d)

        # -- convert to all lower case
        name = name.lower()

        # print(name)
        get_by_name(name)


def get_by_name(name: str):
    """Get a monster by its name."""

    resp = requests.get(
        f"{BASE_API_URL}/monsters/{name}"
    ).json()

    if 'error' in resp.keys():
        return False

    special_abilities = resp.pop('special_abilities', None)
    actions = resp.pop('actions', None)

    new_monster = Monster(
        **{k: resp[k] for k in Monster.columns() if k in resp}
    )

    db.session.add(new_monster)
    db.session.commit()

    if special_abilities:
        for sa in special_abilities:
            db.session.add(
                SpecialAbility(monster_id=new_monster.id,
                               name=sa['name'], desc=sa['desc'])
            )
        db.session.commit()

    if actions:
        for a in actions:
            db.session.add(
                Action(monster_id=new_monster.id,
                       name=a['name'], desc=a['desc'])
            )
        db.session.commit()

    return new_monster
