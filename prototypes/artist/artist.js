$(document).ready(function(){

    $(function() {

    	var artistName = function(result){
    		var data = [];
    		for (i in result){
    			data.push(result[i]['name']);
    		}	

    		$( "#artist" ).autocomplete({
            minLength: 2,
            source: data,
            focus: function( event, ui ) {
                $( "#artist" ).val( ui.item.value );
                return false;
            },
            select: function( event, ui ) {
                $( "#artist" ).val( ui.item.value );
                var artist_name = $( "#artist" ).val();
                //clear previous barchart first
                d3.select("svg")
       				.remove();
                //get barchart data based on selected name and draw d3 barchant
                query_db("select count(*), strftime('%Y', date) as year from EVENTS a join "+
                       "ARTISTS b on (a.headliner) = (b.name) "+
                       "where (b.name) = '" + artist_name + "' group by year", renderChart);
                return false;
            }
	        })
	        .data( "autocomplete" )._renderItem = function( ul, item ) {
	            return $( "<li>" )
	                .data( "item.autocomplete", item )
	                .append( "<a>" + item.value + "</a>" )
	                .appendTo( ul );
	        };
    	}

    	query_db("select name from ARTISTS", artistName);

    });
    
	function renderChart(result) {
		var data = [];
		var start=1960, end=2012;
		for(var k=start;k<=end;k++){
			data.push({"year":k, "events":0});
		}
		//console.log(data);
		for(var j in data){
			for (i in result){
				//data.push({"year":result[i]['year'], "events":result[i]['count(*)']});
				if(data[j]['year']==result[i]['year']) data[j]['events']=result[i]['count(*)'];
			}
		}
		//console.log(data);

		var margin = {top: 20, right: 5, bottom: 30, left: 5},
			width = 960 - margin.left - margin.right,
		    height = 200 - margin.top - margin.bottom;

		//var formatPercent = d3.format(".0%");

		var x = d3.scale.ordinal()
		    .rangeRoundBands([0, width], .1);

		var y = d3.scale.linear()
		    .range([height, 0]);

		var xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom");

		var svg = d3.select("#chart").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		  x.domain(data.map(function(d) { return d.year; }));
		  y.domain([0, d3.max(data, function(d) { return d.events; })]);

		var xaxis =  svg.append("g")
		      .attr("class", "x axis")
		      .attr("transform", "translate(0," + height + ")")
		      .call(xAxis)
		      .attr('stroke', 'none')
			  .attr('fill', 'black')
			  //.attr("dx", "-1.35em") // vertical-align: middle
			  //.attr("transform", "rotate(270,0,0)translate(-"+height+",0)")
			  .attr('text-anchor', 'end');
		xaxis.selectAll("text")
			  .attr("transform", function(d) {return "rotate(-45,0,0)";})
			  .attr('text-anchor', 'end');

		svg.selectAll(".bar")
		      .data(data)
		    .enter().append("rect")
		      .attr("class", "bar")
		      .attr("x", function(d) { return x(d.year); })
		      .attr("width", x.rangeBand())
		      .attr("y", function(d) { return y(d.events); })
		      .attr("height", function(d) { return height - y(d.events); })
		      .attr('stroke', 'white')
			  .attr('fill', 'steelblue');

		svg.selectAll(".label")
			  .data(data)
			.enter().append("text")
			  .attr("class", "label")
			  .attr("x", function(d) { return x(d.year) + x.rangeBand();  })
			  .attr("y", function(d) { return y(d.events)-20; })
			  .attr("dy", "1.2em") // padding-left
			  .attr("dx", -x.rangeBand() / 2) // vertical-align: middle
			  .attr("text-anchor", "middle") // text-align: right
			  .attr("fill", "black")
			  .attr("stroke", "none")
			  .text(function(d) { if (d.events!=0) return d.events; });
	}

	function setupSlider(min_year,max_year){

            
        $('#slider_year').dragslider({
            animate: true,
            range: true,
            rangeDrag: true,
            //max min values for slider
            max:max_year,
            min:min_year,
            step:1,
            //init values
            values: [min_year, max_year],
            //slide event
            slide: function( event, ui ) {    
                var lower_year = ui.values[0];
                var higher_year = ui.values[1];
                document.getElementById('min_year').innerHTML = lower_year;
                document.getElementById('max_year').innerHTML = higher_year;
                //redraw visualization by new filter value
                console.log(lower_year,higher_year);
                //drawVisualization(lower_finance/100,higher_finance/100,lower_poverty/100,higher_poverty/100);
            }                
        });            

    };

    setupSlider(1960,2012);
	
})
