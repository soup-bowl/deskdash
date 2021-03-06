/**
 * Deskdash - Raspberry Pi equipment monitor.
 *
 * @author soup-bowl <code@soupbowl.io>
 * @package deskdash
 */

var endpoints; // Loaded with configuration data from config.json, called at the bottom of this file.
var segmentLoads = [];
var data = []; // Populated with collected data from participants.
var activeStage = 0;
let carouselCommand;

// --- Initalisation segment ---

/**
 * Initialises the stage.
 */
async function init() {
	document.getElementById('loading').classList.remove('d-none');
	document.getElementById('stage').innerHTML = '';

	// Check what types are being used in the configuration.
	endpoints.views.forEach(segment => {
		exists = (segmentLoads.indexOf(segment.type) !== -1) ? true : false;
		if (!exists) {
			segmentLoads.push(segment.type);
		}
	});

	load_scripts();
	
	for (let index = 0; index < endpoints.views.length; index++) {
		settings = endpoints.views[index];
		bgcolor    = (settings.background !== null) ? "background-color:" + settings.background + ";" : "";
		bgimagecss = (settings.randomBackground || typeof settings.backgroundUrl === 'string') ? " bgimage" : "";
		bgimg      = (typeof settings.backgroundUrl === 'string') ? "background-image: url('" + settings.backgroundUrl + "');" : "";
		bgimgauto  = (settings.randomBackground) ? "background-image: url('https://source.unsplash.com/daily');" : "";

		container = "<div id=\"e" + index + "\" class=\"carousel-item roulette-item " + bgimagecss + "\" style=\"" + bgcolor + bgimg + bgimgauto + "\"></div>";
		document.getElementById("stage").insertAdjacentHTML('beforeend', container);
	}
	
	for (let index = 0; index < endpoints.views.length; index++) {
		await load_segment(endpoints.views[index].type, index);
	}

	document.getElementById('loading').classList.add('d-none');
	document.getElementById('e0').classList.add('active');
}

/**
 * Loads a segment into the stage cycles.
 *
 * @param {string}   segment         Name of a HTML file in segments folder. Just the filename, no extension.
 * @param {int}      identifier      Number of the loop. Must not have been already used.
 */
function load_segment(segment, identifier) {
	return new Promise(resolve => {
		file_get_contents("segments/" + segment + "/" + segment + ".html").then(page => {
			rechanged = page.replaceAll('{{CHANGE}}', identifier);
			document.getElementById("e"+identifier).innerHTML = rechanged;
		});

		resolve();
	});
}

/**
 * Load each counterpart JavaScript file for each screen used.
 */
function load_scripts() {
	segmentLoads.forEach(segment => {
		load_js_file("segments/" + segment + "/" + segment + ".js");
	});
}

/**
 * Dynamically loads in a JavaScript file.
 *
 * @param {string} file Path to JS file.
 */
function load_js_file(file) {
	var jsFile = document.createElement("script");
	jsFile.type = "application/javascript";
	jsFile.src = file;
	document.body.appendChild(jsFile);
}

// --- Continuous update segment ---

/**
 * Initiates an update data routine across all the stages.
 */
function update() {
	// Update the alert count in the dashboard.
	faultCount = document.getElementById("stageLeft").children.length;
	document.getElementById("alertCount").innerHTML = faultCount;

	dt = get_datetime();
	document.getElementById('globaltime').innerHTML = dt.t;
	document.getElementById('globaldate').innerHTML = dt.d;
	for (let index = 0; index < endpoints.views.length; index++) {
		// Get the view details and initiate the relevant segment function.
		var obj = endpoints.views[index];
		if ( window['update_' + obj.type] !== undefined ) {
			window['update_' + obj.type](obj, index);
		} else {
			continue;
		}
	}
}

/**
 * Sets additional buttons commanded by the stage.
 *
 * @param {int}  id          Stage ID that's currently on-screen.
 * @param {bool} canShutdown Can the stage shut down the host?
 */
