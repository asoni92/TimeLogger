module.exports = {
	getMinuteDifferenceBetweenDates : function(startDate, endDate) {
		try {
			var diff = (endDate.getTime() - startDate.getTime()) / 1000;
			diff /= 60;
			return Math.abs(Math.round(diff));
		} catch(ex) {
			return null;
		}	
	}
};