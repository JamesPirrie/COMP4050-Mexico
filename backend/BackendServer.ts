//https://expressjs.com/en/5x/api.html  

//Package Imports
import express, { query } from 'express';
import {Response, Request} from 'express';
import multer from 'multer';
import 'dotenv/config';
import jwt from 'jsonwebtoken';

//AI Imports
import {AiFactory} from "comp4050ai";

//Local Imports
import {addStudent, getAllStudents, getUserIDbyEmail, loginUserCheck, signupUser, getUser, signup, getClasses, getAssignments, getSubmissionsForAssignments, deleteStudent, deleteSubmission, deleteAssignment, deleteClass, editStudent, editSubmission, editClass, editAssignment, getNameOfClass} from "./DatabaseUtil";
import {getQuestions, getVivaForSubmission, getSubmissionFilePathForSubID, createClass, createAssignment, createSubmission, postAIOutputForSubmission, getExams, createExams, deleteExam, editExam, getEmailbyUserID, getStudentsByClass} from "./DatabaseUtil";
import {generateTokenForLogin, verifyJWT} from './AuthenticationUtil';

//Globals
const port = 3000;

//Initialisaion
const app = express();
app.use(express.json());//without this req.body is undefined and works if and only if the content-type header is application/json

//multer middleware
const storageEngine = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null,'./ServerStorage/PDF_Storage');//where the file is saved
    },
    filename: (req, file, callBack) => {
        console.log('Received file: ' + file);
        callBack(null, req.body.submission_filepath.replace(/"/g, '')); //notes for now: we are nulling the errors well fix that later
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

//actual endpoints 
//login/signup
app.post('/api/login',  upload.none(), async (req: Request, res: Response) => {
    //What we receive
    const Email : string = req.body.email;
    const Password : string = req.body.password;
    try {
        console.log('Received POST to /api/login');
        if (await loginUserCheck(Email) === true) {//if the email matches a user in our database NOTE WE NEED TO ADD PASSWORD check here in some form too
            const token: string = generateTokenForLogin(Email);//then generate a token
            console.log('login with: ' + Email + ' successful.');
            res.send({//and send it
                success: true,
                token: token,
                details: "Login Successful"
            });
        }
        else{
            console.log('Error: Login with ' + Email + 'Failed');//otherwise return success: false with no token
            res.json({
                success: false,
                token: "",
                details: "Login Failed: Credentials do not match user in system"
            });
        }
    }
    catch (error) {
        console.log('Error within Login: ' + error);
        res.send({
            success: false,
            token: "",
            details:`Server encountered error: ${error}`//this method of sending back the error object could be a security concern so we should look into this later
        });                                             //but for now it will give them some information about the problem
    }      
});

app.post('/api/signup', upload.none(), async (req: Request, res: Response) => {
    //What we receive
    const Email : string = req.body.email;
    //const Password : string = req.body.password;
    try {
        console.log('Received POST to /api/signup');
        if (await signupUser(Email) === true) {
            console.log('signup with: ' + Email + ' successful');
            res.json({
                success: true,
                details: `Login for ${Email} successful`
            });
        }
        else{//only taken is signupuser returns false which is only is email is taken
            console.log('Error: Sign Up with ' + Email + 'Failed');
            res.json({
                success: false,
                details: `Login for ${Email} failed: email is already taken`
            });
        }
    }
    catch (error) {
        console.log('Error within signup: ' + error);
        res.send({
            success: false,
            details: `Server encountered error: ${error}`
        });
    }
});

//class endpoints
app.get('/api/classes', upload.none(), async (req: Request, res: Response) =>{
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id)
    try {
        console.log('Received GET to /api/classes');        
        if (await verifyJWT(AuthHeader, userID) == true){
            const userClasses = await getClasses(userID);//get the classes for the user assigned to that email
            if(userClasses != undefined){                               //because userClasses.length only works here not != null and because userClasses is optional
                if (userClasses?.length > 1) {                          //typescript or javascript doesnt let me do userClasses?.length alone so theres the != undefined there
                    console.log('GET classes successful' + userClasses);
                    res.json({
                        data: userClasses,
                        details: "Classes successfully found"
                    });//send them
                }
            }
            else{
                console.log('Error: No Classes Found');
                res.json({
                    data: {},
                    details: "No Classes found"
                });
            }
        }            
    }
    catch (error) {
        console.log('Error within GET classes: ', error);
        res.send({
            data: {},
            details: `Server encountered error: ${error}`
        });
    }    
});

// Currently this creates a class with the user as Author, in the future this should be adding User to class Array and another end point should create classes
app.post('/api/classes', upload.none(), async (req: Request, res: Response) =>{
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id)
    const Session : number = Number(req.body.session);
    const Year: number = Number(req.body.year);
    const Title: string = String(req.body.title);
    const Code: string = String(req.body.code);
    try {
        console.log('Received POST to /api/classes');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await createClass(userID, Session, Year, Title, Code);
            if (success) {
                console.log('Create class successful');
                res.send({
                    success: true,
                    details: `Class: ${Code} successfully created`
                });
            }
            else{
                console.log('Error: Classes Creation Failed');
                res.send({
                    success: false,
                    details: `Class creation failed`
                });
            }
        }
    }
    catch (error) {
        console.log('Error within post classes: ' + error);
        res.send({
            success: false,
            details: `Server encountered error: ${error}`
        });
    }    
});

