# Desktop Dashboard
Displays information about enrolled network devices. **Unfinished - do not use without developer experience**.

![2021-04-16-161649_480x800_scrot](https://user-images.githubusercontent.com/11209477/115046438-5962d400-9ecf-11eb-88ef-f7982495bb94.png)

A NodeJS web front-end dashboard designed for a vertically mounted Raspberry Pi display run in Chromium Kiosk mode.

To run, we need npm to run us a local server for the Chromium instance to view, setup by running:

```
sudo apt-get install npm chromium-browser
sudo npm install -g npm@latest
```
[Make sure this plugin is installed][kioskexit] on Chromium, otherwise it will not exit Kiosk mode when selecting the close button.

And start by running `start.sh` inside the dashboard directory.

This heavily relies on the participant computers using the counterpart **[Communicator API][comm]** package.

## Development
For quick spin-up, use the `docker-compose.yml` file to quickly setup a container on localhost port 9000.

Otherwise, `npm install` to grab the node dependencies before continuing, and then run `npm start`. Accessible via http://localhost:9000.

[comm]: https://github.com/soup-bowl/deskdash-communicator
[kioskexit]: https://chrome.google.com/webstore/detail/exit-kiosk/oickijkfojmeggjbbhajnpjapbkippen
