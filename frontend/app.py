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
        email=request.form['email']
        auth = requests.post(f'{backend}signup', json = {'email': email})
        if auth.text == 'true':
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
        email=request.form['email']
        auth = requests.post(f'{backend}login', json = {'email': email})
        resp = json.loads(auth.content)
        print(resp)
        if auth.text == 'true':
            user.email = email
            user.userAuthenticated = True
            #user.userID = json.loads(resp)['user_id']
            print(user)
            return redirect(url_for('dashboard'))
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
    classes = getClasses()
    for item in classes:
        print(item)
    return render_template('classes.html', classes = classes)

@app.route('/new_class', methods = ['GET', 'POST'])
def new_class():
    if request.method == 'POST':
        name = request.form['name']
        code = request.form['code']
        json = {'email': user.email, 'session': 1, 'year': 2024, 'title': name, 'code': code}
        postClass(json)
        return redirect(url_for('classes'))
    return render_template('newclass.html')

@app.route('/unit')
def unit():
    class_id = None
    classes = getClasses()
    current_class = request.args.get('class', '')
    
    for item in classes:
        if item['code'] == current_class:
            class_id = item['class_id']
            session['last_class_id'] = class_id
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
    assignments = getAssignments(session['last_class_id'])
    for a in assignments:
        if a['name'] == request.args.get('name', ''):
            assignment_id = a['assignment_id']
            session['last_assignment_id'] = assignment_id
    submissions = getSubmissions(assignment_id, session['last_class_id'])     #Changed to getSubmissions
    return render_template('assignment.html', submissions = submissions)

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
        name = request.form['name']
        desc = request.form['desc']
        json = {'email': user.email, 'class_id': class_id, 'name': name, 'description': desc}
        postAssignment(json)
        return redirect(url_for('classes'))
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
        email = user.email
        fname = request.form['fname']
        lname = request.form['lname']
        id = request.form['id']
        json = {'email': user.email, 'student_id': id, 'first_name': fname, 'last_name': lname}
        postStudent(json)
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
            'email': user.email,
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
    submission_id = request.args.get('submission_id')
    logger.debug(f"Viewing submission {submission_id}")
    
    try:
        # Get submission details
        submissions = getSubmissions(session.get('last_assignment_id'), session.get('last_class_id'))
        submission = next((s for s in submissions if str(s['submission_id']) == str(submission_id)), None)
        
        # Get questions
        questions = getQuestions(submission_id)
        logger.debug(f"Retrieved questions for submission {submission_id}: {questions}")
        
        # Sort questions by generation date (newest first)
        if questions:
            questions.sort(key=lambda x: x['generation_date'], reverse=True)
        
        return render_template('submission.html',
                             submission=submission,
                             questions=questions,
                             submission_id=submission_id)
    except Exception as e:
        logger.error(f"Error in submission route: {e}")
        return redirect(url_for('classes'))

