var endpoints;
var data = [];
var currentWindow = -1;

function init() {
	document.getElementById('loading').style.display = null;
	document.getElementById('stage').innerHTML = '';
	for (let index = 0; index < endpoints.views.length; index++) {
		var obj = endpoints.views[index];
		if ( obj.type == "communicator" ) {
			fetch(obj.endpoint)
				.then(response => response.json())
				.then(json => {
					file_get_contents("segments/communicator.html").then(page => {
						rechanged = page.replaceAll('{{CHANGE}}', index);
						document.getElementById("stage").insertAdjacentHTML('beforeend', rechanged);

						load_new_communicator(index, json);
					});
				})
				.catch(err => console.log(err));
		} else if ( obj.type == "helloworld" ) {
			file_get_contents("segments/helloworld.html").then(page => {
				rechanged = page.replaceAll('{{CHANGE}}', index);
				document.getElementById("stage").insertAdjacentHTML('beforeend', rechanged);
			});
		} else {
			console.log("Invalid type: " + obj.type);
			continue;
		}
	}
	document.getElementById('loading').style.display = 'none';
}

function load_new_communicator(id, json) {
	var segment = document.getElementById(id);
	data[id] = {'series': [ [], [] ]};
	
	syst = json['content']['system'];
	document.getElementById(id + 'machine').innerHTML = syst['hostname'];
	document.getElementById(id + 'spec').innerHTML = syst['operating_system'] + ' ■ ' + syst['release'] + ' ■ ' + syst['processor'];

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

function update() {
	for (let index = 0; index < endpoints.views.length; index++) {
		var obj = endpoints.views[index];
		if ( obj.type == "communicator" ) {
			fetch(obj.endpoint)
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
				})
				.catch(err => console.log(err));
		} else {
			continue;
		}
	}
}

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

// https://stackoverflow.com/a/61787359
async function file_get_contents(uri, callback) {
    let res = await fetch(uri),
        ret = await res.text(); 
    return callback ? callback(ret) : ret;
}

function change_carousel() {
	availableWindows = document.getElementById("stage").querySelectorAll("#stage>div").length;
	currentWindow++;
	
	if ( currentWindow >= availableWindows ) {
		currentWindow = 0;
	}

	for (let index = 0; index < availableWindows; index++) {
		if (index == currentWindow) {
			document.getElementById(index).style.display = null;
		} else {
			document.getElementById(index).style.display = 'none';
		}
	}
}

window.onload = function() {
	fetch('config.json')
		.then(response => response.json())
		.then(json => {
			endpoints = json;
			init();

			var updateLoop = window.setInterval(function(){
				update();
			}, 5000);

			var carousel = window.setInterval(change_carousel, endpoints.speed);
		})
		.catch(err => console.log(err));
};
