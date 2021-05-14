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

[comm]: https://github.com/soup-bowl/deskdash-communicator
[docker]: https://hub.docker.com/r/soupbowl/deskdash
