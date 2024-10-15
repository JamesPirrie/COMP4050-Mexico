# COMP4050-Mexico
Team Mexico COMP4050

# File Structure


# Running the Webserver
In order to run the webserver
1. navigate to `/frontend`
2. run app.py with `python3 app.py`

# Running the Backend Server
In order to run the backend
1. navigate to `/backend`
2. The database (assuming this is being done in a docker container)
    - Download and Install Docker from https://docs.docker.com/get-started/get-docker/
    - Run `npm run build_db`
    - When the build is complete, run `npm run db` to start the container.
3. The backend server
    - install the dependencies in package.json using `npm install "package"@"version"`
    - this includes the AI library `npm install git+https://github.com/stroogle/COMP4050AI.git`
    - ensure a .env file is present with variables from .env-template
    - run `npm run server`