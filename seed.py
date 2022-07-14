"""Seed file to populate monsters database"""

from models import db, Monster, SpecialAbility, Action, LegendaryAction
from app import app
import requests

BASE_API_URL = "https://www.dnd5eapi.co/api"

CHALLENGE_RATINGS = [0, 0.125, 0.25, 0.5, *range(1, 31)]


def seed_monster_db():
    """Seed the monsters database"""

    # Create all tables anew
    db.drop_all()
    db.create_all()

    # Get data from the API
    get_all_monsters()


def get_all_monsters():
    """Get all the monsters"""

    for cr in CHALLENGE_RATINGS:
        get_by_cr( cr )


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

    # print(f"*** API returned {resp.get('count')} results ***")

    for m in resp.get('results'):
        
        name = m.get('name')
        index = m.get('index')

        # print(f"Fetching monster: {name}")
        get_by_index(index)


def get_by_index(idx: str):
    """Get a monster by its index (name)."""

    resp = requests.get(
        f"{BASE_API_URL}/monsters/{idx}"
    ).json()

    if 'error' in resp.keys():
        return False

    # to allow for easier parsing of the remaining fields, we
    # save these fields and remove them from the list
    special_abilities = resp.pop('special_abilities', None)
    actions = resp.pop('actions', None)
    legendary_actions = resp.pop('legendary_actions', None)

    # create a new monster using all of the fields on the model
    new_monster = Monster(
        **{k: resp[k] for k in Monster.columns() if k in resp}
    )

    db.session.add(new_monster)
    db.session.commit()

    # now that the monster exists in the database, we go back and
    # create entities related to the two fields we saved earlier
    if special_abilities:
        for sa in special_abilities:
            if( 'usage' in sa ):
                usage = parse_usage( sa['usage'] )
            else:
                usage = None

            db.session.add(
                SpecialAbility(monster_id=new_monster.id,
                               name=sa['name'], desc=sa['desc'], usage=usage)
            )
        db.session.commit()

    if actions:
        for a in actions:
            if( 'usage' in a ):
                usage = parse_usage( a['usage'] )
            else:
                usage = None

            db.session.add(
                Action(monster_id=new_monster.id,
                       name=a['name'], desc=a['desc'], usage=usage)
            )
        db.session.commit()

    if legendary_actions:
        for la in legendary_actions:                
            db.session.add(
                LegendaryAction(monster_id=new_monster.id,
                       name=la['name'], desc=la['desc'])
            )
        db.session.commit()

    return new_monster

def parse_usage( usage ):
    """Parse the 'usage' property for actions and special abilities

    According to the API, the format of usage is:
        {'type': 'recharge on roll', 'dice': '1d6', 'min_value': 5}

    Where 'type' is one of:
        'at will', 'per day', 'recharge after rest', 'recharge on roll'
    """
    
    type = usage['type']

    if type == 'per day':
        response = f'({usage["times"]}/Day)'

    elif type == 'recharge after rest':
        if len(usage['rest_types']) == 2:
            rest = "Short or Long"
        else:
            rest = usage['rest_types'][0].title()

        response = f"(Recharges after a {rest} Rest)"

    elif type == 'recharge on roll':
        dice = '6' if usage["min_value"] == 6 else f'{usage["min_value"]}-6'
        response = f'(Recharge {dice})'

    else:
        type = None

    return response


#
# Call the function to kick it off!
#
seed_monster_db()