function set_stage_buttons(id, buttons = []) {
	obj       = endpoints.views[id];
	stageBtns = document.getElementById("stageButtons");
	btnHtml   = "<div class=\"row\">";

	btlen = buttons.length;
	for (let index = 0; index < btlen; index++) {
		btnHtml += "<div class=\"col\">";
		btnHtml += "<button type=\"button\" class=\"btn btn-lg btn-secondary\" onclick=\"execute_cmd(" + id + ", '" + buttons[index]["name"] + "')\"><i class=\"bi " + buttons[index]["icon"] + "\"></i></button>";
		btnHtml += "<p>" + buttons[index]["name"] + "</p>";
		btnHtml += "</div>";
	}

	btnHtml += "</div>"

	stageBtns.innerHTML = btnHtml;
}

/**
 * Fires off a shutdown pulse command.
 * @param {int} id ID. 
 * @returns
 */
function execute_cmd(id, cmd) {
	auth  = (endpoints.views[id].key !== undefined) ? "?key=" + endpoints.views[id].key : "";
	query = endpoints.views[id].endpoint + auth + "&cmd=" + cmd;
	fetch(query)
		.then(response => response.json())
		.then(json => {return true;})
		.catch(err => {return false;});
}

/**
 * Sets the colour of the badges based upon their numerical input. Green for low, yellow for above 60C, and red for 80C.
 * @param {int} obj    The object we're adding the CSS classes too.
 * @param {int} number The temperature in celcius.
 */
function set_temp_badge(obj, number) {
	if (number > 60) {
		obj.classList.remove('badge-success');
		obj.classList.remove('badge-danger');
		obj.classList.add('badge-warning');
	} else if(number > 80) {
		obj.classList.remove('badge-success');
		obj.classList.remove('badge-warning');
		obj.classList.add('badge-danger');
	} else {
		obj.classList.remove('badge-warning');
		obj.classList.remove('badge-danger');
		obj.classList.add('badge-success');
	}
}

/**
 * Converts a raw string of bytes into a prettified unit with counterpart idnciator.
 * 
 * @param {int} raw_bits Measurement in bytes.
 * @returns {string} Pretty measurement with unit.
 */
function humanize_size(raw_bits) {
	units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
	steps = 0;
	conversion = raw_bits;
	
	while (conversion > 1024) {
		conversion = conversion / 1024;
		steps++;
	}

	conversion = Math.round(conversion);
	return `${conversion} ${units[steps]}`;
}

/**
 * Replicates the PHP functionality of the same name. Sorry, can't take the PHP dev out of me :(
 * {@link https://stackoverflow.com/a/61787359|StackOverflow}.
 *
 * @param {string}   uri      URL to get stuff from.
 * @param {callback} callback Callback routine with the response (or attach .then).
 * @returns 
 */
async function file_get_contents(uri, callback) {
    let res = await fetch(uri),
        ret = await res.text(); 
    return callback ? callback(ret) : ret;
}

/**
 * Restarts the carousel.
 */
function restart_carousel() {
	sliders = document.getElementById("stage").getElementsByTagName("div");
	for (var i = 0; i < sliders.length; i += 1) {
		sliders[i].classList.remove("active");
	}

	document.getElementById("e0").classList.add("active");
}

/**
 * Is the current index slide visible on-screen?
 * @param {int} index Index of the slide.
 * @returns {boolean} Boolean based on stage visibility.
 */
function is_visible(index) {
	if ( index === parseInt(activeStage) ) {
		return true;
	} else {
		return false;
	}
}

/**
 * Toggles the visibility of the dashboard.
 */
function toggle_dashboard() {
	dashboard = document.getElementById("dashboard");

	if ( ! dashboard.classList.contains("d-none") ) {
		dashboard.classList.add("d-none");
	} else {
		dashboard.classList.remove("d-none");

		// Update the play/pause button status.
		if( document.getElementById("ysmrrbrrlarbrrrr").classList.contains("paused") ) {
			document.getElementById("btnPause").classList.add("disabled");
			document.getElementById("btnPlay").classList.remove("disabled");
		} else {
			document.getElementById("btnPlay").classList.add("disabled");
			document.getElementById("btnPause").classList.remove("disabled");
		}
	}
}

