# SculptingVis Applets

A collection of Applets (Color Loom, Glyph Aligner, Infinite Line, and Texture Mapper) to create visassets for ABR.

## Prerequisites

Install the pymongo Python package:

- `python -m pip install pymongo`

## Instructions for setting this up in development

- In your cloned repo, go to the folder `svis`, locate the file `settings.py.___` for your operating system, then make a copy of it and rename the copy to `settings.py`. 
    - For example, if you're on Windows, make a copy of `settings.py.windows` and rename it to `settings.py`

- Run `python manage.py migrate`

- Run `python manage.py collectstatic`

- Run `python manage.py runserver`

- Open your web browser then go to the website http://127.0.0.1:8000/ to see the Applets in action
