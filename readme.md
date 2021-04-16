# Desktop Dashboard
Displays information about enrolled network devices. **Unfinished - do not use without developer experience**.

## Communicator
Cross-platform low requirement Python API to report system information and current stats across the network.

## Dashboard
A NodeJS web front-end dashboard designed for a vertically mounted Raspberry Pi display run in Chromium Kiosk mode.

To run, we need npm to run us a local server for the Chromium instance to view, setup by running:

```
sudo apt-get install npm chromium-browser
sudo npm install -g npm@latest
```
[Make sure this plugin is installed][kioskexit] on Chromium, otherwise it will not exit Kiosk mode when selecting the close button.

And start by running `start.sh` inside the dashboard directory.

## Development
Start off by running `dev.sh`, which will install dependencies for both Python API and Dashboard projects.

For communicator:
* For testing, run `py.test`.
* Change into `src` and run `python -m communicator` to run the API server, accessible via http://localhost:43594.

For Dashboard:
* Change into `src/Dashboard` directory and run `npm start`. Accessible via http://localhost:9000.

[kioskexit]: https://chrome.google.com/webstore/detail/exit-kiosk/oickijkfojmeggjbbhajnpjapbkippen