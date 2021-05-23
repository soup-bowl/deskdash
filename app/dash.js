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
		if ( endpoints.views[index].type == "communicator" ) {
			await load_segment('communicator', index);
		} else if ( endpoints.views[index].type == "timedate" ) {
			await load_segment('timedate', index);
		} else if ( endpoints.views[index].type == "helloworld" ) {
			await load_segment('helloworld', index);
		} else if( endpoints.views[index].type == "netscan" ) {
			await load_segment('netscan', index);
		} else if( endpoints.views[index].type == "crypto" ) {
			await load_segment('crypto', index);
		} else {
			console.log("Invalid type: " + endpoints.views[index].type);
			continue;
		}
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

function load_scripts() {
	segmentLoads.forEach(segment => {
		load_js_file("segments/" + segment + "/" + segment + ".js");
	});
}

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
	for (let index = 0; index < endpoints.views.length; index++) {
		var obj = endpoints.views[index];
		if ( obj.type == "communicator" ) {
			update_communicator(obj, index);
		} else if ( obj.type == "netscan" ) {
			update_netscan(obj, index);
		} else if ( obj.type == "timedate" ) {
			update_timedate(obj, index);
		} else if ( obj.type == "crypto" ) {
			update_crypto(obj, index);
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
function set_stage_buttons(id, canShutdown = false) {
	stageBtns = document.getElementById("stageButtons");
	btnHtml   = '';

	if (canShutdown) {
		btnHtml += "<div class=\"col\">";
		btnHtml += "<button type=\"button\" class=\"btn btn-lg btn-secondary\" onclick=\"execute_shutdown(" + id + ")\"><i class=\"fas fa-power-off\"></i></button>";
		btnHtml += "<p>Shutdown PC</p>";
		btnHtml += "</div>";
	}

	stageBtns.innerHTML = btnHtml;
}

/**
 * Fires off a shutdown pulse command.
 * @param {int} id ID. 
 * @returns
 */
function execute_shutdown(id) {
	canShutdown = (typeof endpoints.views[id].permitShutdown !== 'undefined') ? endpoints.views[id].permitShutdown : false;
	if (canShutdown) {
		auth  = (endpoints.views[id].key !== undefined) ? "?key=" + endpoints.views[id].key : "";
		query = endpoints.views[id].endpoint + auth + "&cmd=shutdown";
		fetch(query)
			.then(response => response.json())
			.then(json => {return true;})
			.catch(err => {return false;});
	} else {
		return false;
	}
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
 *
 * @url https://stackoverflow.com/a/61787359
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
	}
}

/**
 * Toggles cursor visiblity by adding a CSS rule to the body tag.
 */
function toggle_cursor() {
	bigchungus = document.getElementsByTagName('body')[0];

	if ( ! bigchungus.classList.contains("no-cursor") ) {
		bigchungus.classList.add("no-cursor");
	} else {
		bigchungus.classList.remove("no-cursor");
	}
}

// --- Init ---

window.onload = function() {
	fetch('config.json')
		.then(response => response.json())
		.then(json => {
			endpoints = json;
			init();

			var updateLoop = window.setInterval(function(){
				update();
			}, 5000);

			// TODO - Replace with Native JS. In fact replace Bootstrap Carousel, it's always fighting me...
			$('#ysmrrbrrlarbrrrr').on('slide.bs.carousel', function (slide) {
				activeStage = slide.relatedTarget.id.slice(-1);
				canShutdown = (typeof endpoints.views[activeStage].permitShutdown !== 'undefined') ? endpoints.views[activeStage].permitShutdown : false;
				set_stage_buttons(activeStage, canShutdown);
			})
		})
		.catch(err => console.log(err));
	
	window.onkeydown= function(keypress){
		// 67 = (C)ursor.
		if(keypress.keyCode === 67){
			toggle_cursor();
		};
	};
};
