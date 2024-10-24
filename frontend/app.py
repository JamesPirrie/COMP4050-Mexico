from flask import Flask, request, render_template, url_for, redirect, session
from datetime import date
import requests
import json
import uuid
import time
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


backend = "http://localhost:3000/api/"

app = Flask(__name__)
app.secret_key = 'SUPERSECRETKEY'

class User:
    userAuthenticated = False
    userID = 0
    email = ""

user = User()

def isAuthenticated():
    return user.userAuthenticated

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


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

# accessing the backend API is handled with the helper functions at the bottom of this code
# look through the code to see examples of how this is done


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
        email = request.form['email']
        password = request.form['password']
        user_name = request.form['user_name']
        first_name = request.form['first_name']
        last_name = request.form['last_name']
        
        signup_data = {
            'email': email,
            'password': password,
            'user_name': user_name,
            'first_name': first_name,
            'last_name': last_name
        }
        
        print("Sending signup data:", signup_data)  # Debug print
        auth = requests.post(f'{backend}signup', json=signup_data)
        resp = json.loads(auth.content)
        print("Signup response:", resp)  # Debug print
        
        if resp.get('success') == True:
            return redirect(url_for('login'))
        return redirect(url_for('signup'))

#-----------------------------------
#Login Routes

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/loginDirect', methods = ['GET', 'POST'])
def loginDirect():
    if request.method == 'POST':
        # Ensure email is in a valid format that will pass backend validation
        email = request.form['email'].strip()
        if not '@' in email or not '.' in email.split('@')[1]:
            print("Invalid email format")
            return render_template('loginDirect.html', error="Please use a valid email format (e.g., user@domain.com)")
            
        password = request.form['password']
        
        login_data = {
            'email': email,
            'password': password
        }
        
        print("Sending login data:", login_data)
        auth = requests.post(f'{backend}login', json=login_data)
        resp = json.loads(auth.content)
        print("Auth response:", resp)
        
        if resp.get('success') == True:
            user.email = email
            user.userAuthenticated = True
            user.userID = resp.get('userID')
            session['token'] = resp.get('token')
            print(f"Login successful. UserID: {user.userID}")
            print(f"Token: {session.get('token')}")
            return redirect(url_for('dashboard'))
        else:
            print(f"Login failed: {resp.get('details')}")
            return render_template('loginDirect.html', error=resp.get('details'))
            
    return render_template('loginDirect.html')

#-----------------------------------
#Dashboard Route

@app.route('/dashboard')
def dashboard():
    # add request.get assignments to display
    return render_template('dashboard.html')

#-----------------------------------
#Class and Unit Routes

@app.route('/classes', methods = ['GET'])
def classes():
    if not isAuthenticated():
        return redirect(url_for('login'))
        
    try:
        classes_data = getClasses()
        for item in classes_data:
            print(item)
        return render_template('classes.html', classes = classes_data)
    except Exception as e:
        print(f"Error fetching classes: {e}")
        return redirect(url_for('login'))

@app.route('/new_class', methods = ['GET', 'POST'])
def new_class():
    if request.method == 'POST':
        name = request.form['name']
        code = request.form['code']
        json = {
            'user_id': user.userID,
            'session': 1,
            'year': 2024,
            'title': name,
            'code': code
        }
        postClass(json)
        return redirect(url_for('classes'))
    return render_template('newclass.html')

@app.route('/delete_class', methods = ['GET'])
def delete_class():
    classId = getClassId(request.args.get('class_id', ''))
    print('deleting ' + str(classId))
    deleteClass(classId)
    return redirect(url_for('classes'))

@app.route('/unit')
def unit():
    class_id = None
    classes = getClasses()
    current_class = request.args.get('class_id', '')
    
    for item in classes:
        if item['code'] == current_class:
            class_id = item['class_id']
            session['last_class_id'] = class_id
            session['last_class_code'] = current_class  # Store the class code
            break
            
    if not class_id:
        return redirect(url_for('classes'))
        
    return render_template('unit.html', 
                         assignments=getAssignments(class_id), 
                         students=getStudents(class_id))
    

#-----------------------------------
#Assignment Routes

