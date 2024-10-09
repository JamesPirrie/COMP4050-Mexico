//https://expressjs.com/en/5x/api.html  

import express from 'express';
import multer from 'multer';
import {Response, Request} from 'express';

import {addStudent, getAllStudents, getUserIDbyEmail, loginUserCheck, signupUser, getUser, signup, getClasses, getAssignments, getSubmissionsForAssignments, deleteStudent, deleteSubmission, deleteAssignment, deleteClass, editStudent, editSubmission, editClass, editAssignment} from "./DatabaseUtil";
import {getQuestions, getVivaForSubmission, getSubmissionFilePathForSubID, createClass, createAssignment, createSubmission, postAIOutputForSubmission, getExams, createExams, deleteExam, editExam} from "./DatabaseUtil";
import {AiFactory} from "comp4050ai";
//import { PDFProcessor, PromptManager } from 'comp4050ai'; 
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
const port = 3000;

// Defining the interface for the JWT payload
interface JwtPayload {
    email: string;
}

//express
const app = express();
app.use(express.json());//without this req.body is undefined and works if and only if the content-type header is application/json

//multer middleware
const storageEngine = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null,'./ServerStorage/PDF_Storage');
    },
    filename: (req, file, callBack) => {
        console.log('Received file: ' + JSON.stringify(file));
        callBack(null, JSON.stringify(req.body.submission_filepath).replace(/"/g, '')); //notes for now: we are nulling the errors well fix that later
    }                                                                                   //there is an assumption here that the submission_filepath already has                                                                
});                                                                                     //the .PDF in it if not we gotta add path.extname(file.originalname) and import 'path'
const upload = multer({storage : storageEngine});                                       //-later note looks like it does we good


//GET requests
app.get('/', (req: Request, res: Response) => {
    console.log('GET request received');
    res.status(200).send('GET request received');//this is how to do codes
});

//POST requests
app.post('/',  upload.none(), (req: Request, res: Response) => {//this upload.any() and the later used upload.single/upload.array can parse request.body in multipart/formdata
    console.log('POST request received');                       //upload.none works for text only (no file submission) 
    res.status(200).send('POST Request received');              //with the way this is now implemented we can parse application/json AND multipart/formdata

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

// JWT Token Verification Authenticaiton
  function verifyJWT(token: string, claimedEmail: string): boolean {
    try {
        // Retrieve the secret key from the environment variables
        const secretKey = process.env.SECRET_KEY;
        if (!secretKey) {
            throw new Error('Missing SECRET_KEY in environment variables');
        }
        // Decode the JWT
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY as string) as JwtPayload;

        // Extracting the email from the decoded token
        const email = decodedToken.email;
        if (!email) {
            throw new Error('Email not found in token');
        }
        // Validating that the email is in the correct format using regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format in token');
        }
        if (email != claimedEmail){
            throw new Error('Token not matched to claimed email');
        }
        return true;
    } catch (error) {
        console.error('Error decoding token or interacting with database:', error);
        return false;
    }
}

//actual endpoints 
//login/signup
app.post('/api/login',  upload.none(), async (req: Request, res: Response) => {
    //we will receive email and password
    try {
        console.log('Received POST to /api/login');
        if (await loginUserCheck(JSON.stringify(req.body.email)) === true) {//if the email matches a user in our database NOTE WE NEED TO ADD PASSWORD check here in some form too
            //for authentication
            //req.cookies.token will be the token that we give them on later requests
            const tokenbody = {email : req.body.email};//contain more later
            
            //create the cookie
            const token = jwt.sign(tokenbody, process.env.SECRET_KEY as string, {expiresIn : "1h"});//ensure that the first parameter is json {} otherwise it says somethings wrong with expiresIn

            //send the cookie with the response NOTE we can make this in the res body if we want
            res.cookie("token",token,{
                httpOnly : true,
                //other properties can go here later
            });

            console.log('login with: ' + JSON.stringify(req.body.email) + ' successful.');
            console.log('Generated Token: '+ token)
            /*alternate non cookie way but we will need to tell frontend that we have changed the response somewhat
            res.send({
                success: true,
                token : token
            });
            */
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: Login with ' + req.body.email + 'Failed');
            res.send(JSON.stringify(false));
        }
    }
    catch (error) {
        console.log(error);
    }
});

app.post('/api/signup', upload.none(), async (req: Request, res: Response) => {
    //we will receive email and password
    try {
        console.log('Received POST to /api/signup');
        if (await signupUser(JSON.stringify(req.body.email)) === true) {
            console.log('signup with: ' + req.body
                .email + ' successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: Sign Up with ' + req.body.email + 'Failed');
            res.send(JSON.stringify(false));
        }
    }
    catch (error) {
        console.log(error);
    }
});

