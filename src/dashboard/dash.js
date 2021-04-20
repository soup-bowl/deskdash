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
			await load_segment('communicator', index, endpoints.views[index], null);
		} else if ( endpoints.views[index].type == "timedate" ) {
			await load_segment('timedate', index, endpoints.views[index], null);
		} else if ( endpoints.views[index].type == "helloworld" ) {
			await load_segment('helloworld', index, endpoints.views[index], null);
		} else if( endpoints.views[index].type == "netscan" ) {
			await load_segment('netscan', index, endpoints.views[index], null);
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
			auth  = (obj.key !== undefined) ? "?key=" + obj.key : "";
			fetch(obj.endpoint + auth)
				.then(response => response.json())
				.then(json => {
					stat = json['content'];
					
					if (data[index] === undefined) {
						data[index] = {'series': [ [], [] ]};
						if (stat['gpu']['available']) {
							data[index].series.push([]);
						}
					}

					document.getElementById(index + 'machine').innerHTML = stat['system']['hostname'];

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
		} else if ( obj.type == "netscan" ) {
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
						hostname = (content.hostname === content.ip) ? '<span class="text-muted">N/A</span>' : content.hostname;
						holder.insertAdjacentHTML('beforeend', "<tr><td><span class=\"badge "+button_col+" badge-pill\">&nbsp;</span></td><td>"+hostname+"</td><td>"+content.ip+"</td></tr>");
					}
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