@app.route('/assignment')
def assignment():
    if not isAuthenticated():
        return redirect(url_for('login'))
        
    try:
        assignments = getAssignments(session['last_class_id'])
        for a in assignments:
            if a['name'] == request.args.get('name', ''):
                assignment_id = a['assignment_id']
                session['last_assignment_id'] = assignment_id
                
        # Get submissions and students
        submissions = getSubmissions(assignment_id, session['last_class_id'])
        students = getStudents(session['last_class_id'])
        
        return render_template('assignment.html', 
                             submissions=submissions,
                             students=students)
    except Exception as e:
        logger.error(f"Error in assignment route: {e}")
        return redirect(url_for('classes'))

@app.route('/newAssignment', methods = ['GET', 'POST'])
def newAssignment():
    if request.method == 'POST':
        classes = getClasses()
        print(classes)
        for item in classes:
            if item['code'] == request.args.get('class_id', ''):
                class_id = item['class_id']
            else:
                print('no class id found')
                redirect(url_for('classes' , error='No class id found'))
        name = request.form['name']
        desc = request.form['desc']
        json = {'user_id': user.userID, 'class_id': class_id, 'name': name, 'description': desc}
        postAssignment(json)
        return redirect(url_for('unit', class_id=session.get('last_class_id')))
    return render_template('newAssignment.html')

#-----------------------------------
#Student Routes

#Student Routes
@app.route('/student')
def student():
    student = getStudentSingle(session['last_class_id'], request.args.get('student_id', ''))
    session['last_student_id'] = student['student_id']
    return render_template('student.html', student = student)

@app.route('/new_student', methods=['GET', 'POST'])
def new_student():
    if request.method == 'POST':
        email = user.email  # Get from the form if you want student's email
        fname = request.form['fname']
        lname = request.form['lname']
        id = request.form['id']
        
        json = {
            'user_id': user.userID,
            'student_id': id,
            'first_name': fname,
            'last_name': lname,
            'email': f"{fname}.{lname}@students.mq.edu.au"  # Generate a default email or get from form
        }
        
        if postStudent(json):
            print("Student created and added to class successfully")
            return redirect(url_for('unit', class_code=session.get('last_class_code')))
        else:
            print("Failed to create student or add to class")
            return redirect(url_for('classes'))
            
    return render_template('newStudent.html')

#-----------------------------------
#Viva and Rubric Routes

#fix to recieve viva submission_id as query
@app.route('/vivas')
def vivas():
    a = requests.get(f'{backend}vivas?email={user.email}').content
    # jam in request.post viva
    return render_template('vivas.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')

@app.route('/new_project', methods=['GET', 'POST'])
def new_project():
    if request.method == 'POST':
        pdf = request.files['pdf_file']
        files = {'submission_PDF': pdf}
        student_id = request.form['student']
        jsons = {
            'user_id': user.userID,
            'assignment_id': session['last_assignment_id'],
            'student_id': student_id,
            'submission_date': str(date.today()),
            'submission_filepath': pdf.filename
        }
        
        # Create submission and get submission ID
        response = postSubmission(files, jsons)
        if response.status_code == 200:
            # Get the latest submission for this student/assignment
            submissions = getSubmissions(session['last_assignment_id'], session['last_class_id'])
            if submissions:
                latest_submission = max(submissions, key=lambda x: x['submission_id'])
                return redirect(url_for('submission', submission_id=latest_submission['submission_id']))
            
        return redirect(url_for('unit'))
    
    students = getStudents(session['last_class_id'])
    assignment_name = ""
    assignments = getAssignments(session['last_class_id'])
    for a in assignments:
        if a['assignment_id'] == session['last_assignment_id']:
            assignment_name = a['name']

    return render_template('newProject.html', students=students, assignment_name=assignment_name)

@app.route('/logout')
def logout():
    user.userAuthenticated = False
    return redirect(url_for('login'))

