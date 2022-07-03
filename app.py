from flask import Flask, jsonify, redirect, render_template, request
from models import Monster
import requests

from flask_debugtoolbar import DebugToolbarExtension

from models import db, connect_db  # , Playlist, Song, PlaylistSong
# from forms import NewSongForPlaylistForm, SongForm, PlaylistForm

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///monsters'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True

app.config['SECRET_KEY'] = "private_private_private"

app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
debug = DebugToolbarExtension(app)


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

    return render_template('index.html', monsters=monsters)


# API FUNCTIONALITY

@app.route("/api/monsters")
def get_monsters():
    """Get monsters from the database"""

    # cr = int(request.args['cr'])
    min_cr = request.args['min_cr']
    max_cr = request.args['max_cr']

    type = request.args.get('type', None)

    query = db.session.query(Monster)

    query = query.filter(Monster.challenge_rating >= min_cr,
                         Monster.challenge_rating <= max_cr)

    if type:
        query = query.filter(Monster.type == type)

    # monsters = (Monster.query
    #             .filter(
    #                 Monster.challenge_rating >= min_cr,
    #                 Monster.challenge_rating <= max_cr,
    #                 Monster.type == type
    #             )
    #             .order_by(Monster.name)
    #             .limit(10)
    #             )

    monsters = query.order_by(Monster.name).limit(10)

    serialized=[m.serialize() for m in monsters]
    return jsonify(monsters=serialized)
