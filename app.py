import logging
from flask import Flask, render_template, request, redirect, url_for, flash
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email
from werkzeug.security import generate_password_hash, check_password_hash
import os
import sys

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Verify environment variables
if not os.environ.get("SESSION_SECRET"):
    logger.error("SESSION_SECRET environment variable is not set")
    sys.exit(1)

if not os.environ.get("DATABASE_URL"):
    logger.error("DATABASE_URL environment variable is not set")
    sys.exit(1)

logger.info("Environment variables verified")

# Configure Flask app
app.secret_key = os.environ.get("SESSION_SECRET")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# User class
class User(UserMixin):
    def __init__(self, id, email, password_hash):
        self.id = id
        self.email = email
        self.password_hash = password_hash

    @staticmethod
    def get(user_id):
        try:
            logger.debug(f"Fetching user with ID: {user_id}")
            from psycopg2 import connect
            conn = connect(os.environ.get("DATABASE_URL"))
            cur = conn.cursor()
            cur.execute("SELECT id, email, password FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            cur.close()
            conn.close()
            if user:
                logger.debug(f"Found user with ID: {user_id}")
                return User(user[0], user[1], user[2])
            logger.debug(f"No user found with ID: {user_id}")
            return None
        except Exception as e:
            logger.error(f"Error fetching user: {e}")
            return None

    @staticmethod
    def authenticate(email, password):
        try:
            logger.debug(f"Authenticating user with email: {email}")
            from psycopg2 import connect
            conn = connect(os.environ.get("DATABASE_URL"))
            cur = conn.cursor()
            cur.execute("SELECT id, email, password FROM users WHERE email = %s", (email,))
            user = cur.fetchone()
            cur.close()
            conn.close()
            if user and check_password_hash(user[2], password):
                logger.debug(f"Successfully authenticated user: {email}")
                return User(user[0], user[1], user[2])
            logger.debug(f"Authentication failed for user: {email}")
            return None
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            return None

@login_manager.user_loader
def load_user(user_id):
    return User.get(int(user_id))

# Login form
class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Log In')

@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('kitchen'))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.authenticate(form.email.data, form.password.data)
        if user:
            login_user(user)
            flash('Logged in successfully.')
            next_page = request.args.get('next')
            return redirect(next_page or url_for('kitchen'))
        flash('Invalid email or password.')
    return render_template('login.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logged out successfully.')
    return redirect(url_for('login'))

@app.route('/kitchen')
@login_required
def kitchen():
    return render_template('kitchen.html')

if __name__ == '__main__':
    try:
        logger.info("Starting Flask server...")
        # ALWAYS serve the app on port 5000
        app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        logger.error(f"Failed to start Flask server: {e}")
        sys.exit(1)