app.delete('/api/classes', upload.none(), async (req: Request, res: Response) =>{
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id)
    const ClassID: number = Number(req.body.class_id)
    try{
        console.log('Received DELETE to /api/classes');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await deleteClass(userID, ClassID);//email is placeholder for now
            if (success) {
                console.log(`Delete class successful`);
                res.json({
                    success: true,
                    details: `Delete class successful`
                });
            }
            else{
                console.log('Error: class Deletion Failed');
                res.json({
                    success: false,
                    details: 'Delete class failed'
                });
            }
        }
    }
    catch(error) {
        console.log('Error within delete classes: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
    }    
});

app.put('/api/classes', upload.none(), async (req: Request, res: Response) =>{
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id)
    const Session : number = Number(req.body.session);
    const Year: number = Number(req.body.year);
    const Title: string = String(req.body.title);
    const Code: string = String(req.body.code);
    const ClassID: number = Number(req.body.class_id)
    try{
        console.log('Received PUT to /api/classes');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await editClass(userID, ClassID, Session, Year, Code, Title);
            if (success) {
                console.log('Edit class successful');
                res.json({
                    success: true,
                    details: `Edit class successful`
                });
            }
            else{
                console.log('Error: class edit Failed');
                res.json({
                    success: false,
                    details: "Edit class failed"
                });
            }
        }
    }
    catch(error){
        console.log('Error within PUT classes: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
    }
});

//assignment endpoints
app.get('/api/assignments', upload.none(), async (req: Request, res: Response) =>{
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id)
    const ClassID: number = Number(req.query.class_id);
    try {
        console.log('Received GET to /api/assignments');
        if (await verifyJWT(AuthHeader, userID) == true){
            const userClassAssignments = await getAssignments(userID, ClassID);
            if (userClassAssignments != undefined) {
                if(userClassAssignments?.length > 1){         
                    console.log('GET assignments successful');
                    res.json({
                        data: userClassAssignments,
                        details: "Assignments successfully found"
                    });
                }
            }
            else{
                console.log('Error: No Assignments Found');
                res.json({
                    data: {},
                    details: "No Assignments found"
                });
            }
        }
    }
    catch (error) {
        console.log('Error within GET assignments: ' + error);
        res.json({
            data: {},
            details: `Server encountered error: ${error}`
        });
    }
});

