# Backend Endpoints Documentation 
This file contains all details relating to the expected inputs and outputs related to the backend servers endpoints.
`This is the Post-MVP version of this file.`
# Request Headers
The backend server will read requests with `content-type: application/json` or `content-type: multipart/formdata` in their headers.

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

# Account endpoints 

`POST  /api/login - Logging in a user`
Token in Authentication Header: None
Input parameters: email: string, password: string.

Output parameters : {
    success: boolean, 
    token: string, 
    userID: number, 
    details: string
}
Description: Used for logging in a user

`POST  /api/signup - Signing up a user`
Token in Authentication Header: None
Input parameters: email: string, password: string

Output parameters : { 
    success: boolean, 
    details: string
}
Description: Used for signing up a user

# Class endpoints
`GET  /api/classes - Getting classes from the database`
Token in Authentication Header: Required
Input parameters: user_id: number
Output parameters : {
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
Description: Returns all classes for that user

`POST  /api/classes - Adding classes to the database`
Token in Authentication Header: Required
Input parameters: user_id: number, session: number, year: number, title: string, code: string
Output parameters : {
    success: boolean,
    details: string
}
Description: Adds a class for that user

`PUT  /api/classes - Editing classes in the database`
Token in Authentication Header: Required
Input parameters: user_id: number, session: number, year: number, title: string, code: string, class_id: number
Output parameters : {
    success: boolean,
    details: string
}
Description: Edits an existing class for that user

`DELETE  /api/classes - Deleting classes from the database`
Token in Authentication Header: Required
Input parameters: user_id: number, class_id: number
Output parameters : {
    success: boolean,
    details: string
}
Description: Deletes a class corresponding to class_id

`POST  /api/classesStudents - Adding students to the class`
TODO: STILL NEED TO IMPLEMENT

`DELETE  /api/classesStudents - Deleting students from a class`
TODO: STILL NEED TO IMPLEMENT

# Student endpoints
`GET  /api/students - Getting students from the database`
Token in Authentication Header: Required
Input parameters:
Output parameters : {
    
}
`POST  /api/students - Adding students to the database`
Token in Authentication Header: Required
Input parameters:
Output parameters : {
    
}
`PUT  /api/students - Editing students in the database`
Token in Authentication Header: Required
Input parameters:
Output parameters : {
    
}
`DELETE  /api/students - Deleting students from the database`
Token in Authentication Header: Required
Input parameters:
Output parameters : {
    
}

# Assignment endpoints
`GET  /api/assignments - Getting assignments from the database`
Token in Authentication Header: Required
Input parameters:
Output parameters : {
    
}
`POST  /api/assignments - Adding assignments to the database`
Token in Authentication Header: Required
Input parameters:
Output parameters : {
    
}
`PUT  /api/assignments - Editing assignments in the database`
Token in Authentication Header: Required
Input parameters:
Output parameters : {
    
}
`DELETE  /api/assignments - Deleting assignments from the database`
Token in Authentication Header: Required
Input parameters:
Output parameters : {
    
}

# AI Question endpoints
`GET  /api/qgen - Getting generated questions from the database`
Token in Authentication Header: Required
Input parameters:
Output parameters : {
    
}
`POST  /api/qgen - Generating and then adding questions to the database`
Token in Authentication Header: Required
Input parameters:
Output parameters : {
    
}


# Viva endpoints
`GET  /api/vivas - Getting vivas from the database`
Token in Authentication Header: Required
Input parameters:
Output parameters : {
    
}
`POST  /api/vivas - Adding vivas to the database`
Token in Authentication Header: Required
Input parameters:
Output parameters : {
    
}
`PUT  /api/vivas - Editing vivas in the database`
Token in Authentication Header: Required
Input parameters:
Output parameters : {
    
}
`DELETE  /api/vivas - Deleting vivas from the database`
Token in Authentication Header: Required
Input parameters:
Output parameters : {
    
}