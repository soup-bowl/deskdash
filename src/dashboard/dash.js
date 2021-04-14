var endpoints = { 70: {'id': 70, 'endpoint': 'http://localhost:43594/'} };
var data      = {70: []};

function init() {
	for (let key in endpoints) {
		var obj = endpoints[key];
		fetch(obj.endpoint)
			.then(response => response.json())
			.then(json => {
				var segment = document.getElementById(obj.id);
				
				syst = json['content']['system'];
				document.getElementById(obj.id + 'machine').innerHTML = syst['hostname'];
				document.getElementById(obj.id + 'spec').innerHTML = syst['operating_system'] + ' ■ ' + syst['release'] + ' ■ ' + syst['processor'];

				segment.style.display = null;
			})
			.catch(err => null);
	}
}

function update() {
	for (let key in endpoints) {
		var obj = endpoints[key];
		fetch(obj.endpoint)
			.then(response => response.json())
			.then(json => {
				stat = json['content'];
				document.getElementById(obj.id + 'processorUsage').innerHTML = stat['cpu']['cpu_usage']  + '%';
				document.getElementById(obj.id + 'memoryUsage').innerHTML = stat['ram']['real_memory_usage'] + '%';
				document.getElementById(obj.id + 'graphicTemp').innerHTML = stat['gpu']['gpu_temp_now'] + '°C';
			})
			.catch(err => null);
	}
}

window.onload = function() {
	init();

	var updateLoop = window.setInterval(function(){
		update();
	}, 5000);
};