@app.route('/generate')
def generate():
    submission_id = request.args.get('submission_id')
    logger.debug(f"Generate request received for submission_id: {submission_id}")
    
    if not submission_id:
        logger.error("No submission_id provided")
        return redirect(url_for('classes'))
        
    try:
        # Convert to integer and validate
        submission_id_int = int(submission_id)
        if submission_id_int <= 0:
            raise ValueError("Invalid submission ID")

        # Generate questions
        data = {
            'submission_id': submission_id_int,
            'email': user.email
        }
        
        logger.debug(f"Sending question generation request with data: {data}")
        response = requests.post(
            f'{backend}qgen',
            json=data,  # Use json parameter instead of data
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

#-----------------------------------
#Helper Functions

def getStudentSingle(classid, id):
    """
    Gets a single student for the current user.
    Returns:
        dict: A single student
    """
    students = getStudents(classid)
    for s in students:
        if s['student_id'] == int(id):
            return s
    return ''

#-----------------------------------
#Login functions
def login(json = {'email': user.email}):
    """
    Logs the user in to the backend server. Defaults to using user.email.
    Returns:
        response: The response from the server
    """
    return requests.post(f'{backend}login', json = json)

def signup(json = {'email': user.email}):
    """
    Signs the user up to the backend server. Defaults to using user.email.
    Returns:
        response: The response from the server
    """
    return requests.post(f'{backend}signup', json = json)


#Class functions
def getClasses():
    """
    Gets a list of classes for the current user.
    Returns:
        list: a list of classes
    """
    return json.loads(requests.get(f'{backend}classes?email={user.email}').content)

def postClass(json):
    """
    Posts a class to the backend server.
    Args:
        json (dict): A json object to be posted
    Returns:
        response: The response from the server
    """
    return requests.post(f'{backend}classes', json = json)

def deleteClass(classid):
    """
    Deletes a class from the backend server.
    Args:
        classid (int): The id of the class to delete
    Returns:
        response: The response from the server
    """
    return requests.delete(f'{backend}classes', json = {'email': user.email, 'class_id': classid})

def updateClass(json):
    """
    Updates a class in the backend server.
    Args:
        json (dict): A json object to be posted
    Returns:
        response: The response from the server
    """
    return requests.put(f'{backend}classes', json = json)

#Assignment functions
def getAssignments(classid):
    """
    Gets a list of assignments for the given class or for the current user's last class if classid is not provided.
    Args:
        classid (int): the id of the class to get assignments for; defaults to the current user's last class id
    Returns:
        list: A list of assignments
    """
    return json.loads(requests.get(f'{backend}assignments?email={user.email}&class_id={classid}').content)

def postAssignment(json):
    """
    Posts an assignment to the backend server.
    Args:
        json (dict): A json object to be posted
    Returns:
        response: The response from the server
    """
    return requests.post(f'{backend}assignments', json = json)

def deleteAssignment(assignmentid):
    """
    Deletes an assignment from the backend server.
    Args:
        assignmentid (int): The id of the assignment to delete
    Returns:
        response: The response from the server
    """
    return requests.delete(f'{backend}assignments', json = {'email': user.email, 'assignment_id': assignmentid})

def updateAssignment(json):
    """
    Updates an assignment in the backend server.
    Args:
        json (dict): A json object to be posted
    Returns:
        response: The response from the server
    """
    return requests.put(f'{backend}assignments', json = json)

#Student functions
def getStudents(classid):
    """
    Gets a list of students for the given class or for the current user's last class if classid is not provided.
    Args:
        classid (int): the id of the class to get students for; defaults to the current user's last class id
    Returns:
        list: A list of students
    """
    return json.loads(requests.get(f'{backend}students?email={user.email}&class_id={classid}').content)

def postStudent(json):
    """
    Posts a student to the backend server.
    Args:
        json (dict): A json object to be posted
    Returns:
        response: The response from the server
    """
    return requests.post(f'{backend}students', json = json)

def deleteStudent(studentid):
    """
    Deletes a student from the backend server.
    Args:
        studentid (int): The id of the student to delete
    Returns:
        response: The response from the server
    """
    return requests.delete(f'{backend}students', json = {'student_id': studentid})

def updateStudent(json):
    """
    Updates a student in the backend server.
    Args:
        json (dict): A json object to be posted
    Returns:
        response: The response from the server
    """
    return requests.put(f'{backend}students', json = json)


#Submission functions
def getSubmissions(assignmentid, classid):
    """
    Gets a list of submissions for the given assignment and class.
    Args:
        assignmentid (int): The id of the assignment to get submissions for
        classid (int): The id of the class to get submissions for; defaults to the current user's last class
    Returns:
        list: A list of submissions
    """
    return json.loads(requests.get(f'{backend}submissions?email={user.email}&assignment_id={assignmentid}&class_id={classid}').content)

def postSubmission(files, json):
    """
    Posts a submission to the backend server. IMPORTANT note that the files parameter must contain the file, and json must be sent to data (due to MULTIPART)
    Args:
        data (bytes): The binary data of the submission document
        json (dict): A json object containing the assignment id, student id and submission date
    Returns:
        response: The response from the server
    """
    print('posting submission')
    return requests.post(f'{backend}submissions', files = files, data = json)

def deleteSubmission(submissionid):
    """
    Deletes a submission from the backend server.
    Args:
        submissionid (int): The id of the submission to delete
    Returns:
        response: The response from the server
    """
    return requests.delete(f'{backend}submissions', json = {'email': user.email, 'submission_id': submissionid})

def updateSubmission(json):
    """
    Updates a submission in the backend server.
    Args:
        json (dict): A json object to be posted
    Returns:
        response: The response from the server
    """
    return requests.put(f'{backend}submissions', json = json)

#Viva functions
def getVivas(classid):
    """
    Gets a list of vivas for the given class or for the current user's last class if classid is not provided.
    Args:
        classid (int): the id of the class to get vivas for; defaults to the current user's last class id
    Returns:
        list: A list of vivas
    """
    return json.loads(requests.get(f'{backend}vivas?email={user.email}&class_id={classid}').content)

def postViva(json):
    """
    Posts a viva to the backend server.
    Args:
        json (dict): A json object to be posted
    Returns:
        response: The response from the server
    """
    return requests.post(f'{backend}vivas', json = json)

def deleteViva(vivaid):
    """
    Deletes a viva from the backend server.
    Args:
        vivaid (int): The id of the viva to delete
    Returns:
        response: The response from the server
    """
    return requests.delete(f'{backend}vivas', json = {'email': user.email, 'viva_id': vivaid})

def updateViva(json): 
    """
    Updates a viva in the backend server.
    Args:
        json (dict): A json object to be posted
    Returns:
        response: The response from the server
    """
    return requests.put(f'{backend}vivas', json = json)

#Question Gen functions
def getQuestions(submission_id=None):
    """
    Gets a list of AI questions from the backend server.
    Args:
        submission_id (int, optional): The submission ID to filter questions for
    Returns:
        list: A list of questions
    """
    try:
        if submission_id:
            url = f'{backend}qgen?submission_id={int(submission_id)}'
            logger.debug(f"Getting questions from URL: {url}")
            
            response = requests.get(url)
            logger.debug(f"Response status: {response.status_code}")
            logger.debug(f"Response content: {response.text}")
            
            if response.status_code == 200:
                return json.loads(response.content)
        return []
    except Exception as e:
        logger.error(f"Error getting questions: {e}")
        return []

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
    """
    Gets a list of rubrics from the backend server.
    Args:
        userid (int): The id of the user to get rubrics for
        submissionid (int): The id of the submission to get rubrics for
        projectoverview (string): The project overview
        criteria (string): The criteria
        topics (string): The Topics
        goals (string): The Goals
    Returns:
        list: A list of rubrics
    """
    return json.loads(requests.get(f'{backend}rubricgen?user_id={userid}&submission_id={submissionid}&project_overview={projectoverview}&criteria={criteria}&topics={topics}&goals={goals}').content)

def getSummary(userid, submissionid):
    return json.loads(requests.get(f'{backend}summarygen?user_id={userid}&submission_id={submissionid}').content)

if __name__ == '__main__':
    app.run(debug=True)