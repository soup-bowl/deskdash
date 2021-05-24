/**
 * Deskdash - Raspberry Pi equipment monitor.
 *
 * @author soup-bowl <code@soupbowl.io>
 * @package deskdash
 */

/**
 * Updates the time and date segment.
 *
 * @param {object} obj   The subset of the main configuration file relating to this entity.
 * @param {int}    index The numerical indicator of the stage part.
 */
function update_timedate(obj, index) {
	var military = (obj.military !== undefined) ? Boolean(obj.military) : false;
	var dt       = dayjs();

	document.getElementById(index + 'time').innerHTML = (military) ? dt.format('H:mm') : dt.format('h:mm a');
	document.getElementById(index + 'date').innerHTML = dt.format('DD/MM/YYYY');
}
