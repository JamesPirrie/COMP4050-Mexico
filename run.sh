#!/bin/bash

# Check if the database exists
if ! [ $(docker ps -a -q -f name=pgsql-dev) ]; then
  echo "Container doesn't exist... Running 'npm run db-build'..."
  npm --prefix backend run db-build
  sleep 10

else
  echo "Container exists... continuing..."
fi

#check if the container is running
if ! [ $(docker ps -q -f name=pgsql-dev) ]; then
  echo "Container not running... Running 'npm run db'..."
  npm --prefix backend run db
  sleep 5
else
  echo "Container running... continuing..."
fi

#attempt to enter the virtual environment
if source frontend/mqenv/bin/activate; then
  echo "Virtual enviroment successfully entered... continuing..."
else
# Check if a Python environment exists
if [ -z "$VIRTUAL_ENV" ]; then
  echo "Python virtual environment doesn't exist... Creating..."
  python3 -m venv frontend/mqenv
  source frontend/mqenv/bin/activate
else
  echo "Python virtual environment exists... continuing..."
fi
fi

# Install requirements from requirements.txt
pip3 install -r frontend/requirements.txt

# Start the web server
echo "Starting the backend and frontend servers..."
npm --prefix backend run server & python3 frontend/app.py