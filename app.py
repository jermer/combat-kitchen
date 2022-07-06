
from flask import Flask, flash, jsonify, redirect, render_template, request, session, g
from flask_debugtoolbar import DebugToolbarExtension
# from flask_login import LoginManager, login_required, login_user, logout_user
from psycopg2 import IntegrityError

import requests

from models import Monster, User
from models import db, connect_db
from forms import SignupForm, LoginForm

CURR_USER_KEY = "current_user"

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///monsters'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True

app.config['SECRET_KEY'] = "41ee5473cf593c326eacf023b409199c2e3a118f2e8051afbcdb9f7e4c48e406"

app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
debug = DebugToolbarExtension(app)


# login_manager = LoginManager()
# login_manager.init_app(app)

# @login_manager.user_loader
# def load_user(user_id):
#     return User.query.get(user_id)


connect_db(app)
# db.create_all()


@app.route("/")
def root():
    """Render the homepage"""

    # monsters = (Monster.query
    #             .filter(Monster.challenge_rating <= 1)
    #             .order_by(Monster.name)
    #             .limit(10)
    #             )

    monsters = (Monster.query
                .order_by(Monster.name)
                .limit(10))

    return render_template('index.html', monsters=monsters, monster_types=Monster.types())


@app.route("/monster/<monster_id>")
def show_monster(monster_id):
    """Render a monster stat sheet"""

    m = Monster.query.get_or_404(monster_id)

    return render_template('monster.html', monster=m)


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
            flash(f"Welcome back {user.username}!" "success")

            # next = request.args.get('next')

            # if not is_safe_url(next):
            #     return abort(400)

            # return redirect(next or '/')
            return redirect('/')

    return render_template('login.html', form=form)


@app.route("/logout")
def logout():
    """Handle user logout"""

    logout_user()
    flash("Successfully logged out.", "success")
    return redirect('/login')


#
# API FUNCTIONALITY
#

@app.route("/api/monsters")
def get_monsters():
    """Get monsters from the database according to filters in the query string"""

    min_cr = request.args['min_cr']
    max_cr = request.args['max_cr']

    type = request.args.get('type', None)

    query = db.session.query(Monster)

    query = query.filter(Monster.challenge_rating >= min_cr,
                         Monster.challenge_rating <= max_cr)

    if type:
        query = query.filter(Monster.type == type)

    monsters = query.order_by(Monster.name).all()

    serialized = [m.serialize() for m in monsters]
    return jsonify(monsters=serialized)
