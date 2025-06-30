#!/bin/bash

# Build frontend
npm install
npm run build

# Start Flask app
python app.py
