#!/bin/bash

rsync -av --exclude=node_modules --exclude=__pycache__ --exclude=build . webapp.cs.clemson.edu:~/MeTube
