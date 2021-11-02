/**
 * Deskdash - Raspberry Pi equipment monitor.
 *
 * @author soup-bowl <code@soupbowl.io>
 * @package deskdash
 */

/**
 * Updates the countdown segment.
 *
 * @param {object} obj   The subset of the main configuration file relating to this entity.
 * @param {int}    index The numerical indicator of the stage part.
 */
 function update_countdown(obj, index) {
	var counter   = (obj.time !== undefined) ? parseInt(obj.time) : 0;
	var reason    = (obj.reason !== undefined) ? obj.reason : false;
	var date_to   = new Date(counter);
	var date_now  = new Date();
	var diff_days = Math.ceil( Math.abs(date_to - date_now) / (1000 * 60 * 60 * 24) );

	lbl_reason = 'days to go';
	if ( reason !== false ) {
		lbl_reason = 'days until ' + reason;
	}

	document.getElementById(index + 'counter').innerHTML = diff_days;
	document.getElementById(index + 'reason').innerHTML  = lbl_reason;
}
