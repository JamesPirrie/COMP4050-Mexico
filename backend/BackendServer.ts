//https://expressjs.com/en/5x/api.html  

//Package Imports
import express from 'express';
import {Response, Request} from 'express';
import multer from 'multer';
import 'dotenv/config';

//AI Imports
import {AiFactory} from "comp4050ai";

//Local Imports
import {dbUtils} from "./DatabaseUtil";
import {comparePassword, generateTokenForLogin, hashPassword, verifyJWT} from './AuthenticationUtil';

//Globals
const PORT = 3000;
const ROOTDIR = __dirname.slice(0,__dirname.length-5);//get rid of /dist at the end
var TEMPFILENAME: string;//memory to store StorageEngine's generated name

//Initialisaion
const app = express();
app.use(express.json());//without this req.body is undefined and works if and only if the content-type header is application/json

const sqlDB = new dbUtils();

//multer middleware
const storageEngine = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null,'./ServerStorage/PDF_Storage');//where the file is saved
    },
    filename: async (req, file, callBack) => {
        TEMPFILENAME = await sqlDB.getEmailbyUserID(req.body.user_id) + '_' +  Date.now() + '.PDF';//construct a name from the email of the user + unix time
        console.log('Received file: ' + file);
        callBack(null, TEMPFILENAME); //notes for now: we are nulling the errors well fix that later
    }                                                                                                                                                  
});                                                                                     
const upload = multer({storage : storageEngine});                                       


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
    const Email : string = String(req.body.email);
    const Password : string = String(req.body.password);
    try {
        console.log('Received POST to /api/login');
        if (await sqlDB.loginUserCheck(Email) === true && await comparePassword(Password, await sqlDB.getHashedPasswordFromDatabase(Email))) {//if the email and password match a user in our database
                const userID: number = await sqlDB.getUserIDbyEmail(Email);
                const token: string = generateTokenForLogin(Email, userID);//then generate a token
                sqlDB.updateLastLoggedIn(userID);
                console.log('login with: ' + Email + ' successful.');
                res.send({//and send it
                    success: true,
                    token: token,
                    userID: userID,
                    details: "Login Successful"
                });
        }
        else{
            console.log('Error: Login with ' + Email + 'Failed');//otherwise return success: false with no token
            res.json({
                success: false,
                token: "",
                userID: "",
                details: "Login Failed: Credentials do not match user in system"
            });
        }
    }
    catch (error) {
        console.log('Error within Login: ' + error);
        res.send({
            success: false,
            token: "",
            userID: "",
            details:`Server encountered error: ${error}`//this method of sending back the error object could be a security concern so we should look into this later
        });                                             //but for now it will give them some information about the problem
    }      
});

