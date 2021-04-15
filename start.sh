#! /bin/bash
echo "Dashboard will run on http://localhost:9000 and the API will be on http://localhost:43594. Run pkill python to close (pending better method)."
sh -c "( cd src && python -m communicator )" & APISERV=$!
sh -c "( cd src/dashboard && python3 -m http.server 9000 )" & DASHSERV=$!
