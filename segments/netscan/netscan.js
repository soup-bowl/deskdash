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