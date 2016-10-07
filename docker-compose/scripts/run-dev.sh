#!/bin/sh

echo "[$(date --rfc-3339 seconds)] - Installing backoffice dependencies..."
npm install
bower install --allow-root

echo "[$(date --rfc-3339 seconds)] - Starting backoffice development server..."
npm run dev
