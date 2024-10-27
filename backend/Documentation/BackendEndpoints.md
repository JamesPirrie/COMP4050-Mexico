# Backend Endpoints Documentation 
This file contains all details relating to the expected inputs and outputs related to the backend servers endpoints.
`This is the Post-MVP version of this file.`
# Request Headers
The backend server will read requests with `content-type: application/json` or `content-type: multipart/formdata` in their headers.
However POST and PUT submissions which require a submission_PDF file can only used correctly in multipart/formdata.

# Response Headers
Most Responses are sent back using `content-type: application/json`.
The exception to this is the /api/submissionFile endpoint which will send back a file with `content-type: application/pdf`.

# Endpoints
# A Quick note
Many endpoints are the same however:
- Endpoints that used to simply return true or false now return a json containing `success: true` or `success: false`
- Endpoints that used to return data such as GET endpoints now return `data : { data goes here }`
- All endpoints now additionally return a `details: this contains what happened` item in their json responses also containing error messages'
- The Server will read `all GET request elements from the querys`.
- The Server will read `all other requests from the body`. 
- All endpoints except signup and login require an authentication `bearer token` inside the Authentication header, and a `user_id` field. This token: string will be provided upon log in along with the user_id.
- All dates are sent and expected to be received in ISO-8601 format eg. (2024-9-24T08:18:20.437Z)

# Account endpoints 

`POST  /api/login - Logging in a user`
- Token in Authentication Header: None
- Input parameters: email: string, password: string.

- Output parameters : {
    success: boolean, 
    token: string, 
    userID: number, 
    details: string
}
- Description: Used for logging in a user

`POST  /api/signup - Signing up a user`
- Token in Authentication Header: None
- Input parameters: email: string, password: string, user_name:string, first_name: string, last_name: string

- Output parameters : { 
    success: boolean, 
    details: string
}
- Description: Used for signing up a user

# Class endpoints
`GET  /api/classes - Getting classes from the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number
- Output parameters : {
    data: [
       {
        class_id : number,
        session : number,
        year : number,
        code : string,
        title : string,
        creation_date : string,
        expiry_date: string,
        tutors: number[],
        students: number[]
       },
       ...
    ],
    details: string
}
- Description: Returns all classes for that user

`POST  /api/classes - Adding classes to the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, session: number, year: number, title: string, code: string
- Output parameters : {
    success: boolean,
    details: string
}
- Description: Adds a class for that user

`PUT  /api/classes - Editing classes in the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, session: number, year: number, title: string, code: string, class_id: number
- Output parameters : {
    success: boolean,
    details: string
}
- Description: Edits an existing class for that user

`DELETE  /api/classes - Deleting classes from the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, class_id: number
- Output parameters : {
    success: boolean,
    details: string
}
- Description: Deletes a class corresponding to class_id

`POST  /api/classesStudents - Adding students to the class`
- Token in Authentication Header: Required
- Input parameters: user_id: number, class_id: number, student_id: number
- Output parameters : {
    success: boolean,
    details: string
}
- Adds a student to a class

`DELETE  /api/classesStudents - Deleting students from a class`
- Token in Authentication Header: Required
- Input parameters: user_id: number, class_id: number, student_id: number
- Output parameters : {
    success: boolean,
    details: string
}
- Removes a student from a class

# Student endpoints
`GET  /api/allStudents - Getting all students from the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number
- Output parameters : {
    data : [
        {
            student_id: number,
            first_name: string,
            last_name: string,
            email: string,
            classes: number[]
        },
        ...
    ],
    details: string
}
- Description: Get all students in the database

`GET  /api/students - Getting students of a class from the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, class_id: number
- Output parameters : {
    data : [
        {
            student_id: number,
            first_name: string,
            last_name: string,
            email: string,
            classes: number[]
        },
        ...
    ],
    details: string
}
- Description: Gets a list of all students in the class provided

`POST  /api/students - Adding students to the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, student_id: number, first_name: string, last_name: string, email: string
- Output parameters : {
    success: boolean,
    details: string
}
- Description: Creates a new student in database

`PUT  /api/students - Editing students in the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, student_id: number, first_name: string, last_name: string, email: string
- Output parameters : {
    success: boolean,
    details: string
}
- Description: Edits student in database

