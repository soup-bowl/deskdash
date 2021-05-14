# Desktop Dashboard
Displays information about enrolled network devices. **Unfinished - do not use without developer experience**.

![2021-04-16-161649_480x800_scrot](https://user-images.githubusercontent.com/11209477/115046438-5962d400-9ecf-11eb-88ef-f7982495bb94.png)

A NodeJS dashboard designed for a vertically mounted Raspberry Pi display.

## Start
This now uses Electron to run. From source, install node dependencies then run start to open the application.

```
sudo apt-get install npm
sudo npm install -g npm@latest
sudo npm install
npm start
```

This heavily relies on the participant computers using the counterpart **[Communicator API][comm]** package.

## Starting on GUI Startup (Raspberry Pi OS)
I used the LXDE autostart for this. In my installation, I had no local Autostart and apparently [local *overrides* rather than compliments][ldir], so run this before continuing if yours doesn't exist too.

`cp /etc/xdg/lxsession/LXDE-pi/autostart ~/.config/lxsession/LXDE-pi`

Adding the following to the end of your newly-available local copy (change the working directory to match your setup):

`@lxterminal --working-directory=/home/pi/Companion -e npm start`

[comm]: https://github.com/soup-bowl/deskdash-communicator
[docker]: https://hub.docker.com/r/soupbowl/deskdash
[ldir]: https://raspberrypi.stackexchange.com/a/102297
