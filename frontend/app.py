from flask import Flask, request, render_template, url_for, redirect, session
from datetime import date
import requests
import json
import uuid

backend = "http://localhost:3000/api/"

testClassList = '''
[{"class_id":14,"session":null,"year":null,"code":"JOHN1234","title":null,"creation_date":null,"expiry_date":null,"author_id":5,"tutors":null},{"class_id":15,"session":null,"year":null,"code":"JOHN1234","title":null,"creation_date":null,"expiry_date":null,"author_id":5,"tutors":null},{"class_id":16,"session":null,"year":null,"code":"COMP5823","title":null,"creation_date":null,"expiry_date":null,"author_id":5,"tutors":null},{"class_id":17,"session":null,"year":null,"code":"COMP5824","title":null,"creation_date":null,"expiry_date":null,"author_id":5,"tutors":null},{"class_id":18,"session":null,"year":null,"code":"COMP5826","title":null,"creation_date":null,"expiry_date":null,"author_id":5,"tutors":null},{"class_id":21,"session":null,"year":null,"code":"COMR92CP","title":null,"creation_date":null,"expiry_date":null,"author_id":5,"tutors":null}]
'''

app = Flask(__name__)
app.secret_key = 'SUPERSECRETKEY'

class User:
    userAuthenticated = False
    email = ""

user = User()

def isAuthenticated():
    return user.userAuthenticated

# How to use this code
# url requests from the user are detected using @app.route()
# this calls the defined method directly below it
# sending the html back to the user is done with render_template()
# changing the url for the user is done with url_for('name_of_method')
# to run the method as well use redirect()
# example: redirect(url_for('name_of_method'))

# recieving data from the user is done with a POST request from the website back the flask
# first allow the page to recieve POST using methods = ['POST'] (dont forget to also allow 'GET' if needed)
# then use logic to check if recieving a POST request (if request.method == 'POST')
# grab the data using request.form['key'] (the key is defined in the HTML)
# look at loginDirect.html to see more explanation of how this works

# accessing the backend API is using requests.get() or requests.post() (and will also use requests.put() or requests.delete())
# look through the code to see examples of how this is done
# this will change in the future for requests.post() because it was implemented wrong for MVP

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
        auth = requests.post(f'{backend}signup', json = {'email': email})
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
        auth = requests.post(f'{backend}login', json = {'email': email})
        if auth.text == 'true':
            user.email = email
            user.userAuthenticated = True
            return redirect(url_for('dashboard'))
    return render_template('loginDirect.html')

@app.route('/dashboard')
def dashboard():
    # add request.get assignments to display
    return render_template('dashboard.html')

@app.route('/classes', methods = ['GET'])
def classes():
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
        requests.post(f'{backend}classes', json = {'email': user.email, 'code': code})
        return redirect(url_for('classes'))
    return render_template('newclass.html')

@app.route('/unit')
def unit():
    classes = json.loads(requests.get(f'{backend}classes?email={user.email}').content)
    print(classes)
    for item in classes:
        if item['code'] == request.args.get('class', ''):
            class_id = item['class_id']
            session['last_class_id'] = class_id
        else:
            print('a')
            class_id = session['last_class_id']
    assignments = json.loads(requests.get(f'{backend}assignments?email={user.email}&class_id={class_id}').content)
    students = json.loads(requests.get(f'{backend}students?email={user.email}&class_id={class_id}').content)
    return render_template('unit.html', assignments = assignments, students = students)

@app.route('/assignment')
def assignment():
    assignments = json.loads(requests.get(f'{backend}assignments?email={user.email}&class_id={session["last_class_id"]}').content)
    for a in assignments:
        if a['name'] == request.args.get('name', ''):
            assignment_id = a['assignment_id']
            session['last_assignment_id'] = assignment_id
            print(assignment_id)
    submissions = json.loads(requests.get(f'{backend}submissions?email={user.email}&assignment_id={assignment_id}&class_id={session["last_class_id"]}').content)
    print(submissions)
    return render_template('assignment.html', submissions = submissions)

@app.route('/newAssignment', methods = ['GET', 'POST'])
def newAssignment():
    if request.method == 'POST':
        classes = json.loads(requests.get(f'{backend}classes?email={user.email}').content)
        print(classes)
        for item in classes:
            if item['code'] == request.args.get('class_id', ''):
                class_id = item['class_id']
            else:
                print('no class id found')
        name = request.form['name']
        desc = request.form['desc']
        requests.post(f'{backend}assignments', json = {'email': user.email, 'class_id': class_id, 'name': name, 'description': desc})
        return redirect(url_for('classes'))
    return render_template('newAssignment.html')

@app.route('/student')
def student():
    return render_template('student.html')

@app.route('/newStudent', methods = ['GET', 'POST'])
def newStudent():
    if request.method == 'POST':
        email = user.email
        fname = request.form['fname']
        lname = request.form['lname']
        id = request.form['id']
        requests.post(f'{backend}students', json = {'email': user.email, 'student_id': id, 'first_name': fname, 'last_name': lname})
        return redirect(url_for('classes'))
    return render_template('newStudent.html')

#fix to recieve viva submission_id as query
@app.route('/vivas')
def vivas():
    a = requests.get(f'{backend}vivas?email={user.email}').content
    # jam in request.post viva
    return render_template('vivas.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')

@app.route('/new_project', methods = ['GET', 'POST'])
def new_project():
    class_id = session['last_class_id']
    students = json.loads(requests.get(f'{backend}students?email={user.email}&class_id={class_id}').content)
    if request.method == 'POST':
        pdf = request.files['pdf_file']
        files = {'submission_PDF': pdf}
        student_id = request.form['student']
        jsons = {'email': user.email, 'assignment_id': session['last_assignment_id'], 'student_id': student_id, 'submission_date': date.today(), 'submission_filepath': 'this_unit_will_end_me.pdf'}
        response = requests.post(backend+'submissions', files=files, data=jsons)
        return redirect(url_for('unit'))
    return render_template('newProject.html', students=students)

@app.route('/logout')
def logout():
    user.userAuthenticated = False
    return redirect(url_for('login'))

@app.route('/submission')
def submission():
    return render_template('submission.html')

@app.route('/generate')
def generate():
    submission_id = request.args.get('submission_id', '')
    print(submission_id)
    requests.post(f'{backend}qgen', json = {'email': user.email, 'submission_id': 13, 'result_id': 0})
    return redirect(url_for('submission'))

if __name__ == '__main__':
    app.run(debug=True)