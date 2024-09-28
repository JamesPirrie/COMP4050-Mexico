import os
from flask import Flask, request, render_template, url_for, redirect, jsonify
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
    classes = json.loads(requests.get(f'{backend}classes?email={user.email}').content)
    print(classes)
    for item in classes:
        if item['code'] == request.args.get('class', ''):
            class_id = item['class_id']
        else:
            print('no class id found')
    assignments = json.loads(requests.get(f'{backend}assignments?email={user.email}&class_id={class_id}').content)
    students = json.loads(requests.get(f'{backend}students?email={user.email}&class_id={class_id}').content)
    return render_template('unit.html', assignments = assignments, students = students)

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
        requests.post(f'{backend}assignments?email={user.email}&class_id={class_id}&name={name}&description={desc}')
        return redirect(url_for('classes'))
    return render_template('newAssignment.html')

@app.route('/newStudent', methods = ['GET', 'POST'])
def newStudent():
    if request.method == 'POST':
        email = user.email
        fname = request.form['fname']
        lname = request.form['lname']
        id = request.form['id']
        requests.post(f'{backend}students?email={user.email}&student_id={id}&first_name={fname}&last_name={lname}')
        return redirect(url_for('classes'))
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
        if 'pdf_file' not in request.files:
            return jsonify({"error": "No file part"}), 400 
      
        pdf = request.files['pdf_file']

        if pdf.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        if pdf:
            temp_path = os.path.join('temp', pdf.filename)
            pdf.save(temp_path)
            
            with open(temp_path, 'rb') as file:
                files = {'pdf': file}
                response = requests.post(f'{backend}qgen?email={user.email}&submission_id=1&result_id=1', files=files)
            os.remove(temp_path)
            
            if response.status_code == 200:
                questions = response.json()
                return jsonify(questions)
            else:
                return jsonify({"error": "Failed to generate questions"}), 500
    
    return render_template('newProject.html')

@app.route('/saveProject', methods=['POST'])
def saveProject():
    data = request.json
    
    project_title = data.get('title')
    custom_questions = data.get('customQuestions')
    generated_questions = data.get('generatedQuestions')
    
    project_data = {
        'email': user.email,
        'title': project_title,
        'custom_questions': custom_questions,
        'generated_questions': generated_questions
    }
    
    response = requests.post(f'{backend}saveProject', json=project_data)
    
    if response.status_code == 200:
        return jsonify({"success": True, "message": "Project saved successfully"})
    else:
        return jsonify({"success": False, "message": "Failed to save project"}), 500

@app.route('/logout')
def logout():
    user.userAuthenticated = False
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)