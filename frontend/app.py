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
        auth = requests.post(f'{backend}signup?email={email}')
        if auth.text == 'true':
            return redirect(url_for('login'))
        return redirect(url_for('signup'))

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/loginDirect', methods = ['GET', 'POST'])
def loginDirect():
    if request.method == 'POST':
        email=request.form['email']
        auth = requests.get(f'{backend}login?email={email}')
        if auth.text == 'true':
            user.email = email
            user.userAuthenticated = True
            return redirect(url_for('dashboard'))
    return render_template('loginDirect.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/classes', methods = ['GET', 'POST'])
def classes():
    if request.method == 'POST':
        print('a')
    classList = requests.get(f'{backend}classes?email={user.email}').content
    classes = json.loads(classList)
    for item in classes:
        print(item)
    return render_template('classes.html', classes = classes)

@app.route('/new_class', methods = ['GET', 'POST'])
def new_class():
    if request.method == 'POST':
        name = request.form['name']
        code = request.form['code']
        requests.post(f'{backend}classes?email={user.email}&code={code}')
        return redirect(url_for('classes'))
    return render_template('newclass.html')

@app.route('/unit')
def unit():
    return render_template('unit.html')

@app.route('/newAssignment')
def newAssignment():
    return render_template('newAssignment.html')

@app.route('/newStudent')
def newStudent():
    return render_template('newStudent.html')

@app.route('/vivas')
def vivas():
    a = requests.get(f'{backend}classes?email={user.email}').content
    return render_template('vivas.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')

@app.route('/new_project', methods = ['GET', 'POST'])
def new_project():
    if request.method == 'POST':
        pdf = request.files['pdf_file']
        requests.post(f'{backend}qgen?email={user.email},submission_id=1, result_id=1')
        requests.post(backend+'submissions', user.email, 1, 1, 0, "", pdf)
        print(pdf)
    return render_template('newProject.html')

@app.route('/logout')
def logout():
    user.userAuthenticated = False
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)