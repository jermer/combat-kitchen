
import json
from flask import Flask, flash, jsonify, redirect, render_template, request, session, g
from flask_debugtoolbar import DebugToolbarExtension

from sqlalchemy.exc import IntegrityError

import requests
import os
import re

from models import Monster, User, Encounter
from models import db, connect_db
from forms import SignupForm, LoginForm

CURR_USER_KEY = "current_user"

app = Flask(__name__)

uri = os.environ.get(
    "DATABASE_URL", 'postgresql:///monsters')

if uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = uri

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True

app.config['SECRET_KEY'] = os.environ.get("SECRET_KEY",
                                          "41ee5473cf593c326eacf023b409199c2e3a118f2e8051afbcdb9f7e4c48e406")

app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
debug = DebugToolbarExtension(app)

connect_db(app)
# db.create_all()


#
# HOMEPAGE
#
@app.route("/")
def root():
    """Render the homepage"""

    monsters = (Monster.query
                .order_by(Monster.name)
                .limit(10))

    return render_template('index.html',
                           monsters=monsters,
                           monster_types=Monster.types(),
                           monster_sizes=Monster.sizes()
                           )


#
# API FUNCTIONALITY
#
@app.route("/api/monsters")
def get_monsters():
    """Get monsters from the database according to filters in the query string"""

    min_cr = request.args['min_cr']
    max_cr = request.args['max_cr']

    type = request.args.get('type', None)
    size = request.args.get('size', None)

    status = request.args['status']

    query = db.session.query(Monster)

    query = query.filter(Monster.challenge_rating >= min_cr,
                         Monster.challenge_rating <= max_cr)

    if type:
        query = query.filter(Monster.type == type)

    if size:
        query = query.filter(Monster.size == size)

    if status == 'ordinary':
        query = query.filter(Monster.legendary_actions == None)
    elif status == 'legendary':
        query = query.filter(Monster.legendary_actions != None)
    # else status == 'both' and no filtering is required

    monsters = query.order_by(Monster.name).all()

    serialized = [m.serialize() for m in monsters]

    response = jsonify(monsters=serialized)
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response


@app.route("/api/monsters/<int:monster_id>")
def get_monster_by_id(monster_id):

    monster = Monster.query.get_or_404(monster_id)

    response = jsonify(render_template('monster.html', monster=monster))

    response.headers.add('Access-Control-Allow-Origin', '*')

    return response


@app.route("/api/encounters/<int:enc_id>")
def get_encounter_by_id(enc_id):

    encounter = Encounter.query.get_or_404(enc_id)

    # import pdb
    # pdb.set_trace()

    serialized = encounter.serialize()

    response = jsonify(serialized)
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response


# @app.route("/monster/<monster_id>")
# def show_monster(monster_id):
#     """Render a monster stat sheet"""

#     m = Monster.query.get_or_404(monster_id)

#     return render_template('monster.html', monster=m)


#
# USER SIGNUP / LOGIN / LOGOUT
#
@app.before_request
def add_user_to_g():
    """If there is a user logged in, add to Flask global"""

    if CURR_USER_KEY in session:
        g.user = User.query.get(session[CURR_USER_KEY])
    else:
        g.user = None


def login_user(user):
    session[CURR_USER_KEY] = user.id


def logout_user():
    if CURR_USER_KEY in session:
        del session[CURR_USER_KEY]


@app.route("/signup", methods=["GET", "POST"])
def signup():
    """Handle user signup"""

    form = SignupForm()

    if form.validate_on_submit():
        try:
            user = User.signup(
                email=form.email.data,
                username=form.username.data,
                password=form.password.data
            )
            db.session.commit()

        except IntegrityError as err:
            db.session.rollback()

            if "username" in err.orig.diag.message_detail:
                msg = "Sorry, that username is already in use."
            elif "email" in err.orig.diag.message_detail:
                msg = "Sorry, that email is already in use."
            else:
                msg = "Sorry, we are unable to register you at this time. Please try again later."

            flash(msg, "danger")

        else:
            login_user(user)
            flash("Account created. Welcome!", "success")
            return redirect('/')

    return render_template('signup.html', form=form)


@app.route("/login", methods=["GET", "POST"])
def login():
    """Handle user login"""

    form = LoginForm()

    if form.validate_on_submit():
        user = User.authenticate(
            form.username.data,
            form.password.data
        )

        if user:
            login_user(user)
            flash(f"Welcome back {user.username}!", "success")
            return redirect('/')
        else:
            flash("Invalid username or password.", "danger")

    return render_template('login.html', form=form)


@app.route("/logout")
def logout():
    """Handle user logout"""

    logout_user()
    flash("Successfully logged out.", "success")
    return redirect('/login')


@app.route("/users/<int:user_id>")
def user_page(user_id):
    """Show user page"""

    if not g.user:
        flash("Access unauthorized.", "danger")
        return redirect('/login')

    if g.user.id != user_id:
        flash("Access unauthorized. Redirecting to your own page.", "danger")

    return render_template('user.html', user=g.user)


@app.route("/users/<int:user_id>/save", methods=["POST"])
def save_entcounter(user_id):
    """Save an encounter to the database"""

    if not g.user:
        flash("Access unauthorized.", "danger")
        return redirect('/login')

    if g.user.id != user_id:
        flash("Access unauthorized. Redirecting to your own page.", "danger")

    #user = User.query.get_or_404(user_id)

    heroes = request.json.get("heroes")
    monsters = request.json.get("monsters")

    new_enc = Encounter(user_id=user_id, heroes=heroes, monsters=monsters)
    db.session.add(new_enc)
    db.session.commit()

    response = jsonify({'response': 'success'})

    response.headers.add('Access-Control-Allow-Origin', '*')

    return response


@app.route("/encounters/<int:enc_id>/delete", methods=["POST"])
def delete_encounter(enc_id):
    """Delete an encounter from the database"""

    if not g.user:
        flash("Access unauthorized.", "danger")
        return redirect('/login')

    enc = Encounter.query.get_or_404(enc_id)

    if g.user.id != enc.user_id:
        flash("Access unauthorized. Redirecting to your own page.", "danger")

    db.session.delete(enc)
    db.session.commit()

    return redirect(f'/users/{g.user.id}')
