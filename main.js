/**
 * Deskdash - Raspberry Pi equipment monitor.
 *
 * @author soup-bowl <code@soupbowl.io>
 * @package deskdash
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * Creates the active running window.
 */
function createWindow () {
	const win = new BrowserWindow({
		fullscreen: true,
		autoHideMenuBar: true
	});

	win.loadFile('index.html');
}

// Start the Electron app, and create a window.
app.whenReady().then(() => {
	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	})
});

// If all the application windows are closed, terminate the application.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
