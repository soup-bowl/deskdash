# Desktop Dashboard
Displays information about enrolled network devices. **Unfinished - do not use without developer experience**.

![2021-04-16-161649_480x800_scrot](https://user-images.githubusercontent.com/11209477/115046438-5962d400-9ecf-11eb-88ef-f7982495bb94.png)

## Dashboard
A NodeJS web front-end dashboard designed for a vertically mounted Raspberry Pi display run in Chromium Kiosk mode.

To run, we need npm to run us a local server for the Chromium instance to view, setup by running:

```
sudo apt-get install npm chromium-browser
sudo npm install -g npm@latest
```
[Make sure this plugin is installed][kioskexit] on Chromium, otherwise it will not exit Kiosk mode when selecting the close button.

And start by running `start.sh` inside the dashboard directory.

## Communicator
Cross-platform low requirement Python API to report system information and current stats across the network. Currently, this can:

* Collect and return system information.
* Report system usage and (sometimes) temperatures.
* Collect information about Nvidia GPUs.
* (optionally) Can use nmap to scan the enclosed local network.

## Development
For convinience, a `docker-compose.yml` file is provided which will create an API and Dashboard bound to their respective ports. This will not work for 'production' use as the API container can only see the API released by the container filesystem, which is not a true account. The dashboard is fine and will likely be released as a container later on.

Start off by running `dev.sh`, which will install dependencies for both Python API and Dashboard projects.

For communicator:
* For testing, run `py.test`.
* Change into `src` and run `python -m communicator` to run the API server, accessible via http://localhost:43594.

For Dashboard:
* Change into `src/Dashboard` directory and run `npm start`. Accessible via http://localhost:9000.

[kioskexit]: https://chrome.google.com/webstore/detail/exit-kiosk/oickijkfojmeggjbbhajnpjapbkippen
