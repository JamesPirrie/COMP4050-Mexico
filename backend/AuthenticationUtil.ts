import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

//global variables
const tokenLifetime: string = "1h";//how long a created token will stay valid for

// Defining the interface for the JWT payload
interface JwtPayload {
    email: string;
}

//initialisation
dotenv.config();

// JWT Token Verification Authenticaiton
export function verifyJWT(AuthHeader: string, userID: number, User_idEmail: string): boolean {
    try {
        if(!AuthHeader.startsWith('Bearer ')){
            throw new Error("Error: Could not read authentication token in authentication header");
        }
        const token: string = AuthHeader.split(" ")[1];//get the token after the "Bearer" bit
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
        const claimedEmail = User_idEmail;
        if (email != claimedEmail){
            throw new Error('Token not matched to claimed email');
        }
        return true;
    } catch (error) {
        throw error;//this will look wierd as we are never explicitly returning false however so long as the endpoints catch the errors
    }               //and deal with them correctly this is not an issue
}

export function generateTokenForLogin(Email : string) : string {
    const tokenbody = {email : Email};//contain more later
            
    //create the cookie
    const token = jwt.sign(tokenbody, process.env.SECRET_KEY as string, {expiresIn : tokenLifetime});//ensure that the first parameter is json {} otherwise it says somethings wrong with expiresIn
    console.log('Generated Token: '+ token);

    return token;
}