concurApp.directive('totime', function() {
      return {
        require: '?ngModel',
        link: function(scope, element, attrs, ngModelCtrl) {
          if(!ngModelCtrl) {
            return; 
          }
          ngModelCtrl.$formatters.push(function(value){
            if(value == null || value == '') {
              return '';
            }
            var hours = new Date(value).getHours();
            var minutes = new Date(value).getMinutes();
            var ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0' + minutes : minutes;
            var strTime = hours + ':' + minutes + ' ' + ampm;
            return strTime;
          });
          ngModelCtrl.$parsers.push(function(value) {
            if(value == null || value == '') {
              return '';
            }
            var hours = new Date(value).getHours();
            var minutes = new Date(value).getMinutes();
            var ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0' + minutes : minutes;
            var strTime = hours + ':' + minutes + ' ' + ampm;
            return strTime;
          });
        }
    };
});
concurApp.directive('logout', function($state) {
	return function(scope, element, attrs) {
		element.bind("click", function(event) {
			event.preventDefault();
			$state.go('logout');
		});
	};
});
concurApp.directive('ngEnter', function() {
	return function(scope, element, attrs) {
		element.bind('keydown keypress', function(event) {
			if (event.which === 13) {
				scope.$apply(function() {
					scope.$eval(attrs.ngEnter, {
						$event : event
					});
				});
				event.preventDefault();
			}
		});
	};
});
concurApp.directive('disableKey', function() {
	return function(scope, element, attrs) {
		element.bind("keydown keypress", function(event) {
			event.preventDefault();
		});
	};
});