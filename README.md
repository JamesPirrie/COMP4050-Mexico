# COMP4050-Mexico
Team Mexico COMP4050

# File Structure

# Quickstart (for marking purposes)
The Webserver is live at [121.209.43.160:8080](http://121.209.43.160:8080)
If the webserver is down:
1. ensure that you have [python3](https://www.python.org/downloads/) installed
2. run `sudo ./run_remote.sh` (this will spin up a local webserver that connects to the remote backend server. This allows AI functionality to remain)
3. connect to the local webserver on [127.0.0.1:5000](127.0.0.1:5000)

# Quickstart (for development)
In order to run VivaMQ locally:
1. ensure that you have [python3](https://www.python.org/downloads/) and [node](https://github.com/nvm-sh/nvm) installed
2. For Mac and Linux, run `./run.sh` (you may need to give execute permissions, use `sudo ./run.sh`)
3. If the script fails, or you are on another operating system (Windows), follow manual build instructions below

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
