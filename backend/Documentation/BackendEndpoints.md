# Backend Endpoints Documentation 
This file contains all details relating to the expected inputs and outputs related to the backend servers endpoints.
                                    --------------------------------------------
                                     This is the Post-MVP version of this file.  
                                    --------------------------------------------
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
- All endpoints except signup and login require an authentication `bearer token` inside the Authentication header, and a `user_id` field. This token will be provided upon log in along with the user_id.


# Account endpoints 

`POST  /api/login - Logging in a user`

Input parameters: email: string, password: string.

Output parameters : { 
    success: boolean, 
    token: string, 
    userID: number, 
    details: string
}

`POST  /api/signup - Signing up a user`

Input parameters: email: string, password: string

Output parameters : { 
    success: boolean, 
    details: string
}

# Class endpoints

# Student endpoints

# Assignment endpoints

# AI Question endpoints

# Viva endpoints