@app.route('/submission')
def submission():
    if not isAuthenticated():
        return redirect(url_for('login'))
        
    submission_id = request.args.get('submission_id')
    logger.debug(f"Viewing submission {submission_id}")
    
    try:
        # Get submission details
        submissions_response = getSubmissions(session.get('last_assignment_id'), session.get('last_class_id'))
        
        # Find the specific submission
        if isinstance(submissions_response, dict) and 'data' in submissions_response:
            submissions_list = submissions_response['data']
            submission = next((s for s in submissions_list 
                             if str(s['submission_id']) == str(submission_id)), None)
        else:
            logger.error("Invalid submissions response format")
            return redirect(url_for('classes'))
            
        if not submission:
            logger.error("Submission not found")
            return redirect(url_for('classes'))
            
        # Get student information
        students_response = getStudents(session['last_class_id'])
        if isinstance(students_response, dict) and 'data' in students_response:
            students = students_response['data']
            student = next((s for s in students 
                          if s['student_id'] == submission['student_id']), None)
        else:
            student = None
            
        # Get questions
        headers = {
            'Authorization': f'Bearer {session.get("token")}'
        }
        
        questions_url = f'{backend}qgen?user_id={user.userID}&submission_id={submission_id}'
        questions_response = requests.get(questions_url, headers=headers)
        
        if questions_response.status_code == 200:
            questions_data = questions_response.json()
            if isinstance(questions_data, dict) and 'data' in questions_data:
                questions = questions_data['data']
            else:
                questions = questions_data if isinstance(questions_data, list) else []
        else:
            questions = []
            
        logger.debug(f"Retrieved questions: {questions}")
            
        return render_template('submission.html',
                             submission=submission,
                             student=student,
                             questions=questions,
                             submission_id=submission_id)
                             
    except Exception as e:
        logger.error(f"Error in submission route: {e}")
        logger.error(f"Submissions response: {submissions_response}")
        return redirect(url_for('classes'))