//class endpoints
app.get('/api/classes', upload.none(), async (req: Request, res: Response) =>{
    //for MVP (listing classes)
    // get list of classes of the user (how we are doing sessions though)
    try {
        if(req.headers.authorization){
            let token;
            if (req.headers.authorization.startsWith('Bearer ')){
                token = req.headers.authorization.split(" ")[1];
            } else {
                token = req.headers.authorization;
            }
            if (verifyJWT(token, JSON.stringify(req.query.email)) == true){
                console.log('Received GET to /api/classes');
                const userClasses = await getClasses(JSON.stringify(req.query.email));//get the classes for the user assigned to that email
                if (userClasses != null) {//if something has returned
                    console.log('GET classes successful');
                    res.json(userClasses);//send them
                }
                else{
                    console.log('Error: No Classes Found');
                    res.json({});
                }
            }            
        }
    }
    catch (error) {
        console.log('Error: Classes Check Failed', error);
    }    
});

// Currently this creates a class with the user as Author, in the future this should be adding User to class Array and another end point should create classes
app.post('/api/classes', upload.none(), async (req: Request, res: Response) =>{
    //for MVP adding classes, add removal in later (should be simple)
    //adding classes for that user
    try {
        console.log('Received POST to /api/classes');
        const success = await createClass(JSON.stringify(req.body.email), Number(req.body.session), Number(req.body.year), JSON.stringify(req.body.title) ,JSON.stringify(req.body.code)); // more fields added post MVP
        if (success) {
            console.log('Create class successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: Classes Creation Failed');
            res.send(JSON.stringify(false));
        }
    }
    catch (error) {
        console.log('Error: ', error);
    }    
});

app.delete('/api/classes', upload.none(), async (req: Request, res: Response) =>{
    try{
        console.log('Received DELETE to /api/classes');
        const success = await deleteClass('', Number(req.body.class_id));//email is placeholder for now
        if (success) {
            console.log('Delete class successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: class Deletion Failed');
            res.send(JSON.stringify(false));
        }
    }
    catch(error) {
        console.log('Error: ', error);
    }    
});

app.put('/api/classes', upload.none(), async (req: Request, res: Response) =>{
    try{
        console.log('Received PUT to /api/classes');
        const success = await editClass(JSON.stringify(req.body.email), Number(req.body.class_id), Number(req.body.session), Number(req.body.year), JSON.stringify(req.body.code), JSON.stringify(req.body.title));
        if (success) {
            console.log('Edit class successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: class edit Failed');
            res.send(JSON.stringify(false));
        }
    }
    catch(error){
        console.log('Error: ', error);
    }
});

//assignment endpoints
app.get('/api/assignments', upload.none(), async (req: Request, res: Response) =>{
    //list assignments for a specific class
    try {
        console.log('Received GET to /api/assignments');
        const userClassAssignments = await getAssignments(JSON.stringify(req.query.email), Number(req.query.class_id));
        if (userClassAssignments != null) {
            console.log('GET assignments successful');
            res.json(userClassAssignments);
        }
        else{
            console.log('Error: No Assignments Found');
            res.json({});
        }
    }
    catch (error) {
        console.log('Error: Assignment Check Failed', error);
    }
});

app.post('/api/assignments', upload.none(), async (req: Request, res: Response) =>{
    //adding assignments to that class
    try {
        console.log('Received POST to /api/assignments');
        const success = await createAssignment(JSON.stringify(req.body.email), Number(req.body.class_id), JSON.stringify(req.body.name), JSON.stringify(req.body.description)); // more fields added post MVP
        if (success) {
            console.log('Create class successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: Assignment Creation Failed', Error);
            res.send(JSON.stringify(false));
        }
    }
    catch (error) {
        console.log('Error: ', error);
    }  
});

app.delete('/api/assignments', upload.none(), async (req: Request, res: Response) => {
    try{
        console.log('Received DELETE to /api/assignments');
        const success = await deleteAssignment('', Number(req.body.assignment_id));//email is placeholder for now
        if (success) {
            console.log('Delete assignment successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: assignment Deletion Failed');
            res.send(JSON.stringify(false));
        }
    }
    catch(error) {
        console.log('Error: ', error);
    }  
});

app.put('/api/assignments', upload.none(), async (req: Request, res: Response) =>{
    try{
        console.log('Received PUT to /api/assignments');
        const success = await editAssignment(JSON.stringify(req.body.email), Number(req.body.assignment_id), Number(req.body.class_id), JSON.stringify(req.body.name), JSON.stringify(req.body.description));
        if (success) {
            console.log('Edit assignment successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: Assignment edit Failed');
            res.send(JSON.stringify(false));
        }
    }
    catch(error){
        console.log('Error: ', error)
    }
});

