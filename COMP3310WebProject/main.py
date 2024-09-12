from flask import (
  Blueprint, render_template, request, 
  flash, redirect, url_for, send_from_directory, 
  current_app, make_response
)
from .models import Photo
from sqlalchemy import asc, text
from . import db
from flask_login import login_required
from flask_login.utils import current_user
import os
from PIL import Image

main = Blueprint('main', __name__)

# This is called when the home page is rendered. It fetches all images sorted by filename.
@main.route('/')
def homepage():
  photos = db.session.query(Photo).order_by(asc(Photo.file))
  return render_template('index.html', photos = photos)

@main.route('/uploads/<name>')
def display_file(name):
  return send_from_directory(current_app.config["UPLOAD_DIR"], name)

# Upload a new photo
@main.route('/upload/', methods=['GET','POST'])
@login_required
def newPhoto():
  user = current_user.name
  if request.method == 'POST':
    file = None
    # Makes sure file size does not exceed more than 1MB
    current_app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024
    if "fileToUpload" in request.files:
      file = request.files.get("fileToUpload")
      # Checks if a file is an image and verifies it, returns True and continues if it is an image file.
      with Image.open(file) as img:
        img.verify()
        return True
    else:
      flash("Invalid request!", "error")

    if not file or not file.filename:
      flash("No file selected!", "error")
      return redirect(request.url)

    filepath = os.path.join(current_app.config["UPLOAD_DIR"], file.filename)
    file.save(filepath)

    newPhoto = Photo(name = request.form['user'], 
                    caption = request.form['caption'],
                    description = request.form['description'],
                    file = file.filename)
    db.session.add(newPhoto)
    flash('New Photo %s Successfully Created' % newPhoto.name)
    current_app.logger.info(user + " uploaded " + newPhoto)
    db.session.commit()
    return redirect(url_for('main.homepage'))
  else:
    return render_template('upload.html')
  


# This is called when clicking on Edit. Goes to the edit page.
@main.route('/photo/<int:photo_id>/edit/', methods = ['GET', 'POST'])
@login_required
def editPhoto(photo_id):
  user = current_user.name
  editedPhoto = db.session.query(Photo).filter_by(id = photo_id).one()

  if(user == editedPhoto.name) :  #current user owns this photo, let them edit or give warning!
    if request.method == 'POST':
      if request.form['user']:
        editedPhoto.name = request.form['user']
        editedPhoto.caption = request.form['caption']
        editedPhoto.description = request.form['description']
        db.session.add(editedPhoto)
        db.session.commit()
        current_app.logger.info(user + " edited " + editedPhoto)
        flash('Photo Successfully Edited %s' % editedPhoto.name)
        return redirect(url_for('main.homepage'))
    else:
      return render_template('edit.html', photo = editedPhoto)
  else :
    flash('You cannot edit a photo you do not own!')
    return redirect(url_for('main.homepage'))


# This is called when clicking on Delete. 
@main.route('/photo/<int:photo_id>/delete/', methods = ['GET','POST'])
@login_required
def deletePhoto(photo_id):
  user = current_user.name
  photo = db.session.query(Photo).filter_by(id = photo_id).one()

  if(user == photo.name) :  #current user owns this photo, let them delete or give warning!
    fileResults = db.session.execute(text('select file from photo where id = ' + str(photo_id)))
    filename = fileResults.first()[0]
    filepath = os.path.join(current_app.config["UPLOAD_DIR"], filename)
    os.unlink(filepath)
    db.session.execute(text('delete from photo where id = ' + str(photo_id)))
    db.session.commit()
    current_app.logger.info(user + " deleted " + photo)

    flash('Photo id %s Successfully Deleted' % photo_id)
    return redirect(url_for('main.homepage'))
  else :
    flash('You cannot delete a photo you do not own!')
    return redirect(url_for('main.homepage'))

 
@main.errorhandler(404)
def not_found_error(error):
  return render_template('404.html'), 404

@main.errorhandler(413)
def bad_upload_error(error):
  return render_template('413.html'), 413

 
@main.errorhandler(500)
def internal_server_error(error):
  return render_template('500.html'), 500

 #This would be the code for the Favourites button. It isnt functional at present. 
  # Comments relating to Task 9 are in favourites.html

