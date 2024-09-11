//https://expressjs.com/en/5x/api.html    

import express from 'express';
import multer from 'multer';
import {Response, Request} from 'express';

import {addStudent, getAllStudents, getUserIDbyEmail, loginUserCheck, signupUser, getUser, signup, getClasses, getAssignments, getSubmissionsForAssignments, deleteStudent, deleteSubmission, deleteAssignment, deleteClass, editStudent, editSubmission, editClass, editAssignment} from "./DatabaseUtil";
import {getQuestions, getVivaForSubmission, getSubmissionFilePathForSubID, createClass, createAssignment, createSubmission, postAIOutputForSubmission, getExams, createExams, deleteExam, editExam} from "./DatabaseUtil";
import {AiFactory} from "comp4050ai";
//import { PDFProcessor, PromptManager } from 'comp4050ai'; 
import * as dotenv from 'dotenv';

const port = 3000;

//express
const app = express();
app.use(express.json());//without this req.body is undefined

//multer middleware
const storageEngine = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null,'./ServerStorage/PDF_Storage')
    },
    filename: (req, file, callBack) => {
        console.log('Received file: ' + JSON.stringify(file))
        callBack(null, JSON.stringify(req.query.submission_filepath).replace(/"/g, ''))//notes for now: we are nulling the errors well fix that later
    }                                                                                   //there is an assumption here that the submission_filepath already has                                                                
})                                                                                      //the .PDF in it if not we gotta add path.extname(file.originalname) and import 'path'
const upload = multer({storage : storageEngine})                                        //-later note looks like it does we good

//placeholders for now
//GET requests
app.get('/', (req: Request, res: Response) => {
    console.log('GET request received');
    res.status(200).send('GET request received').status(200);//this is how to do codes
});

//POST requests
app.post('/', (req: Request, res: Response) => {
    console.log('POST request received');
    res.status(200).send('POST Request received');

    console.log('headers:');
    console.log(req.headers);

    console.log('body: ');
    console.log(req.body);

    console.log('parameters');
    console.log(req.params);

    console.log('ip');
    console.log(req.ip);//will probably be ::1 in localhost

    console.log(req.query);//seems to contain what we want
});

//PUT requests
app.put('/', (req: Request, res: Response) => {
    console.log('PUT request received');
    res.send('PUT Request received');
});


//actual endpoints 
//login/signup
app.get('/api/login', async (req: Request, res: Response) => {
    //for MVP (logging in)
    //we will receive email and password
    try {
        console.log('Received POST to /api/login');
        if (await loginUserCheck(JSON.stringify(req.query.email)) === true) {
            console.log('login with: ' + JSON.stringify(req.query.email) + 'successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: Login Failed', Error)
            res.send(JSON.stringify(false));
        }
    }
    catch (error) {
        console.log('Error: ', error)
    }
});

app.post('/api/signup', async (req: Request, res: Response) => {
    //for MVP (signing up)
    //we will receive email and password
    try {
        console.log('Received POST to /api/signup');
        if (await signupUser(JSON.stringify(req.query.email)) === true) {
            console.log('signup with: ' + req.query.email + ' successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: Sign Up with ' + req.query.email + 'Failed', Error)
            res.send(JSON.stringify(false));
        }
    }
    catch (error) {
        console.log('Error: ', error)
    }
    //if so send success = false
    //if not used success = true
});

//class endpoints
app.get('/api/classes', async (req: Request, res: Response) =>{
    //for MVP (listing classes)
    // get list of classes of the user (how we are doing sessions though)
    try {
        console.log('Received GET to /api/classes');
        const userClasses = await getClasses(JSON.stringify(req.query.email));//get the classes for the user assigned to that email
        if (userClasses != null) {//if something has returned
            console.log('GET classes successful');
            res.send(JSON.stringify(userClasses));//send them
        }
        else{
            console.log('Error: No Classes Found', Error);
            res.send(JSON.stringify({}));
        }
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
        console.log('Received POST to /api/classes');
        const success = await createClass(JSON.stringify(req.query.email), JSON.stringify(req.query.code)); // more fields added post MVP
        if (success) {
            res.send(JSON.stringify(true));
            console.log('Create class successful');
        }
        else{
            console.log('Error: Classes Creation Failed', Error);
            res.send(JSON.stringify(false));
        }
    }
    catch (error) {
        console.log('Error: ', error)
    }    
});