app.post('/api/signup', upload.none(), async (req: Request, res: Response) => {
    //What we receive
    const Email : string = String(req.body.email);
    const Password : string = req.body.password;
    try {
        console.log('Received POST to /api/signup');
        if (await sqlDB.signupUser(Email, await hashPassword(Password)) === true) {//TODO: ADD THE REST OF THE FIELDS
            console.log('signup with: ' + Email + ' successful');
            res.json({
                success: true,
                details: `Login for ${Email} successful`
            });
        }
        else{//only taken when signupuser returns false which is only is email is taken
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
    const userID: number = Number(req.query.user_id);
    try {
        console.log('Received GET to /api/classes');        
        if (await verifyJWT(AuthHeader, userID) == true){
            const userClasses = await sqlDB.getClasses(userID);//get the classes for the user assigned to that email
            if(userClasses != undefined){                               //because userClasses.length only works here not != null and because userClasses is optional
                if (userClasses.length > 0) {                          //typescript or javascript doesnt let me do userClasses?.length alone so theres the != undefined there
                    console.log('GET classes successful' + userClasses);
                    res.json({
                        data: userClasses,
                        details: "Classes successfully found"
                    });//send them
                }
                else{
                    console.log('Error: No Classes Found');
                    res.json({
                        data: {},
                        details: "No Classes found"
                    });
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
    const userID: number = Number(req.body.user_id);
    const Session : number = Number(req.body.session);
    const Year: number = Number(req.body.year);
    const Title: string = String(req.body.title);
    const Code: string = String(req.body.code);
    try {
        console.log('Received POST to /api/classes');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await sqlDB.createClass(userID, Session, Year, Title, Code);
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
    const userID: number = Number(req.body.user_id);
    const ClassID: number = Number(req.body.class_id)
    try{
        console.log('Received DELETE to /api/classes');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await sqlDB.deleteClass(userID, ClassID);//email is placeholder for now
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
    const userID: number = Number(req.body.user_id);
    const Session : number = Number(req.body.session);
    const Year: number = Number(req.body.year);
    const Title: string = String(req.body.title);
    const Code: string = String(req.body.code);
    const ClassID: number = Number(req.body.class_id);
    try{
        console.log('Received PUT to /api/classes');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await sqlDB.editClass(userID, ClassID, Session, Year, Code, Title);
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

app.post('/api/classesStudents', upload.none(), async (req: Request, res: Response) =>{
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.body.user_id);
    const StudentID: number = Number(req.body.student_id);
    const ClassID: number = Number(req.body.class_id);
    try{
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await sqlDB.addStudentToClass(userID, StudentID, ClassID);
            if(success){
                console.log("Add student to class successful");
                res.json({
                    success: true,
                    details: "Add student to class successful"
                });
            }
            else{
                console.log("Add student to class failed");
                res.json({
                    success: false,
                    details: "Could not add student to class"
                });
            }
        }
    }
    catch(error){
        console.log('Error within POST classesStudents: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
    }
});

app.delete('/api/classesStudents', upload.none(), async (req: Request, res: Response) =>{
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.body.user_id);
    const StudentID: number = Number(req.body.student_id);
    const ClassID: number = Number(req.body.class_id);
    try{
        //TODO REMOVE STUDENTS FROM CLASS
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await sqlDB.removeStudentFromClass(userID, StudentID, ClassID);
            if(success){
                console.log("Remove student from class successful");
                res.json({
                    success: true,
                    details: "Remove student from class successful"
                });
            }
            else{
                console.log("Remove student from class failed");
                res.json({
                    success: false,
                    details: "Remove student from class failed"
                });
            }
        }
    }
    catch(error){
        console.log('Error within DELETE classesStudents: ' + error);
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
    const userID: number = Number(req.query.user_id);
    const ClassID: number = Number(req.query.class_id);
    try {
        console.log('Received GET to /api/assignments');
        if (await verifyJWT(AuthHeader, userID) == true){
            const userClassAssignments = await sqlDB.getAssignments(userID, ClassID);
            if (userClassAssignments != undefined) {
                if(userClassAssignments.length > 0){         
                    console.log('GET assignments successful');
                    res.json({
                        data: userClassAssignments,
                        details: "Assignments successfully found"
                    });
                }
                else{
                    res.json({
                        data: {},
                        details: "No Assignments found"
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
    const userID: number = Number(req.body.user_id);
    const ClassID: number = Number(req.body.class_id);
    const Name: string = String(req.body.name);
    const Description: string = String(req.body.description);
    try {
        console.log('Received POST to /api/assignments');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await sqlDB.createAssignment(userID, ClassID, Name, Description); // more fields added post MVP
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
    const userID: number = Number(req.body.user_id);
    const AssignmentID: number = Number(req.body.assignment_id);
    try{
        console.log('Received DELETE to /api/assignments');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await sqlDB.deleteAssignment(userID, AssignmentID);//email is placeholder for now
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
    const userID: number = Number(req.body.user_id);
    const AssignmentID: number = Number(req.body.assignment_id);
    const ClassID: number = Number(req.body.class_id);
    const Name: string = String(req.body.name);
    const Description: string = String(req.body.description);
    try{
        console.log('Received PUT to /api/assignments');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await sqlDB.editAssignment(userID, AssignmentID, ClassID, Name, Description);
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
    const userID: number = Number(req.query.user_id);
    const ClassID: number = Number(req.query.class_id);
    const AssignmentID: number = Number(req.query.assignment_id);
    try {
        console.log('Received GET to /api/submissions');
        if (await verifyJWT(AuthHeader, userID) == true){
            const userSubmissions = await sqlDB.getSubmissionsForAssignments(userID, ClassID, AssignmentID);//sending this an assignmentID that doesnt exist results incorrect error fix inside
            if (userSubmissions != undefined) {                                                      //query later (proper error handling)
                if(userSubmissions.length > 0){                
                    console.log('GET submissions successful');
                    res.json({
                        data: userSubmissions,
                        details: "Submissions successfully found"
                    });
                }
                else{
                    res.json({
                        data: {},
                        details: "No Submissions found"
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

app.get('/api/submissionFile', upload.none(), async (req: Request, res: Response) =>{
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id);
    const SubmissionID: number = Number(req.query.submission_id);
    try{
        console.log('Received GET to /api/submissions');
        if (await verifyJWT(AuthHeader, userID) == true){
            const filePath: string = await sqlDB.getSubmissionFilePathForSubID(SubmissionID);//still need permissions check: is userID permitted to access this submissionID?
            res.sendFile(`${ROOTDIR}/ServerStorage/PDF_Storage/${filePath}`, (error) => {
                if(error){
                    throw error;
                }
                else{
                    console.log('Sent file successfully');
                }
            });
        }
    }
    catch(error){
        console.log('Error within GET SubmissionFile: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
    }
});

app.post('/api/submissions', upload.single('submission_PDF') , async (req: Request, res: Response) =>{//upload middleware is here
        //What we receive
        const AuthHeader : string = String(req.headers.authorization);
        const userID: number = Number(req.body.user_id);
        const AssignmentID: number = Number(req.body.assignment_id);
        const StudentID: number = Number(req.body.student_id);
    try {                                                                       
        console.log('Received POST to /api/submissions');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await sqlDB.createSubmission(userID, AssignmentID, StudentID, TEMPFILENAME);
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
    const userID: number = Number(req.body.user_id);
    const SubmissionID: number = Number(req.body.submission_id);
    try{
        console.log('Received DELETE to /api/submissions');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await sqlDB.deleteSubmission(userID, SubmissionID);//email is placeholder for now
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
    const userID: number = Number(req.body.user_id);
    const SubmissionID: number = Number(req.body.submission_id);// i dont think they should be able to edit these
    const AssignmentID: number = Number(req.body.assignment_id);// i dont think they should be able to edit these
    const StudentID: number = Number(req.body.student_id);
    const SubmissionDate: string = String(req.body.submission_date);//do we update the submission date here? TODO: I think we should give option to edit date but also option to keep same
    try{
        console.log('Received PUT to /api/submissions');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await sqlDB.editSubmission(userID, SubmissionID, AssignmentID, StudentID, SubmissionDate, TEMPFILENAME);
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
            const studentsList = await sqlDB.getStudentsByClass(userID, classID);
            if (studentsList != undefined) {
                if(studentsList.length > 0){
                    console.log('GET Students successful');
                    res.json({
                        data: studentsList,
                        details: "Students successfully found"
                    });
                }
                else{
                    res.json({
                        data: {},
                        details: "No Students found"
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
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.body.user_id);
    const Email: string = String(req.body.email);//this is the student email not the user email
    const StudentID: number = Number(req.body.student_id);
    const FirstName: string = String(req.body.first_name);
    const LastName: string = String(req.body.last_name);
    try{
        console.log('Received POST to /api/students');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await sqlDB.addStudent(Email, StudentID, FirstName, LastName);
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
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.body.user_id);
    const StudentID: number = Number(req.body.student_id);
    try{
        console.log('Received DELETE to /api/students');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await sqlDB.deleteStudent(StudentID);
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
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.body.user_id);
    const Email: string = String(req.query.email);//this is the student email not the user email
    const StudentID: number = Number(req.body.student_id);
    const FirstName: string = String(req.body.first_name);
    const LastName: string = String(req.body.last_name);
    try{
        console.log('Received PUT to /api/students');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await sqlDB.editStudent(Email, StudentID, FirstName, LastName);
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
//AI Question Generation 
app.get('/api/qgen', upload.none(), async (req: Request, res: Response) => {
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id);
    const SubmissionID: number = Number(req.query.submission_id);
    try{
        console.log('Received GET to /api/qgen');
        if (await verifyJWT(AuthHeader, userID) == true){
                const questions = await sqlDB.getQuestions(SubmissionID);
                if (questions != undefined) {
                    if(questions.length > 0){
                        console.log('GET questions successful');
                        res.json({
                            data: questions,
                            details: "Questions successfully found"
                        });
                    }
                    else{
                        res.json({
                            data: {},
                            details: "no Questions found"
                        });
                    }
                }
                else{
                    console.log('Error: No questions Found');
                    res.json({
                        data: {},
                        details: "no Questions found"
                    });
                }
            }
        }
    catch(error){
        console.log('Error within GET qgen: ', error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
    }
});

app.post('/api/qgen', upload.none(), async (req: Request, res: Response) => {
    //What we receive
    const AuthHeader: string = String(req.headers.authorization);
    const userID: number = Number(req.body.user_id);
    const SubmissionID: number = Number(req.body.submission_id);
    try {
        if (await verifyJWT(AuthHeader, userID) == true) {
            const apiKey = process.env.OPENAI_API_KEY || '';

            if (!apiKey) {
                console.log('Error: API_KEY could not be read inside .env')
            }

            let pdfPath; //Refers to file name not full path.
            try {
                pdfPath = await sqlDB.getSubmissionFilePathForSubID(SubmissionID);
            }
            catch (error) {
                console.log('Error: Get Submission Path from Sub ID Failed', error);
            }

            //Construct AI
            let ai = AiFactory.makeAi('./ServerStorage/PDF_Storage', './ServerStorage/qGEN', apiKey);

            //Writes questions/answers file to "./ServerStorage" specified in constructor
            let doc_id;
            try {
                const q_and_a = await ai.generateNQuestionsAndAnswers(pdfPath, 6);//currently generating 6 questions
                doc_id = await ai.saveQuestionsAndAnswers(q_and_a, pdfPath + ".json");
            }
            catch (error) {
                console.log('Error: AI Generation Failed', error);
            }

            if (doc_id) {
                //Accesses the storage location specified in the contructor
                let questions;
                try {
                    questions = await ai.getQuestions(doc_id);
                }
                catch (error) {
                    console.log('Error: Assigning questions to location failed', error);
                }
                //Insert generated AI Questions into results table for submission_id
                if (questions) {
                    sqlDB.postAIOutputForSubmission(SubmissionID, JSON.stringify((questions)));
                } else {
                    console.log('Error within POST qgen: Assigning questions to location failed');
                    res.json({
                        success: false,
                        details: "Could not assign questions to internal storage location"
                    });
                }
            } else {
                console.log('Error within POST qgen: AI Generation Failed');
                res.json({
                    success: false,
                    details: "AI generation failed"
                });
            }

            //verify any questions exist for submission
            // TODO This section needs to be improved post MVP, currently only checks if generation worked at least once.
            const foundAIQs = sqlDB.getQuestions(SubmissionID);
            if (foundAIQs != null) {
                console.log('AI question generation successful');
                res.json({
                    success: true,
                    details: "Questions successfully generated"
                });
            }
            else {
                console.log('Error: AI Question Generation Failed');
                res.json({
                    success: false,
                    details: "failed to generate questions"
                });
            }
        }
    }
	catch (error) {
	    console.log('Error within POST qgen: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
	}	
});
/*
//AI Rubric Generate and Return
app.get('/api/rubricgen', upload.none(), async (req: Request, res: Response) => {
    //What we receive
    const AuthHeader: string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id);
    const SubmissionID: number = Number(req.query.submission_id);
    const ProjectOverview: string = String(req.query.project_overview);
    const Criteria: string[] = req.query.criteria;
    const Topics: string[] = req.query.topics;
    const Goals: string[] = req.query.goals;
    try {
        if (await verifyJWT(AuthHeader, userID) == true) {
            const apiKey = process.env.OPENAI_API_KEY || '';

            if (!apiKey) {
                console.log('Error: API_KEY could not be read inside .env')
            }

            let pdfPath; //Refers to file name not full path.
            pdfPath = String(req.headers.ProjectOverview);

            //Construct AI
            let ai = AiFactory.makeAi('./ServerStorage/PDF_Storage', './ServerStorage/qGEN', apiKey);

            //Writes questions/answers file to "./ServerStorage" specified in constructor
            let doc_id;
            let rubric;
            try {
                rubric = await ai.createRubric(ProjectOverview,Criteria,Topics,Goals);
            }
            catch (error) {
                console.log('Error: AI Rubric Generation Failed', error);
            }
            if (rubric != undefined) {
                if(rubric.length > 0){
                    console.log('GET Rubric successful');
                    res.json({
                        data: rubric,
                        details: "Rubric generation/get successfully"
                    });
                }
                else{
                    res.json({
                        data: {},
                        details: "Generated Rubric not found"
                    });
                }
            }
            else{
                console.log('Error: Generated Rubric not Found');
                res.json({
                    data: {},
                    details: "Generated Rubric not found"
                });
            }
        }
    }
	catch (error) {
	    console.log('Error within POST qgen: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
	}	
});

//AI Summary Generate and Return
app.get('/api/summarygen', upload.none(), async (req: Request, res: Response) => {
    //What we receive
    const AuthHeader: string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id);
    const SubmissionID: number = Number(req.query.submission_id);
    try {
        if (await verifyJWT(AuthHeader, userID) == true) {
            const apiKey = process.env.OPENAI_API_KEY || '';

            if (!apiKey) {
                console.log('Error: API_KEY could not be read inside .env')
            }

            let pdfPath; //Refers to file name not full path.
            try {
                pdfPath = await sqlDB.getSubmissionFilePathForSubID(SubmissionID);
            }
            catch (error) {
                console.log('Error: Get Submission Path from Sub ID Failed', error);
            }

            //Construct AI
            let ai = AiFactory.makeAi('./ServerStorage/PDF_Storage', './ServerStorage/qGEN', apiKey);

            //Writes summary file to Promise<string>
            let summary;
            try {
                let summary = await ai.summarizeSubmission(pdfPath)
            }
            catch (error) {
                console.log('Error: AI Generation Failed', error);
            }

            if (summary != undefined) {
                console.log('GET Summary successful');
                    res.json({
                        data: summary,
                        details: "Summary generation/get successfully"
                });
            }
            else{
                console.log('Error: Generated Summary not Found');
                res.json({
                    data: {},
                    details: "Generated Summary not found"
                });
            }
        }
    }
	catch (error) {
	    console.log('Error within POST qgen: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
	}	
});

// TODO Clarify with AI team about the nature of "Rubric" input
//AI Feedback Generate and Return
app.get('/api/feedbackgen', upload.none(), async (req: Request, res: Response) => {
    //What we receive
    const AuthHeader: string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id);
    const SubmissionID: number = Number(req.query.submission_id);
    const Rubric: string = String(req.query.rubric);
    try {
        if (await verifyJWT(AuthHeader, userID) == true) {
            const apiKey = process.env.OPENAI_API_KEY || '';

            if (!apiKey) {
                console.log('Error: API_KEY could not be read inside .env')
            }

            let pdfPath; //Refers to file name not full path.
            try {
                pdfPath = await sqlDB.getSubmissionFilePathForSubID(SubmissionID);
            }
            catch (error) {
                console.log('Error: Get Submission Path from Sub ID Failed', error);
            }

            //Construct AI
            let ai = AiFactory.makeAi('./ServerStorage/PDF_Storage', './ServerStorage/qGEN', apiKey);

            //Writes feedback file to Promise<string>
            let feedback;
            try {
                let feedback = await ai.generateFeedback("sample.pdf", Rubric);
            }
            catch (error) {
                console.log('Error: AI Generation Failed', error);
            }

            if (feedback != undefined) {
                console.log('GET Feedback successful');
                    res.json({
                        data: feedback,
                        details: "Feedback generation/get successfully"
                });
            }
            else{
                console.log('Error: Generated Feedback not Found');
                res.json({
                    data: {},
                    details: "Generated Feedback not found"
                });
            }
        }
    }
	catch (error) {
	    console.log('Error within POST qgen: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
	}	
});
*/
//viva endpoints
app.get('/api/vivas', upload.none(), async (req: Request, res: Response) =>{//list viva for a specific submission
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.query.user_id);
    const SubmissionID: number = Number(req.query.submission_id);
    try {
        console.log('Received GET to /api/vivas');
        if (await verifyJWT(AuthHeader, userID) == true){
            const foundVivas = await sqlDB.getExams(SubmissionID);
            if (foundVivas != undefined) {
                if(foundVivas.length > 0){
                    console.log('GET vivas successful');
                    res.json({
                        data: foundVivas,
                        details: "Vivas successfully found"
                    });
                }
                else{
                    res.json({
                        data: {},
                        details: "Failed to find Vivas"
                    }); 
                }
            }
            else{
                console.log('Error: No Vivas Found');
                res.json({
                    data: {},
                    details: "Failed to find Vivas"
                });
            }
        }
    }
    catch (error) {
        console.log('Error within GET vivas: ' + error);
        res.json({
            data: {},
            details: `Server encountered error: ${error}`
        });
    }
});

app.post('/api/vivas', upload.none(), async (req: Request, res: Response) =>{ //adding viva to submission
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.body.user_id);
    const SubmissionID: number = Number(req.body.submission_id);
    const StudentID: number = Number(req.body.student_id);
    try {
        console.log('Received POST to /api/vivas');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await sqlDB.createExams(userID, SubmissionID, StudentID); // more fields added post MVP
            if (success) {
                console.log('Create Exam successful');
                res.json({
                    success: true,
                    details: "Viva successfully generated"
                });
            }
            else{
                console.log('Error: Exam Creation Failed');
                res.json({
                    success: false,
                    details: "failed to create Viva"
                });
            }
        }
    }
    catch (error) {
        console.log('Error within POST vivas: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
    } 
});

app.delete('/api/vivas', upload.none(), async (req: Request, res: Response) => {
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.body.user_id);
    const ExamID: number = Number(req.body.exam_id);
    try{
        console.log('Received DELETE to /api/vivas');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await sqlDB.deleteExam(userID, ExamID);
            if (success) {
                console.log('Delete exam successful');
                res.json({
                    success: true,
                    details: "Viva successfully deleted"
                });
            }
            else{
                console.log('Error: exam Deletion Failed');
                res.json({
                    success: false,
                    details: "failed to delete Viva"
                });
            }
        }
    }
    catch(error) {
        console.log('Error within DELETE vivas: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
    } 
});

app.put('/api/vivas', upload.none(), async (req: Request, res: Response) =>{
    //What we receive
    const AuthHeader : string = String(req.headers.authorization);
    const userID: number = Number(req.body.user_id);
    const ExamID: number = Number(req.body.exam_id);
    const SubmissionID: number = Number(req.body.submission_id);
    const StudentID: number = Number(req.body.student_id);
    const ExaminerID: number = Number(req.body.examiner_id);
    const Marks: number = Number(req.body.marks);
    const Comments: string = String(req.body.comments);
    try{
        console.log('Received PUT to /api/vivas');
        if (await verifyJWT(AuthHeader, userID) == true){
            const success = await sqlDB.editExam(userID, ExamID, SubmissionID, StudentID, ExaminerID, Marks, Comments);
            if (success) {
                console.log('Edit exam successful');
                res.json({
                    success: true,
                    details: "Viva successfully edited"
                });
            }
            else{
                console.log('Error: exam Edit Failed');
                res.json({
                    success: false,
                    details: "failed to edit Viva"
                });
            }
        }
    }
    catch(error){
        console.log('Error within PUT vivas: ' + error);
        res.json({
            success: false,
            details: `Server encountered error: ${error}`
        });
    }
});

//start the server
app.listen(PORT, () => {
    console.log('listening at port:', PORT);
});