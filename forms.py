from flask_wtf import FlaskForm
from wtforms import BooleanField, IntegerField, SelectField, StringField, TextAreaField
from wtforms.validators import AnyOf, InputRequired, NumberRange, Optional, URL


class MonsterFilterForm(FlaskForm):
    """Form for filtering monsters"""

    name = StringField("Name", validators=[InputRequired()])
    