app.delete('/api/classes', async (req: Request, res: Response) =>{
    try{
        console.log('Received DELETE to /api/classes');
        const success = await deleteClass('', Number(req.query.class_id));//email is placeholder for now
        if (success) {
            res.send(JSON.stringify(true));
            console.log('Delete class successful');
        }
        else{
            res.send(JSON.stringify(false));
            console.log('Error: class Deletion Failed', Error);
        }
    }
    catch(error) {
        console.log('Error: ', error);
    }    
});

app.put('/api/classes', async (req: Request, res: Response) =>{
    try{
        console.log('Received PUT to /api/classes');
        const success = await editClass(JSON.stringify(req.query.email), Number(req.query.class_id), Number(req.query.session), Number(req.query.year), JSON.stringify(req.query.code), JSON.stringify(req.query.title));
        if (success) {
            res.send(JSON.stringify(true));
            console.log('Edit class successful');
        }
        else{
            res.send(JSON.stringify(false));
            console.log('Error: class edit Failed', Error)
        }
    }
    catch(error){
        console.log('Error: ', error);
    }
});

//assignment endpoints
app.get('/api/assignments', async (req: Request, res: Response) =>{
    //for MVP (listing classes)
    //list assignments for a specific class
    try {
        console.log('Received GET to /api/assignments');
        const userClassAssignments = await getAssignments(JSON.stringify(req.query.email), Number(req.query.class_id));
        if (userClassAssignments != null) {
            res.send(JSON.stringify(userClassAssignments));
            console.log('GET assignments successful');
        }
        else{
            res.send(JSON.stringify({}));
            console.log('Error: No Assignments Found', Error)
        }
    }
    catch (error) {
        console.log('Error: Assignment Check Failed', error)
    }
});

app.post('/api/assignments', async (req: Request, res: Response) =>{
    //for MVP adding assignments, add removal in later (should be simple)
    //adding assignments to that class
    try {
        console.log('Received POST to /api/assignments');
        const success = await createAssignment(JSON.stringify(req.query.email), Number(req.query.class_id), JSON.stringify(req.query.name), JSON.stringify(req.query.description)); // more fields added post MVP
        if (success) {
            res.send(JSON.stringify(true));
            console.log('Create class successful');
        }
        else{
            res.send(JSON.stringify(false));
            console.log('Error: Assignment Creation Failed', Error)
        }
    }
    catch (error) {
        console.log('Error: ', error)
    }  
});

app.delete('/api/assignments', async (req: Request, res: Response) => {
    try{
        console.log('Received DELETE to /api/assignments');
        const success = await deleteAssignment('', Number(req.query.assignment_id));//email is placeholder for now
        if (success) {
            res.send(JSON.stringify(true));
            console.log('Delete assignment successful')
        }
        else{
            res.send(JSON.stringify(false));
            console.log('Error: assignment Deletion Failed', Error)
        }
    }
    catch(error) {
        console.log('Error: ', error)
    }  
});

app.put('/api/assignments', async (req: Request, res: Response) =>{
    try{
        console.log('Received PUT to /api/assignments');
        const success = await editAssignment(JSON.stringify(req.query.email), Number(req.query.assignment_id), Number(req.query.class_id), JSON.stringify(req.query.name), JSON.stringify(req.query.description));
        if (success) {
            res.send(JSON.stringify(true));
            console.log('Edit assignment successful');
        }
        else{
            res.send(JSON.stringify(false));
            console.log('Error: Assignment edit Failed', Error)
        }
    }
    catch(error){
        console.log('Error: ', error)
    }
});

//submission endpoints
app.get('/api/submissions', async (req: Request, res: Response) =>{
    //for MVP (listing classes)
    //list submissions for a specific assignment
    try {
        console.log('Received GET to /api/submissions');
        const userSubmissions = await getSubmissionsForAssignments(JSON.stringify(req.query.email), Number(req.query.class_id), Number(req.query.assignment_id));
        if (userSubmissions != null) {
            res.send(JSON.stringify(userSubmissions));
            console.log('GET submissions successful');
        }
        else{
            res.send(JSON.stringify({}));
            console.log('Error: No Submissions Found', Error);
        }
    }
    catch (error) {
        console.log('Error: Submission Check Failed', error)
    }
});

