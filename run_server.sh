#!/bin/bash

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
echo "Starting the frontend server..."
python3 frontend/app.py http://3.25.239.135:3000/api/

#uwsgi --http :8080 --wsgi-file app.py --callable app --processes 1 --threads 1