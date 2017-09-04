concurApp.directive('calDirctive', function(authFctry) {
  return {
    restrict: 'E',
    transclude: 'true',
    template: '<div id="calendar"></div>'
    ,
    link: function(scope, element, attr){
    	authFctry.calData(function(data){
    		$('#calendar').fullCalendar({
    			now: '2015-08-07',
    			editable: true,
				aspectRatio: 1.8,
				scrollTime: '00:00',
				header: {
					left: 'today prev,next',
					center: 'title',
					right: 'timelineDay,timelineThreeDays,agendaWeek,month'
				},
				defaultView: 'timelineDay',
				views: {
					timelineThreeDays: {
						type: 'timeline',
						duration: { days: 3 }
					}
				},
				resourceColumns: [
					{
		
						labelText: 'Product (Edition)',
						field: 'product'
					},
					{
					
						labelText: 'Room',
						field: 'title'
					},
					{
						labelText: 'Table',
						field: 'table'
					}
				],
				//resources:data.resources,
				//events: data.events
				resources:data.resources,
				events:data.events
    		});
    	})
    	}
  	};
});