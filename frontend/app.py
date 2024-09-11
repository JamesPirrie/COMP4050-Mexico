from flask import Flask, request, render_template, url_for, redirect
import requests
import _json

backend = "http://localhost:3000/api/"

app = Flask(__name__)

userAuthenticated = False
def isAuthenticated():
    return userAuthenticated

@app.route('/')
def default():
    if isAuthenticated():
        return redirect(url_for('dashboard'))
    else:
        return redirect(url_for('login'))
@app.route('/signup', methods = ['GET', 'POST'])
def signup():
    if request.method == 'GET':
        return render_template('signup.html')
    
    if request.method == 'POST':
        data=request.form
        return redirect(url_for('login'))

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/classes')
def classes():
    # classList = requests.get(backend+'classes')
    return render_template('classes.html')

@app.route('/assignments')
def assignments():
    return render_template('assignments.html')

@app.route('/vivas')
def vivas():
    # a = requests.get(backend+"classes").content
    return render_template('vivas.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')

@app.route('/new_project')
def new_project():
    return render_template('newProj.html')

@app.route('/logout')
def logout():
    global userAuthenticated
    userAuthenticated = False
    return redirect(url_for('login'))

@app.route('/authenticate')
def authenticate():
    global userAuthenticated
    userAuthenticated = True
    return redirect(url_for('dashboard'))

if __name__ == '__main__':
    app.run(debug=True)