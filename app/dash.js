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
async function init() {
	document.getElementById('loading').classList.remove('d-none');
	document.getElementById('stage').innerHTML = '';
	
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
		file_get_contents("segments/" + segment + ".html").then(page => {
			rechanged = page.replaceAll('{{CHANGE}}', identifier);
			document.getElementById("e"+identifier).innerHTML = rechanged;
		});

		resolve();
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
			update_communicator(obj, index);
		} else if ( obj.type == "netscan" ) {
			update_netscan(obj, index);
		} else if ( obj.type == "timedate" ) {
			var dt = new Date();
			document.getElementById(index + 'time').innerHTML = dt.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit', hour12: true});
			document.getElementById(index + 'date').innerHTML = dt.toLocaleDateString();
		} else if ( obj.type == "crypto" ) {
			update_crypto(obj, index);
		} else {
			continue;
		}
	}
}

/**
 * Updates the communicator segment with data harvested from the Communicator Python API.
 *
 * @param {object} obj   The subset of the main configuration file relating to this entity.
 * @param {int}    index The numerical indicator of the stage part.
 */
function update_communicator(obj, index) {
	auth  = (obj.key !== undefined) ? "?key=" + obj.key : "";
	fetch(obj.endpoint + auth)
		.then(response => response.json())
		.then(json => {
			stat = json['content'];

			// If this is the start, create the slots in the data storage for our graph.
			if (data[index] === undefined) {
				data[index] = {'series': [ [], [] ]};
				if (stat['gpu']['available']) {
					data[index].series.push([]);
				}
			}

			// Set the header to the name of the machine.
			document.getElementById(index + 'machine').innerHTML = stat['system']['hostname'];

			// Next segments check for the API containing the relevant HW outputs, then changes their table data.
			// Each if also updates the table data with the latest output.
			if (stat['cpu']['available']) {
				cpu = stat['cpu'];
				document.getElementById(index + 'processorUsage').innerHTML = 'Usage: ' + cpu['cpu_usage']  + '%';

				data[index].series[0].push(cpu['cpu_usage']); if ( data[index].series[0].length > 10 ) { data[index].series[0].shift(); }
			}

			if (stat['ram']['available']) {
				mem = stat['ram'];
				document.getElementById(index + 'memoryName').innerHTML = humanize_size(mem['real_memory_size']) + ' RAM';
				document.getElementById(index + 'memoryUsage').innerHTML = 'Usage: ' + mem['real_memory_usage'] + '%';
				document.getElementById(index + 'swapUsage').innerHTML = 'Swap: ' + mem['swap_memory_usage'] + '%';

				data[index].series[1].push(mem['real_memory_usage']); if ( data[index].series[1].length > 10 ) { data[index].series[1].shift(); }
			}

			var gpumon = document.getElementById(index + 'graphicSegment');
			if (stat['gpu']['available']) {
				gpumon.style.display = null;

				gpu = stat['gpu'];
				document.getElementById(index + 'graphicName').innerHTML = gpu['gpu_name'];
				document.getElementById(index + 'graphicUsage').innerHTML = 'Usage: ' + gpu['gpu_usage'] + '%';

				data[index].series[2].push(gpu['gpu_usage']); if ( data[index].series[2].length > 10 ) { data[index].series[2].shift(); }

				gputmp = document.getElementById(index + 'graphicTemp');
				gputmp.innerHTML = 'Temp ' + gpu['gpu_temp_now'] + '°C';
				set_temp_badge(gputmp, gpu['gpu_temp_now']);
			} else {
				gpumon.style.display = 'none';
			}

			// No chart? Create one. If the chart exists, replace the data with the latest collection.
			chart = document.getElementsByClassName('a' + index + 'chart');
			if(chart[0].__chartist__ === undefined) {
				new Chartist.Line('.a'+ index + 'chart', {
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
			} else {
				chart[0].__chartist__.update({'series': data[index].series});
				document.getElementById('e'+index).getElementsByClassName('connection-lost')[0].classList.add('d-none');
			}
		})
		.catch(err => {
			console.log(err);
			document.getElementById('e'+index).getElementsByClassName('connection-lost')[0].classList.remove('d-none');
		});
}

/**
 * Updates the network scanner segment with data harvested from the Communicator Python API.
 *
 * @param {object} obj   The subset of the main configuration file relating to this entity.
 * @param {int}    index The numerical indicator of the stage part.
 */
function update_netscan(obj, index) {
	auth  = (obj.key !== undefined) ? "?key=" + obj.key : "";
	fetch(obj.endpoint + auth + "&networkscan=yes")
		.then(response => response.json())
		.then(json => {
			if (json['success'] == false) {
				return null;
			}

			if (data[index] === undefined) {
				data[index] = json.content;
			}

			for (i = 1; i < 255; i++) {
				if (json.content[i] === undefined && data[index][i] === undefined) {
					continue;
				} else if (json.content[i] === undefined && typeof data[index][i] === "object") {
					data[index][i].status = "down";
				} else if (json.content[i].status === "up" && (data[index][i] === undefined || (typeof data[index][i] === "object" && data[index][i].status === "down"))) {
					data[index][i] = json.content[i];
				} else {
					continue;
				}
			}

			holder = document.getElementById(index+"netlist");
			holder.innerHTML = "";
			for (x in data[index]) {
				content = data[index][x];
				button_col = (content.status === "up") ? 'badge-success' : 'badge-danger';
				button_lbl = (content.status === "up") ? 'up' : 'down';
				hostname = (content.hostname === content.ip) ? '<span class="text-muted">N/A</span>' : content.hostname;
				holder.insertAdjacentHTML('beforeend', "<tr><td><span class=\"badge "+button_col+" badge-pill\">"+button_lbl+"</span></td><td>"+hostname+"</td><td>"+content.ip+"</td></tr>");
			}
		});
}

/**
 * Updates the display page with information from the CoinGecko free cryptocurrency API.
 *
 * @param {object} obj   The subset of the main configuration file relating to this entity.
 * @param {int}    index The numerical indicator of the stage part.
 */
function update_crypto(obj, index) {
	// If this is the start, create the slots in the data storage for our graph.
	if (data[index] === undefined) {
		data[index] = {'series': [], 'trackids': []};
		for (let i = 0; i < obj.track.length; i++) {
			data[index].series.push([]);
		}
	}

	// Check if the data array already knows the API identifiers for the track specificiations.
	/*if (data[index].trackids === undefined || data[index].trackids.length === 0) {
		fetch('https://api.coingecko.com/api/v3/coins/list')
			.then(response => response.json())
			.then(json => {
				json.forEach(coin => {
					if( coin['symbol'].match(obj.track) ) {
						data[index].trackids.push(coin['id']);
					}
				});
			});
	}*/

	// Grab historical pricing data for each of our coins.
	track_currency = (obj.currency === undefined) ? 'usd' : obj.currency;
	track_days     = (obj.days === undefined) ? 1 : obj.days;
	track_interval = (obj.interval === undefined) ? 'hourly' : obj.interval;
	for (let i = 0; i < obj.track.length; i++) {
		fetch('https://api.coingecko.com/api/v3/coins/' + obj.track[i] + '/market_chart?vs_currency=' + track_currency + '&days=' + track_days + '&interval=' + track_interval)
			.then(response => response.json())
			.then(json => {
				var obj = endpoints.views[index];

				data[index].series[i] = [];
				json['prices'].forEach(interval => {
					data[index].series[i].push(interval[1]);
				});

				idname  = 'crypto' + index + 'point' + i;
				coinbox = document.getElementById(idname);
				if (!coinbox) {
					area = document.getElementById(index + 'charts');

					title = document.createElement('h2');
					title.innerHTML = obj.titles[i];

					box           = document.createElement('div');
					box.id        = idname;
					box.className = idname + ' cryto-graph ' + obj.track[i];

					area.appendChild(title);
					area.appendChild(box);
				}

				// No chart? Create one. If the chart exists, replace the data with the latest collection.
				graph_height = (obj.graphHeights === undefined) ? '200' : obj.graphHeights;
				chart = document.getElementsByClassName(idname);
				if(chart[0].__chartist__ === undefined) {
					new Chartist.Line('.' + idname, {
						labels: [],
						series: [data[index].series[i]],
					}, {
						fullWidth: true,
						chartPadding: { right: 40 },
						height: graph_height,
						axisX: {
							showGrid: false
						}
					});
				} else {
					chart[0].__chartist__.update({'series': [data[index].series[i]]});
				}

				document.getElementById('e'+index).getElementsByClassName('connection-lost')[0].classList.add('d-none');
			})
			.catch(err => {
				console.log(err);
				document.getElementById('e'+index).getElementsByClassName('connection-lost')[0].classList.remove('d-none');
			});
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
	if ( index === activeStage ) {
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
};