app.post('/api/submissions', upload.single('submission_PDF') ,async (req: Request, res: Response) =>{//upload middleware is here
    //for MVP adding submissions
    //adding submissions to an assignment
    try {
        console.log('Received POST to /api/submissions');
        const success = await createSubmission(JSON.stringify(req.query.email), Number(req.query.assignment_id), Number(req.query.student_id), JSON.stringify(req.query.submission_date), JSON.stringify(req.query.submission_filepath));
        if (success) {
            res.send(JSON.stringify(true));
            console.log('Create submission successful')
        }
        else{
            res.send(JSON.stringify(false));
            console.log('Error: submission Creation Failed', Error)
        }
    }
    catch (error) {
        console.log('Error: ', error)
    }  
});

app.delete('/api/submissions', async (req: Request, res: Response) =>{
    try{
        console.log('Received DELETE to /api/submissions');
        const success = await deleteSubmission('', Number(req.query.submission_id));//email is placeholder for now
        if (success) {
            res.send(JSON.stringify(true));
            console.log('Delete submission successful')
        }
        else{
            res.send(JSON.stringify(false));
            console.log('Error: submission Deletion Failed', Error)
        }
    }
    catch(error){
        console.log('Error: ', error)
    }
})

app.put('/api/submissions', async (req: Request, res: Response) =>{
    try{
        console.log('Received PUT to /api/submissions');
        const success = await editSubmission('', Number(req.query.submission_id), Number(req.query.assignment_id), Number(req.query.student_id), JSON.stringify(req.query.submission_date), JSON.stringify(req.query.submission_filepath));
        if(success){
            res.send(JSON.stringify(true));
            console.log('Edit submission successful')
        }
        else{
            res.send(JSON.stringify(false));
            console.log('Error: submission edit Failed', Error)
        }
    }
    catch(error){
        console.log('Error: ', error)
    }
});

//student endpoints
app.get('/api/students', async (req: Request, res: Response) =>{//placeholder for now just dumps all students in database
    try{
        console.log('Received GET to /api/students');
        const studentsList = await getAllStudents();
        if (studentsList != null) {
            res.send(JSON.stringify(studentsList));
            console.log('GET Students successful');
        }
        else{
            res.send(JSON.stringify({}));
            console.log('GET students failed')
        }
    }
    catch(error){
        console.log('Error: ', error)
    }
});

app.post('/api/students', async (req: Request, res: Response) =>{
    try{
        console.log('Received POST to /api/students');
        const success = await addStudent(JSON.stringify(req.query.email), Number(req.query.student_id), JSON.stringify(req.query.first_name), JSON.stringify(req.query.last_name));
        if (success) {
            res.send(JSON.stringify(true));
            console.log('Create student successful')
        }
        else{
            res.send(JSON.stringify(false));
            console.log('Error: student Creation Failed', Error)
        }
    }
    catch(error){
        console.log('Error: ', error)
    }
});

app.delete('/api/students', async (req: Request, res: Response) =>{//for deleting students
    try{
        console.log('Received DELETE to /api/students');
        const success = await deleteStudent(Number(req.query.student_id));
        if (success) {
            res.send(JSON.stringify(true));
            console.log('Delete student successful')
        }
        else{
            res.send(JSON.stringify(false));
            console.log('Error: student Deletion Failed', Error)
        }
    }
    catch(error){
        console.log('Error: ', error)
    }
});

app.put('/api/students', async (req: Request, res: Response) =>{
    try{
        console.log('Received PUT to /api/students');
        const success = await editStudent(JSON.stringify(req.query.email), Number(req.query.student_id), JSON.stringify(req.query.first_name), JSON.stringify(req.query.last_name));
        if (success) {
            res.send(JSON.stringify(true));
            console.log('Edit student successful')
        }
        else{
            res.send(JSON.stringify(false));
            console.log('Error: student edit Failed', Error)
        }
    }
    catch(error){

    }
});

