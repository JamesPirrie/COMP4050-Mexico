import jwt from 'jsonwebtoken';
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { getEmailbyUserID } from './DatabaseUtil';

//global variables
const tokenLifetime: string = "1h";//how long a created token will stay valid for
const SALT_ROUNDS = 10; //how many times(rounds) bcrypt runs salt hashing

// Defining the interface for the JWT payload
interface JwtPayload {
    email: string;
}

// JWT Token Verification Authenticaiton
export async function verifyJWT(AuthHeader: string, userID: number): Promise<boolean> {
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
        const EmailFromID = await getEmailbyUserID(userID);
        if (email != EmailFromID){
            throw new Error('Token not matched to email associated to userID');
        }
        return true;
    } catch (error) {
        throw error;//this will look wierd as we are never explicitly returning false however so long as the endpoints catch the errors
    }               //and deal with them correctly this is not an issue
}

export function generateTokenForLogin(Email: string, UserID: number) : string {
    const tokenbody = {
        email : Email,
        userID: UserID
    };//contain more later
            
    //create the cookie
    const token = jwt.sign(tokenbody, process.env.SECRET_KEY as string, {expiresIn : tokenLifetime});//ensure that the first parameter is json {} otherwise it says somethings wrong with expiresIn
    console.log('Generated Token: '+ token);

    return token;
}

//Function to hash a password using bcrypt
//param password - The plain text password to hash
//returns A promise that resolves to the hashed password*/
export async function hashPassword(password: string): Promise<string> {
    try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword; //store it somewhere.
    } catch (error) {
        throw new Error('Error hashing the password');
    }
}

//Function to compare a plain text password with a hashed password
//param password - The plain text password
//param hash - The hashed password
//returns A promise that resolves to true if passwords match, false otherwise*/
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    try {
        const isMatch = await bcrypt.compare(password, hash);
        return isMatch;
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
}
