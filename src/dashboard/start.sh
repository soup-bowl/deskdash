#! /bin/bash
npm start &
chromium-browser --kiosk -tab "http://localhost:9000"