/**
 * Deskdash - Raspberry Pi equipment monitor.
 *
 * @author soup-bowl <code@soupbowl.io>
 * @package deskdash
 */

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
	if(!is_visible(index)) { return; }
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

				// Generate X-axis labels.
				if (data[index].labels === undefined) {
					var axis_x = [];
					for (let j = 0; j < data[index].series[i].length; j++) {
						if (j === 0) {
							axis_x.push('Now');
						} else {
							var unit = '';
							if (track_interval === 'hourly') {
								unit = 'hr';
							} else if (track_interval === 'monthly') {
								unit = 'mn';
							} else if (track_interval === 'yearly') {
								unit = 'yr';
							}

							axis_x.push('+' + j + ' ' + unit);
						}
					}
					axis_x.reverse();
					data[index].labels = axis_x;
				}

				// No chart? Create one. If the chart exists, replace the data with the latest collection.
				graph_height = (obj.graphHeights === undefined) ? '200' : obj.graphHeights;
				chart = document.getElementsByClassName(idname);
				if(chart[0].__chartist__ === undefined) {
					new Chartist.Line('.' + idname, {
						labels: data[index].labels,
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
					chart[0].__chartist__.update({
						'labels': data[index].labels,
						'series': [data[index].series[i]]
					});
				}

				document.getElementById(index + 'connectStat').classList.add('d-none');
			})
			.catch(err => {
				document.getElementById(index + 'connectStat').classList.remove('d-none');
			});
	}
}