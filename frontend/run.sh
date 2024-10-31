(cd ../backend && npm run server &)
(uwsgi --http :8080 --wsgi-file app.py --callable app --processes 4 --threads 2) &