app.post('/api/assignments', upload.none(), async (req: Request, res: Response) =>{
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id)
    const ClassID: number = Number(req.body.class_id);
    const Name: string = String(req.body.name);
    const Description: string = String(req.body.description);
    try {
        console.log('Received POST to /api/assignments');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await createAssignment(userID, ClassID, Name, Description); // more fields added post MVP
            if (success) {
                console.log('Create Assignment successful');
                res.json({
                    success: true,
                    details: `Assignment ${Name} successfully created`
                });
            }
            else{
                console.log('Error: Assignment Creation Failed');
                res.json({
                    success: false,
                    details: `Assignment Creation Failed`
                });
            }
        }
    }
    catch (error) {
        console.log('Error within POST assignments:' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
    }  
});

app.delete('/api/assignments', upload.none(), async (req: Request, res: Response) => {
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id)
    const AssignmentID: number = Number(req.body.assignment_id);
    try{
        console.log('Received DELETE to /api/assignments');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await deleteAssignment(userID, AssignmentID);//email is placeholder for now
            if (success) {
                console.log('Delete Assignment successful');
                res.json({
                    success: true,
                    details: `Assignment successfully deleted`
                });
            }
            else{
                console.log('Error: Assignment Deletion Failed');
                res.json({
                    success: false,
                    details: `Assignment deletion failed`
                });
            }
        }
    }
    catch(error) {
        console.log('Error within DELETE assignments: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
    }  
});

app.put('/api/assignments', upload.none(), async (req: Request, res: Response) =>{
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id)
    const AssignmentID: number = Number(req.body.assignment_id);
    const ClassID: number = Number(req.body.class_id);
    const Name: string = String(req.body.name);
    const Description: string = String(req.body.description);
    try{
        console.log('Received PUT to /api/assignments');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await editAssignment(userID, AssignmentID, ClassID, Name, Description);
            if (success) {
                console.log('Edit Assignment successful');
                res.json({
                    success: true,
                    details: `Assignment successfully edited`
                });
            }
            else{
                console.log('Error: Assignment edit Failed');
                res.json({
                    success: false,
                    details: `Assignment editing failed`
                });
            }
        }
    }
    catch(error){
        console.log('Error within PUT Assignments: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
    }
});

//submission endpoints
app.get('/api/submissions', upload.none(), async (req: Request, res: Response) =>{//we might need an endpoint for sending the actual file back to them if needed from frontend
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id)
    const ClassID: number = Number(req.query.class_id);
    const AssignmentID: number = Number(req.query.assignment_id);
    try {
        console.log('Received GET to /api/submissions');
        if (await verifyJWT(AuthHeader, userID) == true){
            const userSubmissions = await getSubmissionsForAssignments(userID, ClassID, AssignmentID);//sending this an assignmentID that doesnt exist results incorrect error fix inside
            if (userSubmissions != undefined) {                                                      //query later (proper error handling)
                if(userSubmissions?.length > 1){                
                    console.log('GET submissions successful');
                    res.json({
                        data: userSubmissions,
                        details: "Submissions successfully found"
                    });
                }
            }
            else{
                console.log('Error: No Submissions Found');
                res.json({
                    data: {},
                    details: "No Submissions found"
                });
            }
        }
    }
    catch (error) {
        console.log('Error within GET Submissions: ' + error);
        res.json({
            data: {},
            details: `Server encountered error: ${error}`
        });
    }
});

app.post('/api/submissions', upload.single('submission_PDF') , async (req: Request, res: Response) =>{//upload middleware is here
        //What we receive
        const AuthHeader : string = String(req.headers.authorization);
        const userID: number = Number(req.query.user_id)
        const AssignmentID: number = Number(req.body.assignment_id);
        const StudentID: number = Number(req.body.student_id);
        const SubmissionDate: string = String(req.body.submission_date);        //this isnt being used because we just set it internally anyway
        const SubmissionFilePath: string = String(req.body.submission_filepath);//and this may be a security vulnerability as u can overwrite if the file has the same name
    try {                                                                       //so i will rework this but for the rewrite of all these endpoints they can stay for now
        console.log('Received POST to /api/submissions');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await createSubmission(userID, AssignmentID, StudentID, SubmissionDate, SubmissionFilePath);
            if (success) {
                console.log('Create submission successful');//we need a mechanism to actually know if theres an actual file here
                res.json({
                    success: true,
                    details: "Submission successfully created"
                });
            }
            else{
                console.log('Error: submission Creation Failed');
                res.json({
                    success: false,
                    details: "Submission creation failed"
                });
            }
        }
    }
    catch (error) {
        console.log('Error within POST submissions: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
    }  
});

