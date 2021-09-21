/**
 * Deskdash - Raspberry Pi equipment monitor.
 *
 * @author soup-bowl <code@soupbowl.io>
 * @package deskdash
 */

const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * Creates the active running window.
 */
function createWindow () {
	const win = new BrowserWindow({
		fullscreen: true,
		autoHideMenuBar: true,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js')
		}
	});

	win.loadFile( path.join(__dirname, 'app', 'dash.html') );
}

// Start the Electron app, and create a window.
app.whenReady().then(() => {
	if(fs.existsSync('config.json')) {
		createWindow();

		app.on('activate', () => {
			if (BrowserWindow.getAllWindows().length === 0) {
				createWindow();
			}
		})

	} else {
		dialog.showErrorBox('No configuration found', 'No config.json file found. Please setup a configuration file before continuing.');
		app.quit();
	}
});

// If all the application windows are closed, terminate the application.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
