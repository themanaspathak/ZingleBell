from flask import Flask, render_template, request, redirect, url_for, flash
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")

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
        # Fetch user from database
        result = db.select().from(users).where(eq(users.id, user_id))
        user = result[0]
        if user:
            return User(user.id, user.email, user.password)
        return None

    @staticmethod
    def authenticate(email, password):
        # Check user credentials
        result = db.select().from(users).where(eq(users.email, email))
        user = result[0]
        if user and check_password_hash(user.password, password):
            return User(user.id, user.email, user.password)
        return None

@login_manager.user_loader
def load_user(user_id):
    return User.get(int(user_id))

# Login form
class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Log In')

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
    # ALWAYS serve the app on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
