/**
 * Deskdash - Raspberry Pi equipment monitor.
 *
 * @author soup-bowl <code@soupbowl.io>
 * @package deskdash
 */

var endpoints; // Loaded with configuration data from config.json, called at the bottom of this file.
var data = []; // Populated with collected data from participants.
var activeStage = 0;

// --- Initalisation segment ---

/**
 * Initialises the stage.
 */
function init() {
	document.getElementById('loading').classList.remove('d-none');
	document.getElementById('stage').innerHTML = '';
	for (let index = 0; index < endpoints.views.length; index++) {
		var first = ( index == 0 ) ? true : false;
		if ( endpoints.views[index].type == "communicator" ) {
			auth  = (endpoints.views[index].key !== undefined) ? "?key=" + endpoints.views[index].key : "";
			query = endpoints.views[index].endpoint + auth;
			fetch(query)
				.then(response => response.json())
				.then(json => {
					load_segment('communicator', index, endpoints.views[index], first, function() { load_new_communicator(index, json); });
				})
				.catch(err => console.log(err));
		} else if ( endpoints.views[index].type == "timedate" ) {
			load_segment('timedate', index, endpoints.views[index], first, null);
		} else if ( endpoints.views[index].type == "helloworld" ) {
			load_segment('helloworld', index, endpoints.views[index], first, null);
		} else {
			console.log("Invalid type: " + endpoints.views[index].type);
			continue;
		}
	}
	document.getElementById('loading').classList.add('d-none');
}

/**
 * Loads a segment into the stage cycles.
 *
 * @param {string}   segment         Name of a HTML file in segments folder. Just the filename, no extension.
 * @param {int}      identifier      Number of the loop. Must not have been already used.
 * @param {*}        settings        The segment-specific portion of the config file.
 * @param {bool}     [first=false]   If this is the first in the loop (will add carousel start code).
 * @param {callback} [callback=null] If provided, this function will be called after the file is loaded.
 */
function load_segment(segment, identifier, settings, first = false, callback = null) {
	activebit  = (first) ? "carousel-item active" : "carousel-item";
	bgcolor    = (settings.background !== null) ? "background-color:" + settings.background + ";" : "";
	bgimagecss = (settings.randomBackground || typeof settings.backgroundUrl === 'string') ? " bgimage" : "";
	bgimg      = (typeof settings.backgroundUrl === 'string') ? "background-image: url('" + settings.backgroundUrl + "');" : "";
	bgimgauto  = (settings.randomBackground) ? "background-image: url('https://source.unsplash.com/daily');" : "";

	file_get_contents("segments/" + segment + ".html").then(page => {
		before = "<div id=\"e" + identifier + "\" class=\"" + activebit + " roulette-item " + bgimagecss + "\" style=\"" + bgcolor + bgimg + bgimgauto + "\">";
		after = "</div>";

		rechanged = before + page.replaceAll('{{CHANGE}}', identifier).replaceAll('{{COLOR}}', settings.background) + after;
		document.getElementById("stage").insertAdjacentHTML('beforeend', rechanged);

		typeof callback === 'function' && callback();
	});
}

/**
 * Loads communicator-related settings and configurations.
 *
 * @param {int}    id             Identifier on the stage. 
 * @param {string} json           JSON API response from the source API. 
 * @param {string} [splitter='•'] Used in the subheading to split-up data segments.
 */
function load_new_communicator(id, json, splitter = '•') {
	splitter = "<span class=\"splitter\">" + splitter + "</span>";
	var segment = document.getElementById("e" + id);
	data[id] = {'series': [ [], [] ]};
	
	syst = json['content']['system'];
	document.getElementById(id + 'machine').innerHTML = syst['hostname'];
	document.getElementById(id + 'spec').innerHTML = syst['operating_system'] + splitter + syst['release'] + splitter + syst['processor'];

	if (json['content']['gpu']['available']) {
		var gpumon = document.getElementById(id + 'graphicSegment');
		data[id].series.push([]);
		gpumon.style.display = null;
	}

	new Chartist.Line('.a'+ id + 'chart', {
		labels: [],
		series: [ [], [], [] ],
	}, {
		fullWidth: true,
		chartPadding: { right: 40 },
		height: 200,
		axisY: {
			high: 100
		},
		axisX: {
			showGrid: false
		}
	});
}

// --- Continuous update segment ---

/**
 * Initiates an update data routine across all the stages.
 */
function update() {
	for (let index = 0; index < endpoints.views.length; index++) {
		var obj = endpoints.views[index];
		if ( obj.type == "communicator" ) {
			auth  = (obj.key !== undefined) ? "?key=" + obj.key : "";
			fetch(obj.endpoint + auth)
				.then(response => response.json())
				.then(json => {
					stat = json['content'];

					if (stat['cpu']['available']) {
						cpu = stat['cpu'];
						document.getElementById(index + 'processorUsage').innerHTML = 'Usage: ' + cpu['cpu_usage']  + '%';

						data[index].series[0].push(cpu['cpu_usage']); if ( data[index].series[0].length > 10 ) { data[index].series[0].shift(); }
					}

					if (stat['ram']['available']) {
						mem = stat['ram'];
						document.getElementById(index + 'memoryUsage').innerHTML = 'Usage: ' + mem['real_memory_usage'] + '%';
						document.getElementById(index + 'swapUsage').innerHTML = 'Swap: ' + mem['swap_memory_usage'] + '%';

						data[index].series[1].push(mem['real_memory_usage']); if ( data[index].series[1].length > 10 ) { data[index].series[1].shift(); }
					}

					if (stat['gpu']['available']) {
						gpu = stat['gpu'];
						document.getElementById(index + 'graphicUsage').innerHTML = 'Usage: ' + gpu['gpu_usage'] + '%';

						data[index].series[2].push(gpu['gpu_usage']); if ( data[index].series[2].length > 10 ) { data[index].series[2].shift(); }

						gputmp = document.getElementById(index + 'graphicTemp');
						gputmp.innerHTML = 'Temp ' + gpu['gpu_temp_now'] + '°C';
						set_temp_badge(gputmp, gpu['gpu_temp_now']);
					}

					chart = document.getElementsByClassName('a' + index + 'chart')[0];
					chart.__chartist__.update({'series': data[index].series});
					document.getElementById('e'+index).getElementsByClassName('connection-lost')[0].classList.add('d-none');
				})
				.catch(err => {
					console.log(err);
					document.getElementById('e'+index).getElementsByClassName('connection-lost')[0].classList.remove('d-none');
				});
		} else if ( obj.type == "timedate" ) {
			var dt = new Date();
			document.getElementById(index + 'time').innerHTML = dt.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit', hour12: true});
			document.getElementById(index + 'date').innerHTML = dt.toLocaleDateString();
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
		btnHtml += "<button type=\"button\" class=\"btn btn-secondary\" onclick=\"execute_shutdown(" + id + ")\"><i class=\"fas fa-power-off\"></i></button>";
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
};