//AI endpoints
//AI Generate Questions request (qgen = questions generate)
app.post('/api/qgen', async (req: Request, res: Response) => {
	//We will get Submission ID
	try {
        // THIS CODE Is Made of a mix of the current version of the AI for Mock Implementation and the unuploader halfbuilt newer version of that library
        // NOTE Commented out code is for future use with post MVP Implementation of AI
        // Load environment variables
        dotenv.config();
        //const apiKey = process.env.OPENAI_API_KEY || '';

        // Setup PDFProcessor and PromptManager 
        /*
        const promptManager = new PromptManager(5, "Question: [Your question]", "Answer: [Your answer]");
        const pdfProcessor = new PDFProcessor(apiKey, promptManager, 'gpt-4o-mini-2024-07-18');

        const result = await pdfProcessor.processPDF(pdfPath, './temp', false)
        */ 
        let pdfPath; //Refers to file name not full path.
        try {            
            pdfPath = await getSubmissionFilePathForSubID(Number(req.query.submission_id));
        }
        catch (error) {
            console.log('Error: Get Submission Path from Sub ID Failed', error)
        }
        
        //Construct Mock AI
        let ai = AiFactory.makeAi('/ServerStorage/PDF_Storage','ServerStorage/qGEN','');

        //Writes questions/answers file to "./ServerStorage" specified in constructor
        let doc_id;
        try {            
            const q_and_a = await ai.generateNQuestionsAndAnswers(pdfPath, 6); //
	        doc_id = await ai.saveQuestionsAndAnswers(q_and_a, "name_of_your_file.json"); //
        }
        catch (error) {
            console.log('Error: AI Generation Failed', error)
        }

        //Accesses the storage location specified in the contructor
        let questions;
        try {            
            questions = await ai.getQuestions(doc_id);
        }
        catch (error) {
            console.log('Error: Assigning questions to location failed', error)
        }        

        //Insert generated AI Questions into results table for submission_id
        postAIOutputForSubmission(Number(req.query.submission_id), questions);
            
        //verify any questions exist for submission
        // TODO This section needs to be improved post MVP, currently only checks if generation worked at least once.
        const foundAIQs = getQuestions(Number(req.query.submission_id)); 
        if (foundAIQs != null){
            res.send(JSON.stringify(true));
            console.log('AI question generation successful');
        }
        else{
            res.send(JSON.stringify(false));
            console.log('Error: AI Question Generation Failed', Error)
        }
	}
	catch (error) {
	    console.log('Error: ', error)
	}	
	//if AI function succeeds return true else return false
});

app.get('/api/vivas', async (req: Request, res: Response) =>{
    //for MVP listing vivas
    //list viva for a specific submission
    try {
        console.log('Received GET to /api/vivas');
        const foundVivas = await getExams(Number(req.query.submission_id));
        if (foundVivas != null) {
            res.send(JSON.stringify(foundVivas));
            console.log('GET vivas successful');
        }
        else{
            res.send(JSON.stringify({}));
            console.log('Error: No Vivas Found', Error)
        }
    }
    catch (error) {
        console.log('Error: Viva Check Failed', error)
    }
});

app.post('/api/vivas', async (req: Request, res: Response) =>{
    //for MVP adding and 
    //adding viva to submission
    try {
        console.log('Received POST to /api/vivas');
        const success = await createExams(JSON.stringify(req.query.email), Number(req.query.submission_id), Number(req.query.student_id)); // more fields added post MVP
        if (success) {
            res.send(JSON.stringify(true));
            console.log('Create Exam successful');
        }
        else{
            res.send(JSON.stringify(false));
            console.log('Error: Exam Creation Failed', Error)
        }
    }
    catch (error) {
        console.log('Error: Exam Creation Attempt Failed', error)
    } 
});

app.delete('/api/vivas', async (req: Request, res: Response) => {
    //for MVP removing vivas
    try{
        console.log('Received DELETE to /api/vivas');
        const success = await deleteExam(JSON.stringify(req.query.email), Number(req.query.exam_id));
        if (success) {
            res.send(JSON.stringify(true));
            console.log('Delete exam successful')
        }
        else{
            res.send(JSON.stringify(false));
            console.log('Error: exam Deletion Failed', Error)
        }
    }
    catch(error) {
        console.log('Error: exam Deletion Attempt Failed', error)
    } 
});

app.put('/api/vivas', async (req: Request, res: Response) =>{
    //for MVP editing vivas
    try{
        console.log('Received PUT to /api/vivas');
        const success = await editExam(JSON.stringify(req.query.email), Number(req.query.exam_id), Number(req.query.submission_id), Number(req.query.student_id), Number(req.query.examiner_id), Number(req.query.marks), JSON.stringify(req.query.comments));
        if (success) {
            res.send(JSON.stringify(true));
            console.log('Edit exam successful');
        }
        else{
            res.send(JSON.stringify(false));
            console.log('Error: exam Edit Failed', Error)
        }
    }
    catch(error){
        console.log('Error: exam Edit Attempt Failed', error)
    }
})

//start the server
app.listen(port, () => {
    console.log('listening at port:', port);
});
