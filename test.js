var a = angular.module('test', []);

var socket = io();

a.controller('FalconTestCtrl', ['$scope', '$http', '$filter', 
		function($scope, $http, $filter){
	
	// gathering JSON data

	$http.get('publishing.json').success(function(data){
		$scope.publishing = data;
	});
	$http.get('reachdata.json').success(function(data){
		$scope.reachData = data;
		$scope.renderGraph();
	});

	$scope.countries = [
		{key:'134', value: 'Afghanistan'}, 
		{key:'2', value: 'Åland Islands'}, 
		{key:'3', value: 'Albania'}, 
		{key:'4', value: 'Algeria'}, 
		{key:'5', value: 'American Samoa'}, 
		{key:'6', value: 'AndorrA'}, 
		{key:'7', value: 'Angola'}, 
		{key:'8', value: 'Anguilla'}, 
		{key:'9', value: 'Antarctica'}, 
		{key:'10', value: 'Antigua and Barbuda'}, 
		{key:'11', value: 'Argentina'}, 
		{key:'12', value: 'Armenia'}, 
		{key:'13', value: 'Aruba'}, 
		{key:'14', value: 'Australia'}, 
		{key:'15', value: 'Austria'}, 
		{key:'16', value: 'Azerbaijan'}
	];

	$scope.languages = [
		{key:'31', value:"Afrikaans"},
	    {key:'2', value:"Akan"},
	    {key:'3', value:"Albanian"},
	    {key:'4', value:"Amharic"},
	    {key:'5', value:"Arabic"}
	];

	$scope.cities = [
		{key:'1', value:'City 1'},
		{key:'2', value:'City 2'},
		{key:'3', value:'City 3'}
	];

	$scope.regions = [
		{key:'1', value:'Region 1'},
		{key:'2', value:'Region 2'},
		{key:'3', value:'Region 3'}
	];

	$scope.channels = [
		{id:433104606739910, name:'Konfirmanden'},
		{id:252525252525252, name:'Sample Ch'},
		{id:565656565656565, name:'Sample Ch 2'}
	]

	$scope.activeTab = 'publishing';

	// CRUD on items of the publishing data

	$scope.PubNew = function(){
		$scope.pubData = {
			content:{}, tags:[], channels:[], scheduled:new Date(),
			geo: {countries:[], languages:[], cities:[], regions:[]}
		};
		$scope.pubForm = 'new';
	}

	$scope.PubEdit = function(key){
		$scope.pubData = angular.copy($scope.publishing.response[key]);
		$scope.pubData.channels.forEach(function(ch){ console.log(ch)
			ch.id = String(ch.id);
		});
		$scope.pubForm = key;
	}

	$scope.PubDel = function(key){
		if (confirm('Are you sure you want to delete this publishing item?')){
			$scope.publishing.response.splice(key,1);
		}
	}

	$scope.PubFormFormatSelects = function(){
		['countries','languages','cities','regions'].forEach(function(geoItemType){
			$scope.pubData.geo[geoItemType].forEach(function(geoItem){
				$scope[geoItemType].forEach(function(defaultItem){
					if (defaultItem.key===geoItem.key) geoItem.value = defaultItem.value;
				});
			});
		});
		$scope.pubData.channels.forEach(function(chItem){
			$scope.channels.forEach(function(defaultItem){
				if (defaultItem.id===parseInt(chItem.id)) chItem.name = defaultItem.name;
			});
		});
	}

	$scope.PubFormSubmit = function(){
		$scope.PubFormFormatSelects();
		if ($scope.pubForm==='new'){
			// socket for publishing item
			socket.emit('new pub to server', $scope.pubData);

		} else {
			$scope.publishing.response[$scope.pubForm] = $scope.pubData;
		}
		$scope.pubForm = false;
	}

	socket.on('pub return from server', function(data){
		console.log('Publishing item returned from the socket', data);
		$scope.publishing.response.push(data);
		$scope.$apply();
	});






	/* GRAPH - making data */

	$scope.renderGraph = function(){

		var data = [];
		var dateFormat = 'yyyy-MM-dd H:mm';

		document.querySelectorAll(".reach-data .graph")[0].innerHTML = '';

		$scope.reachData.response.forEach(function(rd, kRd){
			if (rd.post_impressions){
				var foundInDates = false;
				data.forEach(function(v, k){
					var dateTemp = $filter('date')(new 
							Date(rd.post_impressions[0].timestamp), dateFormat);
					if (v.time === dateTemp) foundInDates = k;
				})
				if (foundInDates){
					data[foundInDates].natural += 
							parseInt(rd.post_impressions[0].value);
					data[foundInDates].organic += 
							parseInt(rd.post_impressions_organic[0].value);
					data[foundInDates].viral += 
							parseInt(rd.post_impressions_viral[0].value);
					data[foundInDates].paid += 
							parseInt(rd.post_impressions_paid[0].value);
				} else {
					data.push({
						time:$filter('date')(new 
							Date(rd.post_impressions[0].timestamp), dateFormat),
						natural:parseInt(rd.post_impressions[0].value),
						organic:parseInt(rd.post_impressions_organic[0].value),
						viral:parseInt(rd.post_impressions_viral[0].value),
						paid:parseInt(rd.post_impressions_paid[0].value)
					});
				}
			}
		});
		var margin = {top: 20, right: 40, bottom: 30, left: 40},
		    width = 800 - margin.left - margin.right,
		    height = 300 - margin.top - margin.bottom;

		var x = d3.scale.ordinal()
		    .rangeRoundBands([0, width], .1);

		var y = d3.scale.linear()
		    .rangeRound([height, 0]);

		var color = d3.scale.ordinal()
		    .range(["#444", "#888", "#AAA", "#A66"]);

		var xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom");

		var yAxis = d3.svg.axis()
		    .scale(y)
		    .orient("left")
		    .tickFormat(d3.format(".2s"));

		var svg = d3.select(".reach-data .graph").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		color.domain(d3.keys(data[0]).filter(function(key) { 
			return key !== "time"; 
		}));

		data.forEach(function(d) {
			var y0 = 0;
			d.impressions = color.domain().map(function(name) { 
				
				return {name: name, y0: y0, y1: y0 += +d[name]};
			});
			d.total = d.impressions[d.impressions.length - 1].y1;
		});

		data.sort(function(a, b) { return b.time - a.time; });

		x.domain(data.map(function(d) { return d.time; }));
		y.domain([0, d3.max(data, function(d) { return d.total; })]);

		svg.append("g")
		  .attr("class", "x axis")
		  .attr("transform", "translate(0," + height + ")")
		  .call(xAxis);

		svg.append("g")
		  .attr("class", "y axis")
		  .call(yAxis)
		.append("text")
		  .attr("transform", "rotate(-90)")
		  .attr("y", 6)
		  .attr("dy", ".4em")
		  .style("text-anchor", "end")
		  .style("font-size","8px")
		  .text("IMPRESSIONS");

		var state = svg.selectAll(".state")
		  .data(data)
		.enter().append("g")
		  .attr("class", "g")
		  .attr("transform", function(d) { 
		  	return "translate(" + x(d.time) + ",0)"; 
		  });

		state.selectAll("rect")
		  .data(function(d) { return d.impressions; })
		.enter().append("rect")
		  .attr("width", x.rangeBand())
		  .attr("y", function(d) { return y(d.y1); })
		  .attr("height", function(d) { return y(d.y0) - y(d.y1); })
		  .style("fill", function(d) { return color(d.name); });

		var legend = svg.selectAll(".legend")
		  .data(color.domain().slice().reverse())
		.enter().append("g")
		  .attr("class", "legend")
		  .attr("transform", function(d, i) { 
		  	return "translate(42," + i * 20 + ")"; 
		  });

		legend.append("rect")
		  .attr("x", width - 18)
		  .attr("width", 18)
		  .attr("height", 18)
		  .style("fill", color);

		legend.append("text")
		  .attr("x", width - 24)
		  .attr("y", 9)
		  .attr("dy", ".35em")
		  .style("text-anchor", "end")
		  .text(function(d) { return d; });

	}

	// adding data points to the graph
	// socket for updating the graph
	$scope.ReachDataAdd = function(){

		var newRDFormatted = {
			post_impressions:[{
				value:$scope.newReachData.post_impressions, 
				timestamp:new Date()
			}],
			post_impressions_organic:[{
				value:$scope.newReachData.post_impressions_organic, 
				timestamp:new Date()
			}],
			post_impressions_viral:[{
				value:$scope.newReachData.post_impressions_viral, 
				timestamp:new Date()
			}],
			post_impressions_paid:[{
				value:$scope.newReachData.post_impressions_paid, 
				timestamp:new Date()
			}],
		}

		socket.emit('new reach to server', newRDFormatted);

		$scope.newReachData = {
			post_impressions:'',
			post_impressions_organic:'',
			post_impressions_viral:'',
			post_impressions_paid:'',
		};

	}

	socket.on('reach return from server', function(data){
		console.log('Reach data item returned from the socket', data);

		$scope.reachData.response.push(data);
		$scope.renderGraph();
	});

}]);

a.directive('closablePopUp',function(){
	return {
		restrict:'A',
		link: function(scope, el, attr){
			el.on('click', function(ev){
				if (this===ev.target){
					if (attr.ngShow){
						scope.pubForm = false;
						scope.$apply();
					}
				}
			});
		}
	}
});