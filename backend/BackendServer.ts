//https://expressjs.com/en/5x/api.html    

import express from 'express';
import {Response, Request} from 'express';
import {getUserIDbyEmail} from "./DatabaseUtil.ts";
import {loginUserCheck} from "./DatabaseUtil.ts";
import {signupUser} from "./DatabaseUtil.ts";
import {getUser} from "./DatabaseUtil.ts";
import {signup} from "./DatabaseUtil.ts";
import {getClasses} from "./DatabaseUtil.ts";
import {getAssignments} from "./DatabaseUtil.ts";
import {getSubmissionsForAssignments} from "./DatabaseUtil.ts";
import {getVivaForSubmission} from "./DatabaseUtil.ts";
import {getSubmissionFilePathForSubID} from "./DatabaseUtil.ts";
import {createClass} from "./DatabaseUtil.ts";
import {createAssignment} from "./DatabaseUtil.ts";
import {createSubmission} from "./DatabaseUtil.ts";
import {postAIOutputForSubmission} from "./DatabaseUtil.ts";
import * as AIService from "comp4050ai";

import {loginRequest, getClassesRequest, postClassesRequest, getAssignmentsRequest, postAssignmentsRequest} from './RequestInterfaces.ts'
import {getSubmissionsRequest, postSubmissionsRequest, qGenRequest} from './RequestInterfaces.ts'

const app = express();
const port = 3000;

app.use(express.json());//without this req.body is undefined

//placeholders for now
//GET requests
app.get('/', (req: Request, res: Response) => {
    console.log('GET request received');
    res.send('GET request received');
});

//POST requests
app.post('/', (req: Request, res: Response) => {
    console.log('POST request received');
    res.send('POST Request received');

    console.log('headers:');
    console.log(req.headers);

    console.log('body: ');
    console.log(req.body);

    console.log('parameters');
    console.log(req.params);

    console.log('ip');
    console.log(req.ip);//will probably be ::1 in localhost
});

//PUT requests
app.put('/', (req: Request, res: Response) => {
    console.log('PUT request received');
    res.send('PUT Request received')
});

//actual endpoints (my understanding of how this will work please correct this if im wrong)
app.post('/api/login', async (req: loginRequest, res: Response) => {
    //for MVP (logging in)
    //we will receive email and password
    try {
        if(typeof(req.email) != 'undefined'){//because these have to be optional, it will also serve as a did we receive anything check
            if (await loginUserCheck(req.email) === true) {
                return true;//optimise this later
            }
        }
        console.log('Error: Login Failed', Error)
        return false;
    }
    catch (error) {
        console.log('Error: ', error)
    }
});

app.post('/api/signup', async (req: loginRequest, res: Response) => {
    //for MVP (signing up)
    //we will receive email and password
    try {
        if(typeof(req.email) != 'undefined'){
            if (await signupUser(req.email) === true) {
                return true;
            }
        }
        console.log('Error: Sign Up Failed', Error)
        return false;
    }
    catch (error) {
        console.log('Error: ', error)
    }
    //if so send success = false
    //if not used success = true
});

app.get('/api/classes', (req: getClassesRequest, res: Response) =>{
    //for MVP (listing classes)
    // get list of classes of the user (how we are doing sessions though)
    try {
        if(typeof(req.email) != 'undefined'){
            const userClasses = getClasses(req.email);
            if (userClasses != null) {
                return JSON.stringify(userClasses);
            }
        }
        console.log('Error: No Classes Found', Error)
        return false;
    }
    catch (error) {
        console.log('Error: Classes Check Failed', error)
    }    
});

// Currently this creates a class with the user as Author, in the future this should be adding User to class Array and another end point should create classes
app.post('/api/classes', async (req: postClassesRequest, res: Response) =>{
    //for MVP adding classes, add removal in later (should be simple)
    //adding classes for that user
    try {
        if(typeof(req.email) != 'undefined' && typeof(req.code) != 'undefined'){
            const success = createClass(req.email, req.code); // more fields added post MVP
            if (await success) {
                return true;
            }
        }
        console.log('Error: Classes Creation Failed', Error)
        return false;
    }
    catch (error) {
        console.log('Error: ', error)
    }    
});

