from flask import Flask, render_template, url_for, redirect

app = Flask(__name__)

@app.route('/')
def dashboard():
    return render_template('dashboard.html')

@app.route('/classes')
def classes():
    return render_template('classes.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')

@app.route('/new_project')
def new_project():
    return render_template('new_project.html')

@app.route('/assignments')
def assignments():
    return render_template('assignments.html')

@app.route('/logout')
def logout():
    # Handle logout logic
    return redirect(url_for('dashboard'))

if __name__ == '__main__':
    app.run(debug=True)