@app.route('/generate')
def generate():
    if not isAuthenticated():
        return redirect(url_for('login'))
        
    submission_id = request.args.get('submission_id')
    logger.debug(f"Generate request received for submission_id: {submission_id}")
    
    if not submission_id:
        logger.error("No submission_id provided")
        return redirect(url_for('classes'))
        
    try:
        data = {
            'user_id': user.userID,
            'submission_id': int(submission_id)
        }
        
        headers = {
            'Authorization': f'Bearer {session.get("token")}'
        }
        
        logger.debug(f"Sending question generation request with data: {data}")
        response = requests.post(
            f'{backend}qgen',
            json=data,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            logger.debug("Question generation successful")
            logger.debug(f"Response: {response.text}")
        else:
            logger.error(f"Question generation failed: {response.status_code} - {response.text}")
            
        # Add small delay to allow backend processing
        time.sleep(2)
        
        return redirect(url_for('submission', submission_id=submission_id))
        
    except Exception as e:
        logger.error(f"Error in generate route: {e}")
        return redirect(url_for('submission', submission_id=submission_id))

#-----------------------------------------------------------------------------------------------------------------
#Helper Functions

def getClassId(class_code):
    classes = getClasses()
    for c in classes:
        if c['code'] == class_code:
            return c['class_id']
    return None
def getStudentSingle(classid, id):
    students = getStudents(classid)
    for s in students:
        if s.get('student_id') == int(id):
            return s
    return None

def getHeaders():
    return {'Authorization': f'Bearer {session.get("token")}'}

#-----------------------------------
#Login functions
def login(json = {'email': user.email}):
    return requests.post(f'{backend}login', json = json)

def signup(json = {'email': user.email}):
    return requests.post(f'{backend}signup', json = json)


#Class functions
def getClasses():
    if not session.get('token'):
        print("No token found in session")
        return []
    
    # Only send user_id as query parameter
    url = f"{backend}classes?user_id={user.userID}"
    print(f"Making request to: {url}")
    
    response = requests.get(url, headers=getHeaders())
    
    if response.ok:
        print("Success:", response.json())
        resp_data = response.json()
        return resp_data.get('data', [])
    else:
        print(f"Error {response.status_code}:", response.text)
        return []

def postClass(json):
    # Ensure the JSON contains user_id but not email
    if 'email' in json:
        del json['email']
    json['user_id'] = user.userID
    
    return requests.post(f'{backend}classes', json=json, headers=getHeaders())

def deleteClass(classid):
    json = {'user_id': user.userID, 'class_id': classid}
    return requests.delete(f'{backend}classes', json = json, headers=getHeaders())

def updateClass(json):
    return requests.put(f'{backend}classes', json = json, headers=getHeaders())

#Assignment functions
def getAssignments(class_id):

    params = {
        'user_id': user.userID,
        'class_id': class_id
    }
    
    print(f"Getting assignments for class_id: {class_id}")
    response = requests.get(f'{backend}assignments', headers=getHeaders(), params=params)
    
    if response.ok:
        resp_data = response.json()
        return resp_data.get('data', [])
    print(f"Error getting assignments: {response.text}")
    return []

def postAssignment(json):
    return requests.post(f'{backend}assignments', json = json, headers=getHeaders())

def deleteAssignment(assignmentid):
    return requests.delete(f'{backend}assignments', json = {'email': user.email, 'assignment_id': assignmentid})

def updateAssignment(json):
    return requests.put(f'{backend}assignments', json = json)

#Student functions
def getStudents(class_id):
    params = {
        'user_id': user.userID,
        'class_id': class_id
    }
    
    print(f"Getting students for class_id: {class_id}")
    response = requests.get(f'{backend}students', headers=getHeaders(), params=params)
    
    if response.ok:
        resp_data = response.json()
        return resp_data.get('data', [])
    print(f"Error getting students: {response.text}")
    return []


def postStudent(json):
    print(f"Creating student with data: {json}")
    response = requests.post(f'{backend}students', json=json, headers=getHeaders())
    
    if response.ok:
        print("Student creation successful")
        # After creating the student, we need to add them to the class
        return addStudentToClass(json['student_id'])
    else:
        print(f"Error creating student: {response.text}")
        return False
    
def addStudentToClass(student_id):
    if not session.get('last_class_id'):
        print("No class ID found in session")
        return False
        
    headers = {
        'Authorization': f'Bearer {session.get("token")}'
    }
    
    json_data = {
        'user_id': user.userID,
        'student_id': student_id,
        'class_id': session.get('last_class_id')
    }
    
    print(f"Adding student to class with data: {json_data}")
    response = requests.post(f'{backend}classesStudents', json=json_data, headers=headers)
    
    if response.ok:
        print("Student added to class successfully")
        return True
    else:
        print(f"Error adding student to class: {response.text}")
        return False   

def deleteStudent(studentid):
    return requests.delete(f'{backend}students', json = {'student_id': studentid})

def updateStudent(json):
    return requests.put(f'{backend}students', json = json)


#Submission functions
def getSubmissions(assignmentid, classid):
    response = requests.get(
        f'{backend}submissions?user_id={user.userID}&assignment_id={assignmentid}&class_id={classid}', headers=getHeaders())
    
    if response.status_code == 200:
        return response.json()  # Returns the entire response including data and details
    return {'data': [], 'details': 'Failed to get submissions'}


def postSubmission(files, json):
    print('posting submission')
    return requests.post(f'{backend}submissions', files = files, data = json, headers=getHeaders())

def deleteSubmission(submissionid):
    return requests.delete(f'{backend}submissions', json = {'email': user.email, 'submission_id': submissionid})

def updateSubmission(json):
    return requests.put(f'{backend}submissions', json = json)

#Viva functions
def getVivas(classid):
    return json.loads(requests.get(f'{backend}vivas?email={user.email}&class_id={classid}').content)

def postViva(json):
    return requests.post(f'{backend}vivas', json = json)

def deleteViva(vivaid):
    return requests.delete(f'{backend}vivas', json = {'email': user.email, 'viva_id': vivaid})

def updateViva(json): 
    return requests.put(f'{backend}vivas', json = json)

#Question Gen functions
def getQuestions(submission_id):
    if not submission_id:
        return {'data': [], 'details': 'No submission ID provided'}
    
    response = requests.get(
        f'{backend}qgen?user_id={user.userID}&submission_id={submission_id}', headers=getHeaders())
    
    if response.status_code == 200:
        return response.json()
    return {'data': [], 'details': 'Failed to get questions'}

def postQuestion(json_data):
    try:
        submission_id = int(json_data.get('submission_id', 0))
        if submission_id <= 0:
            logger.error(f"Invalid submission_id: {submission_id}")
            return None
            
        logger.debug(f"Sending question generation request for submission_id: {submission_id}")
        
        # Send as form data with string values
        form_data = {
            'submission_id': str(submission_id)
        }
        
        logger.debug(f"Sending form data: {form_data}")
        
        response = requests.post(
            f'{backend}qgen',
            data=form_data,
            timeout=30
        )
        
        if response.status_code == 200:
            logger.debug(f"Question generation response: {response.text}")
            return response
        else:
            logger.error(f"Question generation failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"Error posting question: {e}")
        return None
    
    
#Rubric functions
def getRubrics(userid, submissionid, projectoverview, criteria, topics, goals):
    return json.loads(requests.get(f'{backend}rubricgen?user_id={userid}&submission_id={submissionid}&project_overview={projectoverview}&criteria={criteria}&topics={topics}&goals={goals}').content)

def getSummary(userid, submissionid):
    return json.loads(requests.get(f'{backend}summarygen?user_id={userid}&submission_id={submissionid}').content)

if __name__ == '__main__':
    app.run(debug=True)