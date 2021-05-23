/**
 * Updates the communicator segment with data harvested from the {@link https://github.com/soup-bowl/deskdash-communicator|Communciator} Python API.
 *
 * @param {object} obj   The subset of the main configuration file relating to this entity.
 * @param {int}    index The numerical indicator of the stage part.
 */
function update_communicator(obj, index) {
	let gLimit  = (obj.limit !== undefined) ? Number(obj.limit) : 10; 
	let gHeight = (obj.graphHeight !== undefined) ? Number(obj.graphHeight) : 200;
	auth        = (obj.key !== undefined) ? "?key=" + obj.key : "";
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

			document.getElementById('e'+index).getElementsByClassName('connection-lost')[0].classList.add('d-none');

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
			console.log(err);
			document.getElementById('e'+index).getElementsByClassName('connection-lost')[0].classList.remove('d-none');
		});
}