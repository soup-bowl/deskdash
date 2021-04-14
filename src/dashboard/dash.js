var endpoints = { 70: {'id': 70, 'endpoint': 'http://localhost:43594/'} };
var data      = { 70: {'series': [ [], [] ]} };

function init() {
	for (let key in endpoints) {
		var obj = endpoints[key];
		fetch(obj.endpoint)
			.then(response => response.json())
			.then(json => {
				var segment = document.getElementById(obj.id);
				//data[key]['series'] = [ [], [] ];
				
				syst = json['content']['system'];
				document.getElementById(obj.id + 'machine').innerHTML = syst['hostname'];
				document.getElementById(obj.id + 'spec').innerHTML = syst['operating_system'] + ' ■ ' + syst['release'] + ' ■ ' + syst['processor'];

				new Chartist.Line('.a'+ obj.id + 'chart', {
					labels: [],
					series: [ [], [] ],
				}, {
					fullWidth: true,
					chartPadding: { right: 40 },
					height: 200
				});

				segment.style.display = null;
			})
			.catch(err => console.log(err));
	}
}

function update() {
	for (let key in endpoints) {
		var obj = endpoints[key];
		fetch(obj.endpoint)
			.then(response => response.json())
			.then(json => {
				stat = json['content'];
				cpu = stat['cpu']['cpu_usage'];
				mem = stat['ram']['real_memory_usage'];

				document.getElementById(obj.id + 'processorUsage').innerHTML = cpu  + '%';
				document.getElementById(obj.id + 'memoryUsage').innerHTML = mem + '%';
				document.getElementById(obj.id + 'graphicTemp').innerHTML = stat['gpu']['gpu_temp_now'] + '°C';

				data[key].series[0].push(cpu); if ( data[key].series[0].length > 10 ) { data[key].series[0].shift(); }
				data[key].series[1].push(mem); if ( data[key].series[1].length > 10 ) { data[key].series[1].shift(); }

				chart = document.getElementsByClassName('a' + key + 'chart')[0];
				chart.__chartist__.update({'series': data[key].series});
			})
			.catch(err => console.log(err));
	}
}

window.onload = function() {
	init();

	var updateLoop = window.setInterval(function(){
		update();
	}, 5000);
};