/**
 * Toggles cursor visiblity by adding a CSS rule to the body tag.
 *
 * @param {bool} set_state Stores the setting for on-boot usage.
 */
function toggle_cursor( set_state = true ) {
	bigchungus = document.getElementsByTagName('body')[0];

	if ( ! bigchungus.classList.contains("no-cursor") ) {
		bigchungus.classList.add("no-cursor");
		if ( set_state ) { localStorage.setItem( 'ddd_cursorstate', 'yes' ); }
	} else {
		bigchungus.classList.remove("no-cursor");
		if ( set_state ) { localStorage.setItem( 'ddd_cursorstate', 'no' ); }
	}
}

/**
 * Returns time & date. Pass true for 24 hour timer.
 * 
 * @param {boolean} military True for 24 hour clock.
 * @returns {object} 't' for time and 'd' for date.
 */
function get_datetime(military = false) {
	var dt = dayjs();

	return {
		't': (military) ? dt.format('H:mm') : dt.format('h:mm a'),
		'd': dt.format('DD/MM/YYYY')
	};
}

/**
 * Checks whether the stage is in circulation.
 *
 * @param {int} stage_id The stage identifier (int, without the 'e'). 
 */
function is_stage_enabled(stage_id) {
	stage = document.getElementById('e' + stage_id).parentNode.id;

	if (stage === "stage") {
		return true;
	} else {
		return false;
	}
}

/**
 * Restages all the faulted stages.
 */
function restage_faulted() {
	stage      = document.getElementById("stage");
	faultstage = document.getElementById("stageLeft").children;
	for (let index = 0; index < faultstage.length; index++) {
		document.getElementById("stage").appendChild(faultstage[index]);
	}
}

/**
 * Moves the specified stage ID to the vanishing cabinet.
 *
 * @param {int} stage_id The stage identifier (int, without the 'e'). 
 */
function toggle_stage(stage_id) {
	stage   = document.getElementById('e' + stage_id);
	current = stage.parentNode.id;

	if (current === "stage") {
		document.getElementById("stageLeft").appendChild(stage);
		// If the currently visible slide went down, shift us back to the first visible one.
		if (stage_id === activeStage) {
			document.getElementById("stage").firstChild.classList.add('active');
			activeStage = 0;
		}
	} else {
		document.getElementById("stage").appendChild(stage);
	}
}

// --- Init ---

window.onload = function() {
	fetch('../config.json')
		.then(response => response.json())
		.then(json => {
			endpoints = json;
			init();

			var updateLoop = window.setInterval(function(){
				update();
			}, 5000);

			cursor_is_off = localStorage.getItem( 'ddd_cursorstate' );
			if ( cursor_is_off !== null && cursor_is_off === 'yes' ) {
				toggle_cursor( false );
			}

			carouselCommand = new BSN.Carousel('#ysmrrbrrlarbrrrr', {
				// these options values will override the ones set via DATA API
				interval: 30000,
				pause: false,
				keyboard: false
			});

			document.getElementById('ysmrrbrrlarbrrrr').addEventListener('slide.bs.carousel', event => {
				activeStage = event.relatedTarget.id.slice(-1);

				// If the now-active stage has buttons, send a request to the function to set them. Otherwise, set to blank.
				var obj = endpoints.views[activeStage];
				set_stage_buttons(activeStage);
				if ( window['buttons_' + obj.type] !== undefined ) {
					window['buttons_' + obj.type](obj, activeStage);
				}
			});
		})
		.catch(err => console.log(err));
	
	window.onkeydown = function(keypress){
		// 67 = (C)ursor.
		if(keypress.keyCode === 67){
			toggle_cursor();
		};
	};
};