`DELETE  /api/students - Deleting students from the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, student_id: number
- Output parameters : {
    success: boolean,
    details: string
}
- Description: Deletes student at student_id from the whole database

# Assignment endpoints
`GET  /api/assignments - Getting assignments from the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, class_id: number
- Output parameters : {
    data: [
        {
            assignment_id: number,
            class_id: number,
            name: string
            description: string,
            generic_questions: json object ~ string[]
        },
        ...
    ]
    details: string
}
- Description: Get all assignments for a specified class

`POST  /api/assignments - Adding assignments to the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, class_id: number, name: string, description: string
- Output parameters : {
    success: boolean,
    details: string
}
- Description: Add an assignment to a specified class

`PUT  /api/assignments - Editing assignments in the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, class_id: number, assignment_id: string, name: string, description: string, generic_questions: JSON
- Output parameters : {
    success: boolean,
    details: string
}

- IMPORTANT NOTE: generic_questions MUST be in the following format:
- "{Question1" : "What is a pancake?", "Question2" : "When is a pancake?", "Question3" : "Why is a pancake?", ...}
1. The Q in Questions Must be capitalised.
2. The Question number must start at 1 and increment by 1 until all questions are listed
3. To make the JSON functions happy: The text must be wrapped in "" as above, {} are also important, same with : and ,

- Description: edit an assignment of assignment_id, grants the ability to add to and edit the generic questions

`DELETE  /api/assignments - Deleting assignments from the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, assignment_id: number
- Output parameters : {
    success: boolean,
    details: string
}
- Description: delete assignment at assignment_id

# Submission endpoints
`GET  /api/submissions - getting submissions from the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, class_id: number, assignment_id: number
- Output parameters : {
    data: [
        {
            submission_id: number,
            assignment_id: number,
            student_id: number,
            submission_date: string,
            submission_filepath: string
        },
        ...
    ]
    details: string
}
- Description: get all submissions for a specific assignment (excludes the files see GET /api/submissionFile)

`POST  /api/submissions - adding submissions to the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, assignment_id: number, student_id: number, submission_pdf: FILE
- Output parameters : {
    success: boolean,
    details: string
}
- Description: adds a students submission file to the system

`PUT  /api/submissions - editing submissions in the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, submission_id: number, assignment_id: number, student_id: number, submission_date: string 
- Output parameters : {
    success: boolean,
    details: string
}
- Description: edit a submission

`DELETE  /api/submissions - deleting submissions from the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, submission_id: number
- Output parameters : {
    success: boolean,
    details: string
}
- Description: deletes a submission from the database

`GET  /api/submissionFile - get the file of a submission from server storage`
- Token in Authentication Header: Required
- Input parameters: user_id: number, submission_id: number
- Output parameters : FILE
- Description: returns the file stored for that specific submission_id

# AI Question endpoints
`GET  /api/qgen - Getting generated questions from the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, submission_id: number
- Output parameters : {
    data: [
        result_id: number,
        submission_id: number,
        generated_question: {
            content: {
                answer: string,
                question: string
            },
            ...
        },
        generation_date: string,
        score: number
    ],
    details: string
}
- Description: Gets AI generated questions for a submission

`POST  /api/qgen - Generating and then adding questions to the database`
- Token in Authentication Header: Required
- Input parameters: user_id: string, submission_id: string
- Output parameters : {
    success: boolean,
    details: string
}
- Description: generates AI questions for an existing submission in the database and stores it

# AI Rubric endpoints

# Viva endpoints
`GET  /api/vivas - Getting vivas from the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, submission_id: number
- Output parameters : {
    data: [
        {
        exam_id: number,
        submission_id: number,
        student_id: number,
        marks: number,
        comments: string,
        examiner_id: number
        },
        ...
    ]
    details: string
}
- Description: gets all exams for that submission

`POST  /api/vivas - Adding vivas to the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, submission_id: number, student_id: number
- Output parameters : {
    success: boolean,
    details: string
}
- Description: creates a exam entry for the student with the submission

`PUT  /api/vivas - Editing vivas in the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, exam_id: number, submission_id: number, student_id: number, examiner_id: number, marks: number, comments: string
- Output parameters : {
    success: boolean,
    details: string
}
- Description: edits an exam entry

`DELETE  /api/vivas - Deleting vivas from the database`
- Token in Authentication Header: Required
- Input parameters: user_id: number, exam_id: number
- Output parameters : {
    success: boolean,
    details: string
}
- Description: deletes an exam entry