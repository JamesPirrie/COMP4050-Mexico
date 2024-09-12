from flask import Flask, request, render_template, url_for, redirect
import requests
import json

backend = "http://localhost:3000/api/"

testClassList = '''
[{"class_id":14,"session":null,"year":null,"code":"JOHN1234","title":null,"creation_date":null,"expiry_date":null,"author_id":5,"tutors":null},{"class_id":15,"session":null,"year":null,"code":"JOHN1234","title":null,"creation_date":null,"expiry_date":null,"author_id":5,"tutors":null},{"class_id":16,"session":null,"year":null,"code":"COMP5823","title":null,"creation_date":null,"expiry_date":null,"author_id":5,"tutors":null},{"class_id":17,"session":null,"year":null,"code":"COMP5824","title":null,"creation_date":null,"expiry_date":null,"author_id":5,"tutors":null},{"class_id":18,"session":null,"year":null,"code":"COMP5826","title":null,"creation_date":null,"expiry_date":null,"author_id":5,"tutors":null},{"class_id":21,"session":null,"year":null,"code":"COMR92CP","title":null,"creation_date":null,"expiry_date":null,"author_id":5,"tutors":null}]
'''

app = Flask(__name__)

class User:
    userAuthenticated = False
    email = ""

user = User()

def isAuthenticated():
    return user.userAuthenticated

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
        email=request.form['email']
        #auth = requests.post(backend+'signup', email)
        auth = True
        if auth:
            return redirect(url_for('login'))
        return redirect(url_for('signup'))

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/loginDirect', methods = ['GET', 'POST'])
def loginDirect():
    if request.method == 'POST':
        user.email=request.form['email']
        #auth = requests.get(backend+'login', user.email)
        auth = True
        if auth:
            user.userAuthenticated = True
            return redirect(url_for('dashboard'))
    return render_template('loginDirect.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/classes')
def classes():
    # classList = requests.get(backend+'classes')\
    classList = testClassList
    classes = json.loads(classList)
    for item in classes:
        print(item)
    return render_template('classes.html', classes = classes)

@app.route('/unit')
def unit():
    return render_template('unit.html')

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
    user.userAuthenticated = False
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)