var endpoints = { 70: {'id': 70, 'endpoint': 'http://localhost:43594/'} };
var data      = { 70: {'series': [ [], [], [] ]} };

function init() {
	for (let key in endpoints) {
		var obj = endpoints[key];
		fetch(obj.endpoint)
			.then(response => response.json())
			.then(json => {
				file_get_contents("segments/communicator.html").then(page => {
					rechanged = page.replaceAll('{{CHANGE}}', key);
					document.getElementById("stage").innerHTML = rechanged;

					load_new(obj, json);
				});
			})
			.catch(err => console.log(err));
	}
}

function load_new(obj, json) {
	var segment = document.getElementById(obj.id);
	//data[key]['series'] = [ [], [] ];
	
	syst = json['content']['system'];
	document.getElementById(obj.id + 'machine').innerHTML = syst['hostname'];
	document.getElementById(obj.id + 'spec').innerHTML = syst['operating_system'] + ' ■ ' + syst['release'] + ' ■ ' + syst['processor'];

	if (json['content']['gpu']['available']) {
		var gpumon = document.getElementById(obj.id + 'graphicSegment');
		gpumon.style.display = null;
	}

	new Chartist.Line('.a'+ obj.id + 'chart', {
		labels: [],
		series: [ [], [], [] ],
	}, {
		fullWidth: true,
		chartPadding: { right: 40 },
		height: 200
	});

	segment.style.display = null;
}

function update() {
	for (let key in endpoints) {
		var obj = endpoints[key];
		fetch(obj.endpoint)
			.then(response => response.json())
			.then(json => {
				stat = json['content'];
				cpu = stat['cpu']['cpu_usage'];
				gpu = stat['gpu']['gpu_usage'];
				mem = stat['ram']['real_memory_usage'];

				document.getElementById(obj.id + 'processorUsage').innerHTML = cpu  + '%';
				document.getElementById(obj.id + 'memoryUsage').innerHTML = mem + '%';
				document.getElementById(obj.id + 'swapUsage').innerHTML = stat['ram']['swap_memory_usage'] + '%';
				document.getElementById(obj.id + 'graphicUsage').innerHTML = gpu + '%';

				data[key].series[0].push(cpu); if ( data[key].series[0].length > 10 ) { data[key].series[0].shift(); }
				data[key].series[1].push(mem); if ( data[key].series[1].length > 10 ) { data[key].series[1].shift(); }
				data[key].series[2].push(gpu); if ( data[key].series[2].length > 10 ) { data[key].series[2].shift(); }

				chart = document.getElementsByClassName('a' + key + 'chart')[0];
				chart.__chartist__.update({'series': data[key].series});

				gputmp = document.getElementById(obj.id + 'graphicTemp');
				tmpred = stat['gpu']['gpu_temp_now'];
				gputmp.innerHTML = tmpred + '°C';
				set_temp_badge(gputmp, tmpred);
				
			})
			.catch(err => console.log(err));
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

window.onload = function() {
	init();

	var updateLoop = window.setInterval(function(){
		update();
	}, 5000);
};