app.get('/api/assignments', (req: getAssignmentsRequest, res: Response) =>{
    //for MVP (listing classes)
    //list assignments for a specific class
    try {
        if(typeof(req.email) != 'undefined' && typeof(req.class_id) != 'undefined'){
            const userClassAssignments = getAssignments(req.email, req.class_id);
            if (userClassAssignments != null) {
                return JSON.stringify(userClassAssignments);
            }
        }
        console.log('Error: No Assignments Found', Error)
        return false;
    }
    catch (error) {
        console.log('Error: Assignment Check Failed', error)
    }
});

app.post('/api/assignments', async (req: postAssignmentsRequest, res: Response) =>{
    //for MVP adding assignments, add removal in later (should be simple)
    //adding assignments to that class
    try {
        if(typeof(req.email) != 'undefined' && typeof(req.class_id) != 'undefined' && typeof(req._name) != 'undefined' && typeof(req.description) != 'undefined'){
            const success = createAssignment(req.email, req.class_id, req._name, req.description); // more fields added post MVP
            if (await success) {
                return true;
            }
        }
        console.log('Error: Assignment Creation Failed', Error)
        return false;
    }
    catch (error) {
        console.log('Error: ', error)
    }  
});

app.get('/api/submissions', (req: getSubmissionsRequest, res: Response) =>{
    //for MVP (listing classes)
    //list submissions for a specific assignment
    try {
        if(typeof(req.email) != 'undefined' && typeof(req.class_id) != 'undefined' && typeof(req.assignment_id) != 'undefined'){
            const userSubmissions = getSubmissionsForAssignments(req.email, req.class_id, req.assignment_id);
            if (userSubmissions != null) {
                return JSON.stringify(userSubmissions);
            }
        }
        console.log('Error: No Submissions Found', Error)
        return false;
    }
    catch (error) {
        console.log('Error: Submission Check Failed', error)
    }
});

app.post('/api/submissions', async (req: postSubmissionsRequest, res: Response) =>{
    //for MVP adding removing submissions
    //adding submissions to an assignment
    try {
        if(typeof(req.email) != 'undefined' && typeof(req.assignment_id) != 'undefined' && typeof(req.student_id) != 'undefined' && typeof(req.submission_date) != 'undefined' && typeof(req.submission_filepath) != 'undefined'){
            const success = createSubmission(req.email, req.assignment_id, req.student_id, req.submission_date, req.submission_filepath);
            if (await success) {
                return true;
            }
        }
        console.log('Error: Classes Creation Failed', Error)
        return false;
    }
    catch (error) {
        console.log('Error: ', error)
    }  
});

//AI Generate Questions request (qgen = questions generate)
app.post('/api/qgen', async (req: qGenRequest, res: Response) => {
	//for MVP only single item, this needs to be checked with AI team about if created files are cleared.
	//We will get Submission ID
	try {
        if(typeof(req.email) != 'undefined' && typeof(req.submission_id) != 'undefined' && typeof(req.result_id) != 'undefined'){
            const sPath = getSubmissionFilePathForSubID(req.submission_id);
            let ai = new AIService("./ServerStorage");
            //Writes questions/answers file to "./ServerStorage" specified in constructor
            let doc_id = ai.generateQuestions(sPath);
            //Accesses the storage location specified in the contructor
            let questions = ai.getQuestions(doc_id);
            postAIOutputForSubmission(parseInt(req.submission_id), questions);
            //verify any questions exist for submission
            const foundAIQs = getVivaForSubmission(req.email, req.submission_id, req.result_id);
            if (foundAIQs != null){
                return true;
            }
        }
        console.log('Error: AI Question Generation Failed', Error)
		return false;
	}
	catch (error) {
	    console.log('Error: ', error)
	}	
	//if AI function succeeds return true else return false
});

app.get('/api/vivas', (req: Request, res: Response) =>{
    //for MVP listing vivas
});

app.post('/api/vivas', (req: Request, res: Response) =>{
    //for MVP adding and removing vivas
});



//start the server
app.listen(port, () => {
    console.log('listening at port:', port);
});