//TODO NEED TO ADD ACTUAL FILE DELETION INSIDE PDF_STORAGE
app.delete('/api/submissions', upload.none(), async (req: Request, res: Response) =>{
    //what we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id)
    const SubmissionID: number = Number(req.body.submission_id);
    try{
        console.log('Received DELETE to /api/submissions');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await deleteSubmission(userID, SubmissionID);//email is placeholder for now
            if (success){
                console.log('Delete submission successful');
                res.json({
                    success: true,
                    details: "Submission successfully deleted"
                });
            }
            else{
                console.log('Error: submission Deletion Failed');
                res.json({
                    success: false,
                    details: "Submission deletion failed"
                });
            }
        }
    }
    catch(error){
        console.log('Error within DELETE Submissions: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
    }
});

app.put('/api/submissions', upload.single('submission_PDF'), async (req: Request, res: Response) =>{
    //what we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id)
    const SubmissionID: number = Number(req.body.submission_id);
    const AssignmentID: number = Number(req.body.assignment_id)
    const StudentID: number = Number(req.body.student_id);
    const SubmissionDate: string = String(req.body.submission_date);//do we update the submission date here?
    const SubmissionFilePath: string = String(req.body.submission_filepath);//once we fix it lets use the previous filepath 
    try{
        console.log('Received PUT to /api/submissions');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await editSubmission(userID, SubmissionID, AssignmentID, StudentID, SubmissionDate, SubmissionFilePath);
            if(success){
                console.log('Edit submission successful');
                res.json({
                    success: true,
                    details: "Submission successfully edited"
                });
            }
            else{
                console.log('Error: submission edit Failed');
                res.json({
                    success: false,
                    details: "Editing Submission failed"
                });
            }
        }
    }
    catch(error){
        console.log('Error within PUT submissions: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
    }
});

//student endpoints
app.get('/api/students', upload.none(), async (req: Request, res: Response) =>{//placeholder for now just dumps all students in database
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id);
    const classID: number = Number(req.query.class_id);
    try{
        console.log('Received GET to /api/students');
        if (await verifyJWT(AuthHeader, userID) == true){
            const studentsList = await getStudentsByClass(userID, classID);
            if (studentsList != undefined) {
                if(studentsList?.length > 1){
                    console.log('GET Students successful');
                    res.json({
                        data: studentsList,
                        details: "Students successfully found"
                    });
                }
            }
            else{
                console.log('GET students failed');
                res.json({
                    data: {},
                    details: "No Students found"
                });
            }
        }
    }
    catch(error){
        console.log('Error within GET students: ' + error);
        res.json({
            data: {},
            details: `Server encountered error: ${error}`
        });
    }
});

