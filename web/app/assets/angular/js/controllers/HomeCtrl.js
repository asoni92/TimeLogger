var HomeCtrl = concurApp.controller('HomeCtrl', [
		'$scope',
		'$rootScope',
		'APIFactory',
		function($scope, $rootScope, APIFactory) {
			$scope.sessionLevels = [];
			$scope.showPieChart = false;
			$scope.showAreaChart = false;
			$scope.getDashboardData = function() {
				var requestObj = {
					timePeriod : 'Week'
				};
				APIFactory.getLoggerData(requestObj).then(
						function(data) {
							var DTTime = 0;
							var IDTIme = 0;
							var MATime = 0;
							var STTime = 0;
							var OTTime = 0;
							if (data != null && data.data != null) {
								angular.forEach(data.data, function(v, k) {
									if (v.type == null || v.type == ''
											|| v.type == 'OT') {
										OTTime = OTTime + parseInt(v.time);
									} else if (v.type == 'DT') {
										DTTime = DTTime + parseInt(v.time);
									} else if (v.type == 'ID') {
										IDTime = IDTime + parseInt(v.time);
									} else if (v.type == 'MA') {
										MATime = MATime + parseInt(v.time);
									} else if (v.type == 'ST') {
										STTime = STTime + parseInt(v.time);
									}
								})

							}
							$scope.data = [ {
								key : "New Development",
								y : DTTime
							}, {
								key : "Incremental Development",
								y : IDTIme
							}, {
								key : "Miscellaneous Activities",
								y : MATime
							}, {
								key : "Sustaining Task",
								y : STTime
							}, {
								key : "Other Task",
								y : OTTime
							} ];
							
							
							$scope.createAreaChartData(data.data);
							$scope.showPieChart = true;
						});
			}
			
			$scope.createAreaChartData = function(data) {
				var otData = [];
				var dtData = [];
				var idData = [];
				var maData = [];
				var stData = [];
				if (data != null) {
					angular.forEach(data, function(v, k) {
						if (v.type == null || v.type == '' || v.type == 'OT') {
							otData.push([parseInt(v.dateCreated) * 1000, parseInt(v.time)])
						} else if (v.type == 'DT') {
							dtData.push([parseInt(v.dateCreated) * 1000, parseInt(v.time)])
						} else if (v.type == 'ID') {
							idData.push([parseInt(v.dateCreated) * 1000, parseInt(v.time)])
						} else if (v.type == 'MA') {
							maData.push([parseInt(v.dateCreated) * 1000, parseInt(v.time)])
						} else if (v.type == 'ST') {
							stData.push([parseInt(v.dateCreated) * 1000, parseInt(v.time)])
						}
					})

				}
				
				$scope.data2 = 	[{"key" : "Other Task" , "values" : otData },
					               {   "key" : "New Development" , "values" : dtData },
//					               {   "key" : "Incremental Development" ,	"values" : idData },
					               {   "key" : "Miscellaneous Activities" , "values" : maData },
					               {   "key" : "Sustaining Task" , "values" : stData }
					           ];
				console.log($scope.data2)
				$scope.showAreaChart = true;
			}

			$scope.getDashboardData();

			$scope.secondsToHMS = function(d) {
				d = Number(d);
				var h = Math.floor(d / 3600);
				var m = Math.floor(d % 3600 / 60);
				var s = Math.floor(d % 3600 % 60);

				var hDisplay = h > 0 ? h + (h == 1 ? " h, " : " h, ") : "";
				var mDisplay = m > 0 ? m + (m == 1 ? " m, " : " m, ") : "";
				var sDisplay = s > 0 ? s + (s == 1 ? " s" : " s") : "";
				return hDisplay + mDisplay + sDisplay;
			}

			$scope.options = {
				chart : {
					type : 'pieChart',
					height : 500,
					x : function(d) {
						return d.key;
					},
					y : function(d) {
						return d.y;
					},
					showLabels : false,
					duration : 500,
					labelThreshold : 0.01,
					labelSunbeamLayout : true,
					tooltip : {
						valueFormatter : function(d, i) {
							return $scope.secondsToHMS(d);
						}
					},
					legend : {
						margin : {
							top : 5,
							right : 35,
							bottom : 5,
							left : 0
						}
					}
				}
			};

			$scope.options2 = {
				chart : {
					type : 'stackedAreaChart',
					height : 450,
					margin : {
						top : 20,
						right : 20,
						bottom : 30,
						left : 40
					},
					x : function(d) {
						return d[0];
					},
					y : function(d) {
						return d[1];
					},
					useVoronoi : false,
					clipEdge : true,
					duration : 100,
					useInteractiveGuideline : true,
					xAxis : {
						showMaxMin : false,
						tickFormat : function(d) {
							return d3.time.format('%x')(new Date(d))
						}
					},
					yAxis : {
						tickFormat : function(d) {
							return d;//d3.format(',.2f')(d);
						}
					},
					zoom : {
						enabled : true,
						scaleExtent : [ 1, 10 ],
						useFixedDomain : false,
						useNiceScale : false,
						horizontalOff : false,
						verticalOff : true,
						unzoomEventType : 'dblclick.zoom'
					}
				}
			};

//			$scope.data2 = [
//			               {
//			                   "key" : "North America" ,
//			                   "values" : [ [ 1505250956000 , 23.041422681023]]
//			               }				  
//
//			           ];
		} ])