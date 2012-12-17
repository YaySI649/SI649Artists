$(document).ready(function(){

	var genreScale = d3.scale.linear()
			.domain([0, 119])
			.range(['#eee', 'red']);
	function updateGenreLegend(genre, max, genreScale){
		d3.select("#genreLegend svg").remove();

		var genreLegend = d3.select("#genreLegend").append("svg")
												   .attr("width", 120)
                                   				   .attr("height", 100);
		var Q1 = (0 + max)/4;
		var Q2 = Q1 * 2;
		var Q3 = Q1 * 3;
		genreLegend.append("text")
	               .attr("x", 10)
	               .attr("y", 10)
	               .attr("width", 15)
	               .attr("height", 15)
	               .attr("font-size", 13)
	               .text("Propotion of Artists");	
		genreLegend.append("rect")
	               .attr("x", 30)
	               .attr("y", 15)
	               .attr("width", 15)
	               .attr("height", 15)
	               .attr("fill", genreScale(0));
		genreLegend.append("text")
	               .attr("x", 60)
	               .attr("y", 28)
	               .attr("width", 15)
	               .attr("height", 15)
	               .attr("font-size", 14)
	               .text("0");	    
	    genreLegend.append("rect")
	               .attr("x", 30)
	               .attr("y", 30)
	               .attr("width", 15)
	               .attr("height", 15)
	               .attr("fill", genreScale(Q1));
	    genreLegend.append("text")
	               .attr("x", 60)
	               .attr("y", 44)
	               .attr("width", 15)
	               .attr("height", 15)
	               .attr("font-size", 14)
	               .text(parseInt(Q1));	 
	    genreLegend.append("rect")
	               .attr("x", 30)
	               .attr("y", 45)
	               .attr("width", 15)
	               .attr("height", 15)
	               .attr("fill", genreScale(Q2));
	    genreLegend.append("text")
	               .attr("x", 60)
	               .attr("y", 59)
	               .attr("width", 15)
	               .attr("height", 15)
	               .attr("font-size", 14)
	               .text(parseInt(Q2));	               
	    genreLegend.append("rect")
	               .attr("x", 30)
	               .attr("y", 60)
	               .attr("width", 15)
	               .attr("height", 15)
	               .attr("fill", genreScale(Q3));
	    genreLegend.append("text")
	               .attr("x", 60)
	               .attr("y", 74)
	               .attr("width", 15)
	               .attr("height", 15)
	               .attr("font-size", 14)
	               .text(parseInt(Q3));	
	    genreLegend.append("rect")
	               .attr("x", 30)
	               .attr("y", 75)
	               .attr("width", 15)
	               .attr("height", 15)
	               .attr("fill", genreScale(max));               
	    genreLegend.append("text")
	               .attr("x", 60)
	               .attr("y", 89)
	               .attr("width", 15)
	               .attr("height", 15)
	               .attr("font-size", 14)
	               .text(max);
	}

	function updateArtistLegend(artist, max){
		d3.select("#artistLegend svg").remove();
		
		var artistLegend = d3.select("#artistLegend").append("svg")
												     .attr("width", 120)
                                   				     .attr("height", 100);		

		var artistScale = d3.scale.linear()
			.domain([0, max])
			.range([0, 9]);

		var Q1 = (0 + max)/4;
		var Q2 = Q1 * 2;
		var Q3 = Q1 * 3;
		artistLegend.append("text")
	               .attr("x", 20)
	               .attr("y", 10)
	               .attr("width", 15)
	               .attr("height", 15)
	               .attr("font-size", 13)
	               .text("Artist Visit");	
		artistLegend.append("circle")
	               .attr("cx", 40)
	               .attr("cy", 22)
	               .attr("r", artistScale(1))
	               .attr("fill", "black");
		artistLegend.append("text")
	               .attr("x", 60)
	               .attr("y", 31)
	               .attr("width", 15)
	               .attr("height", 15)
	               .attr("font-size", 14)
	               .text("1");	    
	    artistLegend.append("circle")
	               .attr("cx", 40)
	               .attr("cy", 40)
	               .attr("r", artistScale(Q1))
	               .attr("fill", "black");
	    artistLegend.append("text")
	               .attr("x", 60)
	               .attr("y", 45)
	               .attr("width", 15)
	               .attr("height", 15)
	               .attr("font-size", 14)
	               .text(Q1);	 
	    artistLegend.append("circle")
	               .attr("cx", 40)
	               .attr("cy", 53)
	               .attr("r", artistScale(Q2))
	               .attr("fill", "black");
	    artistLegend.append("text")
	               .attr("x", 60)
	               .attr("y", 59)
	               .attr("width", 15)
	               .attr("height", 15)
	               .attr("font-size", 14)
	               .text(Q2);	               
	    artistLegend.append("circle")
	               .attr("cx", 40)
	               .attr("cy", 68)
	               .attr("r", artistScale(Q3))
	               .attr("fill", "black");
	    artistLegend.append("text")
	               .attr("x", 60)
	               .attr("y", 74)
	               .attr("width", 15)
	               .attr("height", 15)
	               .attr("font-size", 14)
	               .text(Q3);	
	    artistLegend.append("circle")
	               .attr("cx", 40)
	               .attr("cy", 85)
	               .attr("r", artistScale(max))
	               .attr("fill", "black");               
	    artistLegend.append("text")
	               .attr("x", 60)
	               .attr("y", 90)
	               .attr("width", 15)
	               .attr("height", 15)
	               .attr("font-size", 14)
	               .text(max);
	}
	updateGenreLegend("Pop", 47, genreScale);
	updateArtistLegend("Adele", 100);
})