app.post('/api/students', upload.none(), async (req: Request, res: Response) =>{
    try{
        console.log('Received POST to /api/students');
        const success = await addStudent(JSON.stringify(req.body.user_id), Number(req.body.student_id), JSON.stringify(req.body.first_name), JSON.stringify(req.body.last_name));
        if (success) {
            console.log('Create student successful');
            res.json({
                success: true,
                details: "Student successfully created"
            });
        }
        else{
            console.log('Error: student Creation Failed');
            res.json({
                success: false,
                details: "Student creation failed"
            });
        }
    }
    catch(error){
        console.log('Error within POST students: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
    }
});

app.delete('/api/students', upload.none(), async (req: Request, res: Response) =>{//for deleting students
    try{
        console.log('Received DELETE to /api/students');
        const success = await deleteStudent(Number(req.body.student_id));
        if (success) {
            console.log('Delete student successful');
            res.json({
                success: true,
                details: "Student successfully deleted"
            });
        }
        else{
            console.log('Error: student Deletion Failed');
            res.json({
                success: false,
                details: "Student deletion failed"
            });
        }
    }
    catch(error){
        console.log('Error within DELETE students: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
    }
});

app.put('/api/students', upload.none(), async (req: Request, res: Response) =>{
    try{
        console.log('Received PUT to /api/students');
        const success = await editStudent(JSON.stringify(req.body.user_id), Number(req.body.student_id), JSON.stringify(req.body.first_name), JSON.stringify(req.body.last_name));
        if (success) {
            console.log('Edit student successful');
            res.json({
                success: true,
                details: "Student successfully edited"
            });
        }
        else{
            console.log('Error: student edit Failed');
            res.json({
                success: false,
                details: "Student editing failed"
            });
        }
    }
    catch(error){
        console.log('Error within PUT students: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
    }
});

//AI endpoints
app.get('/api/qgen', upload.none(), async (req: Request, res: Response) => {
    try{
        console.log('Received GET to /api/qgen');
        const questions = await getQuestions(Number(req.query.submission_id));
        if(questions != null){
            console.log('GET questions successful');
            res.json(questions);
        }
        else{
            console.log('Error: No questions Found');
            res.json({});
        }
    }
    catch(error){
        console.log('Error: ', error);
        res.send('Server encountered error: ' + error);
    }
});

app.post('/api/qgen', upload.none(), async (req: Request, res: Response) => {
	//We will get Submission ID
	try {
        const apiKey = process.env.OPENAI_API_KEY || '';
        
        if(!apiKey){
            console.log('Error: API_KEY could not be read inside .env')
        }

        let pdfPath; //Refers to file name not full path.
        try {            
            pdfPath = await getSubmissionFilePathForSubID(Number(req.body.submission_id));
        }
        catch (error) {
            console.log('Error: Get Submission Path from Sub ID Failed', error);
        }
        
        //Construct Mock AI
        let ai = AiFactory.makeAi('./ServerStorage/PDF_Storage','./ServerStorage/qGEN', apiKey);

        //Writes questions/answers file to "./ServerStorage" specified in constructor
        let doc_id;
        try {            
            const q_and_a = await ai.generateNQuestionsAndAnswers(pdfPath, 6);//currently generating 6 questions
	        doc_id = await ai.saveQuestionsAndAnswers(q_and_a, pdfPath+".json");
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
        res.send('Server encountered error: ' + error);
	}	
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
        res.send('Server encountered error: ' + error);
    }
});

app.post('/api/vivas', upload.none(), async (req: Request, res: Response) =>{ 
    //adding viva to submission
    try {
        console.log('Received POST to /api/vivas');
        const success = await createExams(Number(req.body.user_id), Number(req.body.submission_id), Number(req.body.student_id)); // more fields added post MVP
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
        res.send('Server encountered error: ' + error);
    } 
});

app.delete('/api/vivas', upload.none(), async (req: Request, res: Response) => {
    try{
        console.log('Received DELETE to /api/vivas');
        const success = await deleteExam(Number(req.body.user_id), Number(req.body.exam_id));
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
        res.send('Server encountered error: ' + error);
    } 
});

app.put('/api/vivas', upload.none(), async (req: Request, res: Response) =>{
    try{
        console.log('Received PUT to /api/vivas');
        const success = await editExam(Number(req.body.user_id), Number(req.body.exam_id), Number(req.body.submission_id), Number(req.body.student_id), Number(req.body.examiner_id), Number(req.query.marks), JSON.stringify(req.query.comments));
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
        res.send('Server encountered error: ' + error);
    }
});

//start the server
app.listen(port, () => {
    console.log('listening at port:', port);
});
