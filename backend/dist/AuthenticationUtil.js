"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = verifyJWT;
exports.generateTokenForLogin = generateTokenForLogin;
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const bcrypt = __importStar(require("bcrypt"));
const DatabaseUtil_1 = require("./DatabaseUtil");
//global variables
const tokenLifetime = "1h"; //how long a created token will stay valid for
const SALT_ROUNDS = 10; //how many times(rounds) bcrypt runs salt hashing
// JWT Token Verification Authenticaiton
async function verifyJWT(AuthHeader, userID) {
    try {
        if (!AuthHeader.startsWith('Bearer ')) {
            throw new Error("Error: Could not read authentication token in authentication header");
        }
        const token = AuthHeader.split(" ")[1]; //get the token after the "Bearer" bit
        // Retrieve the secret key from the environment variables
        const secretKey = process.env.SECRET_KEY;
        if (!secretKey) {
            throw new Error('Missing SECRET_KEY in environment variables');
        }
        // Decode the JWT
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY);
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
        const EmailFromID = await (0, DatabaseUtil_1.getEmailbyUserID)(userID);
        if (email != EmailFromID) {
            throw new Error('Token not matched to email associated to userID');
        }
        return true;
    }
    catch (error) {
        throw error; //this will look wierd as we are never explicitly returning false however so long as the endpoints catch the errors
    } //and deal with them correctly this is not an issue
}
function generateTokenForLogin(Email) {
    const tokenbody = { email: Email }; //contain more later
    //create the cookie
    const token = jsonwebtoken_1.default.sign(tokenbody, process.env.SECRET_KEY, { expiresIn: tokenLifetime }); //ensure that the first parameter is json {} otherwise it says somethings wrong with expiresIn
    console.log('Generated Token: ' + token);
    return token;
}
//Function to hash a password using bcrypt
//param password - The plain text password to hash
//returns A promise that resolves to the hashed password*/
async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword; //store it somewhere.
    }
    catch (error) {
        throw new Error('Error hashing the password');
    }
}
//Function to compare a plain text password with a hashed password
//param password - The plain text password
//param hash - The hashed password
//returns A promise that resolves to true if passwords match, false otherwise*/
async function comparePassword(password, hash) {
    try {
        const isMatch = await bcrypt.compare(password, hash);
        return isMatch;
    }
    catch (error) {
        throw new Error('Error comparing passwords');
    }
}
