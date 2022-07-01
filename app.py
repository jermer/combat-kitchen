from flask import Flask, redirect, render_template
from models import Monster
import requests

from flask_debugtoolbar import DebugToolbarExtension

from models import db, connect_db  # , Playlist, Song, PlaylistSong
#from forms import NewSongForPlaylistForm, SongForm, PlaylistForm

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
    """Homepage"""

    return render_template('index.html')
