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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv = __importStar(require("dotenv"));
//global variables
const tokenLifetime = "1h"; //how long a created token will stay valid for
//initialisation
dotenv.config();
// JWT Token Verification Authenticaiton
function verifyJWT(AuthHeader, claimedEmail) {
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
        if (email != claimedEmail) {
            throw new Error('Token not matched to claimed email');
        }
        return true;
    }
    catch (error) {
        throw error;
        //console.error('Error decoding token or interacting with database:', error);
        return false;
    }
}
function generateTokenForLogin(Email) {
    const tokenbody = { email: Email }; //contain more later
    //create the cookie
    const token = jsonwebtoken_1.default.sign(tokenbody, process.env.SECRET_KEY, { expiresIn: tokenLifetime }); //ensure that the first parameter is json {} otherwise it says somethings wrong with expiresIn
    console.log('Generated Token: ' + token);
    return token;
}
