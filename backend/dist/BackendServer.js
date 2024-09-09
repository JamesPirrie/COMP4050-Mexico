"use strict";
//https://expressjs.com/en/5x/api.html    
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const DatabaseUtil_1 = require("./DatabaseUtil");
const DatabaseUtil_2 = require("./DatabaseUtil");
const DatabaseUtil_3 = require("./DatabaseUtil");
const DatabaseUtil_4 = require("./DatabaseUtil");
const DatabaseUtil_5 = require("./DatabaseUtil");
const DatabaseUtil_6 = require("./DatabaseUtil");
const DatabaseUtil_7 = require("./DatabaseUtil");
const DatabaseUtil_8 = require("./DatabaseUtil");
const DatabaseUtil_9 = require("./DatabaseUtil");
const DatabaseUtil_10 = require("./DatabaseUtil");
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json()); //without this req.body is undefined
//placeholders for now
//GET requests
app.get('/', (req, res) => {
    console.log('GET request received');
    res.send('GET request received');
});
//POST requests
app.post('/', (req, res) => {
    console.log('POST request received');
    res.send('POST Request received');
    console.log('headers:');
    console.log(req.headers);
    console.log('body: ');
    console.log(req.body);
    console.log('parameters');
    console.log(req.params);
    console.log('ip');
    console.log(req.ip); //will probably be ::1 in localhost
    console.log(req.query); //seems to contain what we want
});
//PUT requests
app.put('/', (req, res) => {
    console.log('PUT request received');
    res.send('PUT Request received');
});
//actual endpoints (my understanding of how this will work please correct this if im wrong)
app.post('/api/login', async (req, res) => {
    //for MVP (logging in)
    //we will receive email and password
    try {
        console.log('Received POST to /api/login');
        if (await (0, DatabaseUtil_1.loginUserCheck)(JSON.stringify(req.query.email)) === true) {
            console.log('login with: ' + JSON.stringify(req.query.email) + 'successful');
            res.send(JSON.stringify(true));
        }
        else {
            console.log('Error: Login Failed', Error);
            res.send(JSON.stringify(false));
        }
    }
    catch (error) {
        console.log('Error: ', error);
    }
});
app.post('/api/signup', async (req, res) => {
    //for MVP (signing up)
    //we will receive email and password
    try {
        console.log('Received POST to /api/signup');
        if (await (0, DatabaseUtil_2.signupUser)(JSON.stringify(req.query.email)) === true) {
            console.log('signup with: ' + req.query.email + ' successful');
            res.send(JSON.stringify(true));
        }
        else {
            console.log('Error: Sign Up with ' + req.query.email + 'Failed', Error);
            res.send(JSON.stringify(false));
        }
    }
    catch (error) {
        console.log('Error: ', error);
    }
    //if so send success = false
    //if not used success = true
});
app.get('/api/classes', async (req, res) => {
    //for MVP (listing classes)
    // get list of classes of the user (how we are doing sessions though)
    try {
        console.log('Received GET to /api/classes');
        const userClasses = await (0, DatabaseUtil_3.getClasses)(JSON.stringify(req.query.email)); //get the classes for the user assigned to that email
        if (userClasses != null) { //if something has returned
            console.log('GET classes successful');
            res.send(JSON.stringify(userClasses)); //send them
        }
        else {
            console.log('Error: No Classes Found', Error);
            res.send(JSON.stringify({}));
        }
    }
    catch (error) {
        console.log('Error: Classes Check Failed', error);
    }
});
// Currently this creates a class with the user as Author, in the future this should be adding User to class Array and another end point should create classes
app.post('/api/classes', async (req, res) => {
    //for MVP adding classes, add removal in later (should be simple)
    //adding classes for that user
    try {
        console.log('Received POST to /api/classes');
        const success = await (0, DatabaseUtil_8.createClass)(JSON.stringify(req.query.email), JSON.stringify(req.query.code)); // more fields added post MVP
        if (success) {
            res.send(JSON.stringify(true));
            console.log('Create class successful');
        }
        else {
            console.log('Error: Classes Creation Failed', Error);
            res.send(JSON.stringify(false));
        }
    }
    catch (error) {
        console.log('Error: ', error);
    }
});
app.get('/api/assignments', async (req, res) => {
    //for MVP (listing classes)
    //list assignments for a specific class
    try {
        console.log('Received GET to /api/assignments');
        const userClassAssignments = await (0, DatabaseUtil_4.getAssignments)(JSON.stringify(req.query.email), Number(req.query.class_id));
        if (userClassAssignments != null) {
            res.send(JSON.stringify(userClassAssignments));
            console.log('GET assignments successful');
        }
        else {
            res.send(JSON.stringify({}));
            console.log('Error: No Assignments Found', Error);
        }
    }
    catch (error) {
        console.log('Error: Assignment Check Failed', error);
    }
});
app.post('/api/assignments', async (req, res) => {
    //for MVP adding assignments, add removal in later (should be simple)
    //adding assignments to that class
    try {
        console.log('Received POST to /api/assignments');
        const success = await (0, DatabaseUtil_9.createAssignment)(JSON.stringify(req.query.email), Number(req.query.class_id), JSON.stringify(req.query.name), JSON.stringify(req.query.description)); // more fields added post MVP
        if (success) {
            res.send(JSON.stringify(true));
            console.log('Create class successful');
        }
        else {
            res.send(JSON.stringify(false));
            console.log('Error: Assignment Creation Failed', Error);
        }
    }
    catch (error) {
        console.log('Error: ', error);
    }
});
app.get('/api/submissions', async (req, res) => {
    //for MVP (listing classes)
    //list submissions for a specific assignment
    try {
        console.log('Received GET to /api/submissions');
        const userSubmissions = await (0, DatabaseUtil_5.getSubmissionsForAssignments)(JSON.stringify(req.query.email), Number(req.query.class_id), Number(req.query.assignment_id));
        if (userSubmissions != null) {
            res.send(JSON.stringify(userSubmissions));
            console.log('GET submissions successful');
        }
        else {
            res.send(JSON.stringify({}));
            console.log('Error: No Submissions Found', Error);
        }
    }
    catch (error) {
        console.log('Error: Submission Check Failed', error);
    }
});
app.post('/api/submissions', async (req, res) => {
    //for MVP adding removing submissions
    //adding submissions to an assignment
    try {
        console.log('Received POST to /api/submissions');
        const success = await (0, DatabaseUtil_10.createSubmission)(JSON.stringify(req.query.email), Number(req.query.assignment_id), Number(req.query.student_id), JSON.stringify(req.query.submission_date), JSON.stringify(req.query.submission_filepath));
        if (success) {
            res.send(JSON.stringify(true));
            console.log('Create submission successful');
        }
        else {
            console.log('Error: submission Creation Failed', Error);
            res.send(JSON.stringify(false));
        }
    }
    catch (error) {
        console.log('Error: ', error);
    }
});
//AI Generate Questions request (qgen = questions generate)
app.post('/api/qgen', async (req, res) => {
    //for MVP only single item, this needs to be checked with AI team about if created files are cleared.
    //We will get Submission ID
    try {
        const sPath = (0, DatabaseUtil_7.getSubmissionFilePathForSubID)(Number(req.query.submission_id));
        //let ai = new AIService("./ServerStorage");
        //Writes questions/answers file to "./ServerStorage" specified in constructor
        //let doc_id = ai.generateQuestions(sPath);
        //Accesses the storage location specified in the contructor
        //let questions = ai.getQuestions(doc_id);
        //postAIOutputForSubmission(parseInt(req.submission_id), questions);
        //verify any questions exist for submission
        const foundAIQs = (0, DatabaseUtil_6.getVivaForSubmission)(JSON.stringify(req.query.email), Number(req.query.submission_id), Number(req.query.result_id));
        if (foundAIQs != null) {
            res.send(JSON.stringify(true));
            console.log('AI question generation successful');
        }
        else {
            res.send(JSON.stringify(false));
            console.log('Error: AI Question Generation Failed', Error);
        }
    }
    catch (error) {
        console.log('Error: ', error);
    }
    //if AI function succeeds return true else return false
});
app.get('/api/vivas', async (req, res) => {
    //for MVP listing vivas
});
app.post('/api/vivas', async (req, res) => {
    //for MVP adding and removing vivas
});
//start the server
app.listen(port, () => {
    console.log('listening at port:', port);
});
