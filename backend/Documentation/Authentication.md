# Authentication Documentation

This document provides an overview of the authentication process in this code, including how JSON Web Token (JWT) authentication and password hashing work. The code implements JWT-based authentication and uses bcrypt for secure password management.

## Overview of Authentication

Authentication is the process of verifying the identity of a user or service. In web applications, this process typically involves a login system where users submit credentials (e.g., username and password). Once authenticated, users receive a token (JWT in this case) that can be used to access restricted resources without needing to log in repeatedly.

## JSON Web Token (JWT) Authentication

JWT is a popular, stateless authentication method that securely encodes data as JSON objects. JWTs typically contain a payload with user information and are cryptographically signed, so they can be trusted when passed between the client and server.

### How JWT Authentication Works:

- **Login Request**: The client sends a login request with user credentials.
- **Token Generation**: Upon successful verification, the server generates a JWT and returns it to the client.
- **Token Usage**: The client stores the JWT (usually in local storage or as an HTTP-only cookie) and includes it in the `Authorization` header of subsequent requests.
- **Token Verification**: The server verifies the JWT on each request to confirm the user's identity.

## Code Explanation

### Global Variables

- **tokenLifetime**: Defines the lifetime of a created token (1 hour in this example).
- **SALT_ROUNDS**: Specifies the number of salt rounds bcrypt uses for password hashing.

### JWT Token Verification Authentication (`verifyJWT` function)

This function verifies the authenticity of a JWT and ensures that it belongs to the intended user.

- **Token Validation**:
  - Verifies that the `AuthHeader` starts with "Bearer ".
  - Extracts the token portion from the `AuthHeader`.

- **Secret Key**:
  - Retrieves the secret key from environment variables to securely decode the token. If missing, throws an error.

- **Token Decoding**:
  - Decodes the token and extracts the email from the payload.

- **Email Validation**:
  - Checks if the email format is correct using a regex pattern.
  - Compares the decoded email with the email associated with the provided `userID` in the database.
  - If the email matches, returns `true`; otherwise, an error is thrown.

### JWT Generation (`generateTokenForLogin` function)

This function generates a new JWT when a user logs in successfully.

- **Token Payload**:
  - Includes `email` and `userID` as part of the payload.

- **Token Signing**:
  - Signs the token using the secret key and sets an expiration time (`tokenLifetime`).
  - Returns the generated token, which can be used for future authentication.

### Password Hashing and Comparison

#### Hash Password (`hashPassword` function)

This function hashes a plain text password using bcrypt, a secure hashing algorithm that incorporates salting and multiple rounds of hashing.

- **Salt Generation**:
  - Randomly generated based on `SALT_ROUNDS`.

- **Password Hashing**:
  - Hashes the password with the salt.
  - Returns the hashed password.

#### Compare Password (`comparePassword` function)

This function compares a plain text password with a hashed password to check if they match.

- **Password Comparison**:
  - Uses bcrypt’s `compare` function to match the plain text password with the hashed password.
  - Returns `true` if they match; otherwise, `false`.
