#!/bin/bash
python3 -m pip install -r requirements.txt
if [ -n "$DATABASE_URL" ]; then
    python3 manage.py migrate --noinput
fi
python3 manage.py collectstatic --noinput --clear
