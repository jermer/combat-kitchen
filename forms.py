
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField
from wtforms.validators import DataRequired, Email, Length


class SignupForm(FlaskForm):
    """Form for adding new user."""

    username = StringField(
        'Username',
        validators=[DataRequired()]
    )

    email = StringField(
        'E-mail',
        validators=[DataRequired(),
                    Email()]
    )

    password = PasswordField('Password',
                             validators=[Length(min=6)]
                             )


class LoginForm(FlaskForm):
    """Login form."""

    username = StringField(
        'Username',
        validators=[DataRequired()]
    )

    password = PasswordField(
        'Password',
        validators=[DataRequired()]
    )


#
# Also "edit user form?"
#
