//https://expressjs.com/en/5x/api.html    

import * as express from 'express';
import {Request, Response} from 'express';
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
import * as AIService from "./AIService.ts";

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
app.post('/api/login', async (req: Request, res: Response) => {
    //for MVP (logging in)
    //we will receive email and password
    try {
        if (await loginUserCheck(Request.email) === true) {
            return true;
        }
        return false;
        console.log('Error: Login Failed', Error)
    }
    catch (error) {
        console.log('Error: ', error)
    }
});

app.post('/api/signup', async (req: Request, res: Response) => {
    //for MVP (signing up)
    //we will receive email and password
    try {
        if (await signupUser(Request.email) === true) {
            return true;
        }
        return false;
        console.log('Error: Sign Up Failed', Error)
    }
    catch (error) {
        console.log('Error: ', error)
    }
    //if so send success = false
    //if not used success = true
});

app.get('/api/classes', (req: Request, res: Response) =>{
    //for MVP (listing classes)
    // get list of classes of the user (how we are doing sessions though)
    try {
        const userClasses = getClasses(Request.email);
        if (userClasses != null) {
            return JSON.stringify(userClasses);
        }
        return false;
        console.log('Error: No Classes Found', Error)
    }
    catch (error) {
        console.log('Error: Classes Check Failed', error)
    }    
});

// Currently this creates a class with the user as Author, in the future this should be adding User to class Array and another end point should create classes
app.post('/api/classes', async (req: Request, res: Response) =>{
    //for MVP adding classes, add removal in later (should be simple)
    //adding classes for that user
    try {
        const success = createClass(Request.email, Request.code); // more fields added post MVP
        if (await success) {
            return true;
        }
        return false;
        console.log('Error: Classes Creation Failed', Error)
    }
    catch (error) {
        console.log('Error: ', error)
    }    
});

app.get('/api/assignments', (req: Request, res: Response) =>{
    //for MVP (listing classes)
    //list assignments for a specific class
    try {
        const userClassAssignments = getAssignments(Request.email, Request.class_id);
        if (userClassAssignments != null) {
            return JSON.stringify(userClassAssignments);
        }
        return false;
        console.log('Error: No Assignments Found', Error)
    }
    catch (error) {
        console.log('Error: Assignment Check Failed', error)
    }
});

app.post('/api/assignments', async (req: Request, res: Response) =>{
    //for MVP adding assignments, add removal in later (should be simple)
    //adding assignments to that class
    try {
        const success = createAssignment(Request.email, Request.class_id, Request.name, Request.description); // more fields added post MVP
        if (await success) {
            return true;
        }
        return false;
        console.log('Error: Assignment Creation Failed', Error)
    }
    catch (error) {
        console.log('Error: ', error)
    }  
});

app.get('/api/submissions', (req: Request, res: Response) =>{
    //for MVP (listing classes)
    //list submissions for a specific assignment
    try {
        const userSubmissions = getSubmissionsForAssignments(Request.email, Request.class_id, Request.assignment_id);
        if (userSubmissions != null) {
            return JSON.stringify(userSubmissions);
        }
        return false;
        console.log('Error: No Submissions Found', Error)
    }
    catch (error) {
        console.log('Error: Submission Check Failed', error)
    }
});

app.post('/api/submissions', async (req: Request, res: Response) =>{
    //for MVP adding removing submissions
    //adding submissions to an assignment
    try {
        const success = createSubmission(Request.email, Request.assignment_id, Request.student_id, Request.submission_date, Request.submission_filepath);
        if (await success) {
            return true;
        }
        return false;
        console.log('Error: Classes Creation Failed', Error)
    }
    catch (error) {
        console.log('Error: ', error)
    }  
});

//AI Generate Questions request (qgen = questions generate)
app.post('/api/qgen', async (req: Request, res: Response) => {
	//for MVP only single item, this needs to be checked with AI team about if created files are cleared.
	//We will get Submission ID
	try {
		const submission_id = Request.submission_id;
		const sPath = getSubmissionFilePathForSubID(submission_id);
		let ai = new AIService("./ServerStorage");
		//Writes questions/answers file to "./ServerStorage" specified in constructor
		let doc_id = ai.generateQuestions(sPath);
		//Accesses the storage location specified in the contructor
		let questions = ai.getQuestions(doc_id);
		postAIOutputForSubmission(submission_id, questions);
		//verify any questions exist for submission
        const foundAIQs = getVivaForSubmission(Request.email, Request.submission_id, Request.result_id);
		if (foundAIQs != null){
			return true;
		}
		return false;
		console.log('Error: AI Question Generation Failed', Error)
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