//submission endpoints
app.get('/api/submissions', upload.none(), async (req: Request, res: Response) =>{
    //list submissions for a specific assignment
    try {
        console.log('Received GET to /api/submissions');
        const userSubmissions = await getSubmissionsForAssignments(JSON.stringify(req.query.email), Number(req.query.class_id), Number(req.query.assignment_id));
        if (userSubmissions != null) {
            console.log('GET submissions successful');
            res.json(userSubmissions);
        }
        else{
            console.log('Error: No Submissions Found');
            res.json({});
        }
    }
    catch (error) {
        console.log('Error: Submission Check Failed', error);
    }
});

app.post('/api/submissions', upload.single('submission_PDF') , async (req: Request, res: Response) =>{//upload middleware is here
    //adding submissions to an assignment
    try {
        console.log('Received POST to /api/submissions');
        const success = await createSubmission(JSON.stringify(req.body.email), Number(req.body.assignment_id), Number(req.body.student_id), JSON.stringify(req.body.submission_date), JSON.stringify(req.body.submission_filepath));
        if (success) {
            console.log('Create submission successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: submission Creation Failed');
            res.send(JSON.stringify(false));
        }
    }
    catch (error) {
        console.log('Error: ', error);
    }  
});

//TODO NEED TO ADD ACTUAL FILE DELETION INSIDE PDF_STORAGE
app.delete('/api/submissions', upload.none(), async (req: Request, res: Response) =>{
    try{
        console.log('Received DELETE to /api/submissions');
        const success = await deleteSubmission('', Number(req.body.submission_id));//email is placeholder for now
        if (success) {
            console.log('Delete submission successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: submission Deletion Failed');
            res.send(JSON.stringify(false));
        }
    }
    catch(error){
        console.log('Error: ', error);
    }
});

app.put('/api/submissions', upload.single('submission_PDF'), async (req: Request, res: Response) =>{
    try{
        console.log('Received PUT to /api/submissions');
        const success = await editSubmission('', Number(req.body.submission_id), Number(req.body.assignment_id), Number(req.body.student_id), JSON.stringify(req.body.submission_date), JSON.stringify(req.body.submission_filepath));
        if(success){
            console.log('Edit submission successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: submission edit Failed');
            res.send(JSON.stringify(false));
        }
    }
    catch(error){
        console.log('Error: ', error);
    }
});

//student endpoints
app.get('/api/students', upload.none(), async (req: Request, res: Response) =>{//placeholder for now just dumps all students in database
    try{
        console.log('Received GET to /api/students');
        const studentsList = await getAllStudents();
        if (studentsList != null) {
            console.log('GET Students successful');
            res.json(studentsList);
        }
        else{
            console.log('GET students failed');
            res.json({});
        }
    }
    catch(error){
        console.log('Error: ', error);
    }
});

app.post('/api/students', upload.none(), async (req: Request, res: Response) =>{
    try{
        console.log('Received POST to /api/students');
        const success = await addStudent(JSON.stringify(req.body.email), Number(req.body.student_id), JSON.stringify(req.body.first_name), JSON.stringify(req.body.last_name));
        if (success) {
            console.log('Create student successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: student Creation Failed');
            res.send(JSON.stringify(false));
        }
    }
    catch(error){
        console.log('Error: ', error);
    }
});

app.delete('/api/students', upload.none(), async (req: Request, res: Response) =>{//for deleting students
    try{
        console.log('Received DELETE to /api/students');
        const success = await deleteStudent(Number(req.body.student_id));
        if (success) {
            console.log('Delete student successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: student Deletion Failed');
            res.send(JSON.stringify(false));
        }
    }
    catch(error){
        console.log('Error: ', error);
    }
});

app.put('/api/students', upload.none(), async (req: Request, res: Response) =>{
    try{
        console.log('Received PUT to /api/students');
        const success = await editStudent(JSON.stringify(req.body.email), Number(req.body.student_id), JSON.stringify(req.body.first_name), JSON.stringify(req.body.last_name));
        if (success) {
            console.log('Edit student successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: student edit Failed');
            res.send(JSON.stringify(false));
        }
    }
    catch(error){
        console.log('Error: ', error);
    }
});

