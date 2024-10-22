//https://expressjs.com/en/5x/api.html  

import express from 'express';
import multer from 'multer';
import {Response, Request} from 'express';

import {addStudent, getAllStudents, getUserIDbyEmail, loginUserCheck, signupUser, getUser, signup, getClasses, getAssignments, getSubmissionsForAssignments, deleteStudent, deleteSubmission, deleteAssignment, deleteClass, editStudent, editSubmission, editClass, editAssignment} from "./DatabaseUtil";
import {getQuestions, getVivaForSubmission, getSubmissionFilePathForSubID, createClass, createAssignment, createSubmission, postAIOutputForSubmission, getExams, createExams, deleteExam, editExam} from "./DatabaseUtil";
import {AiFactory} from "comp4050ai";
//import { PDFProcessor, PromptManager } from 'comp4050ai'; 
import * as dotenv from 'dotenv';
dotenv.config();
console.log("Environment variables loaded:");
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY);
import jwt from 'jsonwebtoken';

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
        callBack(null,'./ServerStorage/PDF_Storage')
    },
    filename: (req, file, callBack) => {
        console.log('Received file: ' + JSON.stringify(file))
        callBack(null, JSON.stringify(req.body.submission_filepath).replace(/"/g, '')) //notes for now: we are nulling the errors well fix that later
    }                                                                                   //there is an assumption here that the submission_filepath already has                                                                
})                                                                                      //the .PDF in it if not we gotta add path.extname(file.originalname) and import 'path'
const upload = multer({storage : storageEngine})                                        //-later note looks like it does we good


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
            return false;
        }
        // Decode the JWT
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY as string) as JwtPayload;

        // Extracting the email from the decoded token
        const email = decodedToken.email;
        if (!email) {
            throw new Error('Email not found in token');
            return false;
        }
        // Validating that the email is in the correct format using regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format in token');
            return false;
        }
        if (email != claimedEmail){
            throw new Error('Token not matched to claimed email');
            return false;
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
        if (await loginUserCheck(JSON.stringify(req.body.email)) === true) {
            console.log('login with: ' + JSON.stringify(req.body.email) + ' successful');
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

app.post('/api/signup', upload.none(), async (req: Request, res: Response) => {
    //we will receive email and password
    try {
        console.log('Received POST to /api/signup');
        if (await signupUser(JSON.stringify(req.body.email)) === true) {
            console.log('signup with: ' + req.body.email + ' successful');
            res.send(JSON.stringify(true));
        }
        else{
            console.log('Error: Sign Up with ' + req.body.email + 'Failed', Error)
            res.send(JSON.stringify(false));
        }
    }
    catch (error) {
        console.log('Error: ', error)
    }
});

//class endpoints
app.get('/api/classes', upload.none(), async (req: Request, res: Response) =>{
    //for MVP (listing classes)
    // get list of classes of the user (how we are doing sessions though)
    try {
/*        if(req.headers.authorization){
            let token;
            if (req.headers.authorization.startsWith('Bearer ')){
                token = req.headers.authorization.split(" ")[1]
            } else {
                token = req.headers.authorization;
            }
            if (verifyJWT(token, JSON.stringify(req.query.email)) == true){*/
                console.log('Received GET to /api/classes');
                const userClasses = await getClasses(JSON.stringify(req.query.email));//get the classes for the user assigned to that email
                if (userClasses != null) {//if something has returned
                    console.log('GET classes successful');
                    res.json(userClasses);//send them
                }
                else{
                    console.log('Error: No Classes Found', Error);
                    res.json({});
                }
            /*}            
        }*/
    }
    catch (error) {
        console.log('Error: Classes Check Failed', error)
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
            res.send(JSON.stringify(true));
            console.log('Create class successful');
        }
        else{
            res.send(JSON.stringify(false));
            console.log('Error: Classes Creation Failed', Error);
        }
    }
    catch (error) {
        console.log('Error: ', error)
    }    
});

app.delete('/api/classes', upload.none(), async (req: Request, res: Response) =>{
    try{
        console.log('Received DELETE to /api/classes');
        const success = await deleteClass('', Number(req.body.class_id));//email is placeholder for now
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

app.put('/api/classes', upload.none(), async (req: Request, res: Response) =>{
    try{
        console.log('Received PUT to /api/classes');
        const success = await editClass(JSON.stringify(req.body.email), Number(req.body.class_id), Number(req.body.session), Number(req.body.year), JSON.stringify(req.body.code), JSON.stringify(req.body.title));
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
app.get('/api/assignments', upload.none(), async (req: Request, res: Response) =>{
    //list assignments for a specific class
    try {
        console.log('Received GET to /api/assignments');
        const userClassAssignments = await getAssignments(JSON.stringify(req.query.email), Number(req.query.class_id));
        if (userClassAssignments != null) {
            res.json(userClassAssignments);
            console.log('GET assignments successful');
        }
        else{
            res.json({});
            console.log('Error: No Assignments Found', Error)
        }
    }
    catch (error) {
        console.log('Error: Assignment Check Failed', error)
    }
});

app.post('/api/assignments', upload.none(), async (req: Request, res: Response) =>{
    //adding assignments to that class
    try {
        console.log('Received POST to /api/assignments');
        const success = await createAssignment(JSON.stringify(req.body.email), Number(req.body.class_id), JSON.stringify(req.body.name), JSON.stringify(req.body.description)); // more fields added post MVP
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

app.delete('/api/assignments', upload.none(), async (req: Request, res: Response) => {
    try{
        console.log('Received DELETE to /api/assignments');
        const success = await deleteAssignment('', Number(req.body.assignment_id));//email is placeholder for now
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

app.put('/api/assignments', upload.none(), async (req: Request, res: Response) =>{
    try{
        console.log('Received PUT to /api/assignments');
        const success = await editAssignment(JSON.stringify(req.body.email), Number(req.body.assignment_id), Number(req.body.class_id), JSON.stringify(req.body.name), JSON.stringify(req.body.description));
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
app.get('/api/submissions', upload.none(), async (req: Request, res: Response) =>{
    //list submissions for a specific assignment
    try {
        console.log('Received GET to /api/submissions');
        const userSubmissions = await getSubmissionsForAssignments(JSON.stringify(req.query.email), Number(req.query.class_id), Number(req.query.assignment_id));
        if (userSubmissions != null) {
            res.json(userSubmissions);
            console.log('GET submissions successful');
        }
        else{
            res.json({});
            console.log('Error: No Submissions Found', Error);
        }
    }
    catch (error) {
        console.log('Error: Submission Check Failed', error)
    }
});

app.post('/api/submissions', upload.single('submission_PDF') , async (req: Request, res: Response) =>{//upload middleware is here
    //adding submissions to an assignment
    try {
        console.log('Received POST to /api/submissions');
        const success = await createSubmission(JSON.stringify(req.body.email), Number(req.body.assignment_id), Number(req.body.student_id), JSON.stringify(req.body.submission_date), JSON.stringify(req.body.submission_filepath));
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

//TODO NEED TO ADD ACTUAL FILE DELETION INSIDE PDF_STORAGE
app.delete('/api/submissions', upload.none(), async (req: Request, res: Response) =>{
    try{
        console.log('Received DELETE to /api/submissions');
        const success = await deleteSubmission('', Number(req.body.submission_id));//email is placeholder for now
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

app.put('/api/submissions', upload.single('submission_PDF'), async (req: Request, res: Response) =>{
    try{
        console.log('Received PUT to /api/submissions');
        const success = await editSubmission('', Number(req.body.submission_id), Number(req.body.assignment_id), Number(req.body.student_id), JSON.stringify(req.body.submission_date), JSON.stringify(req.body.submission_filepath));
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
app.get('/api/students', upload.none(), async (req: Request, res: Response) =>{//placeholder for now just dumps all students in database
    try{
        console.log('Received GET to /api/students');
        const studentsList = await getAllStudents();
        if (studentsList != null) {
            res.json(studentsList);
            console.log('GET Students successful');
        }
        else{
            res.json({});
            console.log('GET students failed')
        }
    }
    catch(error){
        console.log('Error: ', error)
    }
});

app.post('/api/students', upload.none(), async (req: Request, res: Response) =>{
    try{
        console.log('Received POST to /api/students');
        const success = await addStudent(JSON.stringify(req.body.email), Number(req.body.student_id), JSON.stringify(req.body.first_name), JSON.stringify(req.body.last_name));
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

app.delete('/api/students', upload.none(), async (req: Request, res: Response) =>{//for deleting students
    try{
        console.log('Received DELETE to /api/students');
        const success = await deleteStudent(Number(req.body.student_id));
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

app.put('/api/students', upload.none(), async (req: Request, res: Response) =>{
    try{
        console.log('Received PUT to /api/students');
        const success = await editStudent(JSON.stringify(req.body.email), Number(req.body.student_id), JSON.stringify(req.body.first_name), JSON.stringify(req.body.last_name));
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
app.get('/api/qgen', upload.none(), async (req: Request, res: Response) => {
    try {
        console.log('Received GET to /api/qgen');
        const submission_id = req.query.submission_id;
        console.log('Submission ID:', submission_id);
        
        const questions = await getQuestions(Number(submission_id));
        res.json(questions || []);
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).json({ error: String(error) });
    }
});

// Existing POST endpoint with mock data when IS_MOCK=YES
app.post('/api/qgen', upload.none(), async (req: Request, res: Response) => {
    try {
        console.log('Received POST to /api/qgen');
        console.log('Request body:', req.body);

        // Check if API key exists
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('OpenAI API key not found');
            res.status(500).json({ error: 'OpenAI API key not configured' });
            return;
        }

        const submission_id = parseInt(req.body.submission_id);
        console.log('Processing submission_id:', submission_id);

        if (isNaN(submission_id)) {
            console.error('Invalid submission_id received');
            res.status(400).json({ error: 'Invalid submission ID' });
            return;
        }

        // Get the PDF path
        let pdfPath;
        try {            
            pdfPath = await getSubmissionFilePathForSubID(submission_id);
            console.log('PDF Path:', pdfPath);
            
            if (!pdfPath) {
                res.status(404).json({ error: 'PDF not found' });
                return;
            }
        } catch (error) {
            console.error('Error getting PDF path:', error);
            res.status(500).json({ error: 'Failed to get PDF path' });
            return;
        }

        // Create AI instance with verified API key
        let ai = AiFactory.makeAi(
            './ServerStorage/PDF_Storage',
            './ServerStorage/qGEN',
            apiKey  // Now TypeScript knows this is definitely a string
        );

        try {            
            console.log('Generating questions for PDF:', pdfPath);
            const q_and_a = await ai.generateNQuestionsAndAnswers(pdfPath, 6);
            console.log('Generated questions:', q_and_a);
            
            // Save questions
            await postAIOutputForSubmission(submission_id, JSON.stringify(q_and_a));
            
            // Return success
            res.json({ success: true, questions: q_and_a });
        } catch (error) {
            console.error('Error generating questions:', error);
            res.status(500).json({ error: 'Failed to generate questions' });
        }
    } catch (error) {
        console.error('Error in qgen endpoint:', error);
        res.status(500).json({ error: String(error) });
    }
});

// Add GET endpoint for retrieving questions
app.get('/api/qgen', upload.none(), async (req: Request, res: Response) => {
    try {
        console.log('Received GET to /api/qgen');
        const submission_id = Number(req.query.submission_id);
        
        if (isNaN(submission_id)) {
            res.status(400).json({ error: 'Invalid submission ID' });
            return;
        }

        const questions = await getQuestions(submission_id);
        res.json(questions || []);
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).json({ error: String(error) });
    }
});

app.get('/api/vivas', upload.none(), async (req: Request, res: Response) =>{
    //list viva for a specific submission
    try {
        console.log('Received GET to /api/vivas');
        const foundVivas = await getExams(Number(req.query.submission_id));
        if (foundVivas != null) {
            res.json(foundVivas);
            console.log('GET vivas successful');
        }
        else{
            res.json({});
            console.log('Error: No Vivas Found', Error)
        }
    }
    catch (error) {
        console.log('Error: Viva Check Failed', error)
    }
});

app.post('/api/vivas', upload.none(), async (req: Request, res: Response) =>{ 
    //adding viva to submission
    try {
        console.log('Received POST to /api/vivas');
        const success = await createExams(JSON.stringify(req.body.email), Number(req.body.submission_id), Number(req.body.student_id)); // more fields added post MVP
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

app.delete('/api/vivas', upload.none(), async (req: Request, res: Response) => {
    try{
        console.log('Received DELETE to /api/vivas');
        const success = await deleteExam(JSON.stringify(req.body.email), Number(req.body.exam_id));
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

app.put('/api/vivas', upload.none(), async (req: Request, res: Response) =>{
    try{
        console.log('Received PUT to /api/vivas');
        const success = await editExam(JSON.stringify(req.body.email), Number(req.body.exam_id), Number(req.body.submission_id), Number(req.body.student_id), Number(req.body.examiner_id), Number(req.query.marks), JSON.stringify(req.query.comments));
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
