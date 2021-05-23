/**
 * Updates the time and date segment.
 *
 * @param {object} obj   The subset of the main configuration file relating to this entity.
 * @param {int}    index The numerical indicator of the stage part.
 */
function update_timedate(obj, index) {
	var dt = new Date();
	document.getElementById(index + 'time').innerHTML = dt.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit', hour12: true});
	document.getElementById(index + 'date').innerHTML = dt.toLocaleDateString();
}
