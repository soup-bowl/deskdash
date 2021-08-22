/**
 * Deskdash - Raspberry Pi equipment monitor.
 *
 * @author soup-bowl <code@soupbowl.io>
 * @package deskdash
 */

/**
 * Updates the communicator segment with data harvested from the {@link https://github.com/soup-bowl/deskdash-communicator|Communciator} Python API.
 *
 * @param {object} obj   The subset of the main configuration file relating to this entity.
 * @param {int}    index The numerical indicator of the stage part.
 */
function update_communicator(obj, index) {
	// If this is the start, create the slots.
	if (data[index] === undefined) {
		data[index] = {'series': [ [], [] ], 'errors': 0};
	}

	// Don't continue if this has been unstaged.
	if (!is_stage_enabled(index)) {
		return;
	}

	let gLimit  = (obj.limit !== undefined) ? Number(obj.limit) : 10; 
	let gHeight = (obj.graphHeight !== undefined) ? Number(obj.graphHeight) : 200;
	auth        = (obj.key !== undefined) ? "?key=" + obj.key : "";
	fetch(obj.endpoint + auth)
		.then(response => response.json())
		.then(json => {
			stat = json['content'];
			data[index].errors = 0;

			// GPU tracking? Add a slot for it.
			if (stat['gpu']['available']) {
				data[index].series.push([]);
			}

			// Set the header to the name of the machine.
			document.getElementById(index + 'machine').innerHTML = stat['system']['hostname'];

			// Next segments check for the API containing the relevant HW outputs, then changes their table data.
			// Each if also updates the table data with the latest output.
			if (stat['cpu']['available']) {
				cpu = stat['cpu'];
				document.getElementById(index + 'processorUsage').innerHTML = 'Usage: ' + cpu['cpu_usage']  + '%';

				data[index].series[0].push(cpu['cpu_usage']); if ( data[index].series[0].length > gLimit ) { data[index].series[0].shift(); }
			}

			if (stat['ram']['available']) {
				mem = stat['ram'];
				document.getElementById(index + 'memoryName').innerHTML = humanize_size(mem['real_memory_size']) + ' RAM';
				document.getElementById(index + 'memoryUsage').innerHTML = 'Usage: ' + mem['real_memory_usage'] + '%';
				document.getElementById(index + 'swapUsage').innerHTML = 'Swap: ' + mem['swap_memory_usage'] + '%';

				data[index].series[1].push(mem['real_memory_usage']); if ( data[index].series[1].length > gLimit ) { data[index].series[1].shift(); }
			}

			var gpumon = document.getElementById(index + 'graphicSegment');
			if (stat['gpu']['available']) {
				gpumon.style.display = null;

				gpu = stat['gpu'];
				document.getElementById(index + 'graphicName').innerHTML = gpu['gpu_name'];
				document.getElementById(index + 'graphicUsage').innerHTML = 'Usage: ' + gpu['gpu_usage'] + '%';

				data[index].series[2].push(gpu['gpu_usage']); if ( data[index].series[2].length > gLimit ) { data[index].series[2].shift(); }

				gputmp = document.getElementById(index + 'graphicTemp');
				gputmp.innerHTML = 'Temp ' + gpu['gpu_temp_now'] + '°C';
				set_temp_badge(gputmp, gpu['gpu_temp_now']);
			} else {
				gpumon.style.display = 'none';
			}

			document.getElementById(index + 'connectStat').classList.add('d-none');

			if(is_visible(index)) {
				// No chart? Create one. If the chart exists, replace the data with the latest collection.
				chart = document.getElementsByClassName('a' + index + 'chart');
				if(chart[0].__chartist__ === undefined) {
					new Chartist.Line('.a'+ index + 'chart', {
						labels: [],
						series: [ [], [], [] ],
					}, {
						fullWidth: true,
						chartPadding: { right: 40 },
						height: gHeight,
						axisY: {
							high: 100
						},
						axisX: {
							showGrid: false
						}
					});
				} else {
					chart[0].__chartist__.update({'series': data[index].series});
				}
			}
		})
		.catch(err => {
			document.getElementById(index + 'connectStat').classList.remove('d-none');
			data[index].errors++;

			if (data[index].errors > 5) {
				console.log('5 counts of URL errors on stage ' + index + '. Dropping stage.');
				toggle_stage(index);
				data[index].errors = 0;
			}
		});
}

/**
 * Sets the slide-specific action buttons.
 *
 * @param {object} obj   The subset of the main configuration file relating to this entity.
 * @param {int}    index The numerical indicator of the stage part.
 */
function buttons_communicator(obj, id) {
	auth = (obj.key !== undefined) ? "?key=" + obj.key : "";
	console.log(obj.endpoint + auth + "&cmd=ls");
	fetch(obj.endpoint + auth + "&cmd=ls")
		.then(response => response.json())
		.then(json => {
			let btns = [];

			for (const [key, value] of Object.entries(json.content)) {
				btns.push({
					name: key,
					icon: value["bi-icon"]
				});
			}

			set_stage_buttons(id, btns);
	});
}
