# Desktop Dashboard
Displays information about enrolled network devices. **Unfinished - do not use without developer experience**.

A NodeJS dashboard designed for a vertically mounted Raspberry Pi display. [See here][wk-screens] for examples of the screens.

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

## Hiding the cursor
Move/tap the cursor to the bottom right corner as far in as you can go. There's a hitbox area which will hide the cursor. Move the cursor away from this area and it will re-appear. 

[wk-screens]: https://github.com/soup-bowl/deskdash/wiki/Screens
[comm]: https://github.com/soup-bowl/deskdash-communicator
[docker]: https://hub.docker.com/r/soupbowl/deskdash
[ldir]: https://raspberrypi.stackexchange.com/a/102297