//AI endpoints
//AI Generate Questions request (qgen = questions generate)
app.post('/api/qgen', upload.none(), async (req: Request, res: Response) => {
	//We will get Submission ID
	try {
        // THIS CODE Is Made of a mix of the current version of the AI for Mock Implementation and the unuploader halfbuilt newer version of that library
        // NOTE Commented out code is for future use with post MVP Implementation of AI
        //const apiKey = process.env.OPENAI_API_KEY || '';

        // Setup PDFProcessor and PromptManager 
        /*
        const promptManager = new PromptManager(5, "Question: [Your question]", "Answer: [Your answer]");
        const pdfProcessor = new PDFProcessor(apiKey, promptManager, 'gpt-4o-mini-2024-07-18');

        const result = await pdfProcessor.processPDF(pdfPath, './temp', false)
        */ 
        let pdfPath; //Refers to file name not full path.
        try {            
            pdfPath = await getSubmissionFilePathForSubID(Number(req.body.submission_id));
        }
        catch (error) {
            console.log('Error: Get Submission Path from Sub ID Failed', error);
        }
        
        //Construct Mock AI
        let ai = AiFactory.makeAi('./ServerStorage/PDF_Storage','./ServerStorage/qGEN','');

        //Writes questions/answers file to "./ServerStorage" specified in constructor
        let doc_id;
        try {            
            const q_and_a = await ai.generateNQuestionsAndAnswers(pdfPath, 6); //
	        doc_id = await ai.saveQuestionsAndAnswers(q_and_a, pdfPath+".json"); //
        }
        catch (error) {
            console.log('Error: AI Generation Failed', error);
        }

        if(doc_id){
            //Accesses the storage location specified in the contructor
            let questions;
            try {
                questions = await ai.getQuestions(doc_id);
            }
            catch (error) {
                console.log('Error: Assigning questions to location failed', error);
            }
            //Insert generated AI Questions into results table for submission_id
            if (questions){
                postAIOutputForSubmission(Number(req.body.submission_id), JSON.stringify((questions)));
            } else {
                res.send(JSON.stringify(false));
                console.log('Error: Assigning questions to location failed');
            }
        } else {            
            res.send(JSON.stringify(false));
            console.log('Error: AI Generation Failed');
        }        
            
        //verify any questions exist for submission
        // TODO This section needs to be improved post MVP, currently only checks if generation worked at least once.
        const foundAIQs = getQuestions(Number(req.body.submission_id)); 
        if (foundAIQs != null){
            res.send(JSON.stringify(true));
            console.log('AI question generation successful');
        }
        else{
            res.send(JSON.stringify(false));
            console.log('Error: AI Question Generation Failed');
        }
	}
	catch (error) {
	    console.log('Error: ', error);
	}	
	//if AI function succeeds return true else return false
});

//viva endpoints
app.get('/api/vivas', upload.none(), async (req: Request, res: Response) =>{
    //list viva for a specific submission
    try {
        console.log('Received GET to /api/vivas');
        const foundVivas = await getExams(Number(req.query.submission_id));
        if (foundVivas != null) {
            console.log('GET vivas successful');
            res.json(foundVivas);
        }
        else{
            console.log('Error: No Vivas Found');
            res.json({});
        }
    }
    catch (error) {
        console.log('Error: Viva Check Failed', error);
    }
});

app.post('/api/vivas', upload.none(), async (req: Request, res: Response) =>{ 
    //adding viva to submission
    try {
        console.log('Received POST to /api/vivas');
        const success = await createExams(JSON.stringify(req.body.email), Number(req.body.submission_id), Number(req.body.student_id)); // more fields added post MVP
        if (success) {
            console.log('Create Exam successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: Exam Creation Failed');
            res.send(JSON.stringify(false));
        }
    }
    catch (error) {
        console.log('Error: Exam Creation Attempt Failed', error);
    } 
});

app.delete('/api/vivas', upload.none(), async (req: Request, res: Response) => {
    try{
        console.log('Received DELETE to /api/vivas');
        const success = await deleteExam(JSON.stringify(req.body.email), Number(req.body.exam_id));
        if (success) {
            console.log('Delete exam successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: exam Deletion Failed');
            res.send(JSON.stringify(false));
        }
    }
    catch(error) {
        console.log('Error: exam Deletion Attempt Failed', error);
    } 
});

app.put('/api/vivas', upload.none(), async (req: Request, res: Response) =>{
    try{
        console.log('Received PUT to /api/vivas');
        const success = await editExam(JSON.stringify(req.body.email), Number(req.body.exam_id), Number(req.body.submission_id), Number(req.body.student_id), Number(req.body.examiner_id), Number(req.query.marks), JSON.stringify(req.query.comments));
        if (success) {
            console.log('Edit exam successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: exam Edit Failed');
            res.send(JSON.stringify(false));
        }
    }
    catch(error){
        console.log('Error: exam Edit Attempt Failed', error);
    }
});

//start the server
app.listen(port, () => {
    console.log('listening at port:', port);
});
