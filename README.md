# COMP4050-Mexico
Team Mexico COMP4050

# File Structure


# Running the Webserver
In order to run the webserver
1. navigate to `/frontend`
2. run app.py with `python3 app.py`

# Running the Backend Server
To run the backend:
1. Navigate to `/backend`
2. Build and run the database
    - Download and Install Docker from https://docs.docker.com/get-started/get-docker/
    - Run `npm run db-build`. Database will build with the following default parameters:
        - **Host**: localhost
        - **Port**: 5432
        - **Database**: postgres
        - **User**: postgres
        - **Password**: default
    - To stop the database, run `npm run db-stop`. To start the database again, run `npm run db`
    - To rebuild the database, stop the container using `npm run db-stop`, delete the `viva-db` folder and run `npm run db-build`
3. Run the backend server
    - Install the dependencies in package.json using `npm install "package"@"version"`
        - Install the AI library using `npm install git+https://github.com/stroogle/COMP4050AI.git`
    - Copy the `.env-template` file as `.env`. The variables are listed below:
        - **HOST**: The database host.
        - **PORT**: The database port.
        - **DB**: Name of the database.
        - **DB_USER**: User of the database.
        - **PASS**: User password for the database.
        - **IS_MOCK**: Determines whether the AI library provides mock data. Default value is `NO`
        - **OPENAI_API_KEY**: OpenAI API Key for the AI library.
        - **SECRET_KEY**: Secret key for hashing passwords and JWT.
    - Run `npm run server`