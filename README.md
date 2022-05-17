# SculptingVis Applets

A collection of Applets (Color Loom, Glyph Aligner, Infinite Line, and Texture Mapper) to create visassets for ABR.

## Prerequisites

Install the pymongo Python package:

- `python -m pip install django pymongo django_extensions`

## Instructions for setting this up in development

- In your cloned repo, go to the folder `svis`, locate the file `settings.py.___` for your operating system, then make a copy of it and rename the copy to `settings.py`. 
    - For example, if you're on Windows, make a copy of `settings.py.windows` and rename it to `settings.py`
    - Make sure your static files location and log file locations exist and are correct in `settings.py`.
    - Make sure the directory `static/Artifacts` exists in your static files root.

- Run `python manage.py migrate`

- Run `python manage.py collectstatic`

- Run `python manage.py runserver`

- Open your web browser then go to the website http://127.0.0.1:8000/ to see the Applets in action

- In order to properly show thumbnails, etc. in the library, you may need to use `whitenoise` to serve static files (see `settings.bridger.py` for example)


## Instructions for setting up MongoDB to manage your local library
- Install MongoDB and MongoDB Compass from the [MongoDB Website](https://www.mongodb.com/)
    - :warning: On Linux, do not use the `mongodb` on `apt`, for example...
    - Instead, follow the [install instructions](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/).
    - You may need to explicitly set `storage:engine:wiredTiger` in `/etc/mongod.conf`.
    - Check the logs in `sudo journalctl -u mongod` and `/var/log/mongodb/mongod.log`.
