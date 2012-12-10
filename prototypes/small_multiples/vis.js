if (typeof console === "undefined" || typeof console.log === "undefined") {
	console = {};
	console.log = function () { };
}

(function() {

	window.Vis = {};

	var small_maps = [];

	/* Things that each map needs to be able to do:
	 * 
	 * - Load the countries data.
	 * - Load a subset of the artist / venues data.
	 * - Zoom to a point.
	 * - (Eventually), load new data.
	**/

	// Vars common to all maps.

	var width = 640,
		height = 480,
		centered,
		ratio = 0.75;

	genre_colors = {
		'Rap/Hip Hop': '#E41A1C',
		'Rock': '#377EB8',
		'Pop': '#4DAF4A',
		'alternative/indie rock': '#984EA3',
		'Country': '#FF7F00',
		'RB/Soul': '#FFFF33'
	};


	// var win_x = $(window).width();
	// var win_y = $(window).height();

	// if (win_x > win_y) {
	// 	// Pack more maps in across.
	// 	width = 
	// }


	var projection = d3.geo.equirectangular()
	   .scale(width)
	   .translate([0, 0]);

	var path = d3.geo.path()
	   .projection(projection);

	var artist_radius = 4;

	var artist_path = d3.geo.path()
	   .projection(projection)
	   .pointRadius(function() { return artist_radius; });

	// Actual code for the click function gets filled in later.
	var click = null;

	// Generator for each small map.
	var gen_map = function(sel, genre) {
		var map = {};

		// From D3 zoom example

		var genre_scale = d3.scale.linear()
			.domain([0, genre_totals[genre]])
			.range(['#eee', genre_colors[genre]]);
		
		var svg = d3.select(sel).append("svg")
			.attr("width", width)
			.attr("height", height);

		map.element = svg.node();

		svg.append("rect")
			.attr("class", "background")
			.attr("width", width)
			.attr("height", height)
			.on("click", click);

		var margin_g = svg.append("g")
			.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

		var g = margin_g.append("g")
			.attr("class", "states");

		var artist_g = margin_g.append('g')
		  .classed('artists', true);

		map.load_features = function(countries) {
			g.selectAll("path")
				.data(countries.features)
			.enter().append("path")
				.attr("d", path)
				.style("fill", function(d) {
					var n = d.properties.name;
					if (n in country_genres && genre in country_genres[n]) {
						return genre_scale(country_genres[n][genre])
					} else {
						return 'white';
					}
				})
				.on("click", click);
		};

		map.load_data = function(events) {
			artist_paths = artist_g
			  .selectAll('path')
			  .data(events.features.filter(function(f) { return f.properties.genre == genre; }))
			.enter().append('svg:path')
			  .attr('d', artist_path)
			  .style('fill', function(d) { return genre_colors[d.properties.genre]; })
			  .style('opacity', '0.5')
			  .attr('title', function(d) { return d.properties.artist_name; });
		};

		map.zoom = function(point, k) {
			g.selectAll("path")
			  .classed("active", centered && function(d) { return d.properties.name === centered; });

			// artist_path.pointRadius(4 / k);
			artist_radius = 4/k;
			console.log("Artist radius: ", artist_radius);

			g.transition()
			  .duration(1000)
			  .attr("transform", "scale(" + k + ")translate(" + point.x + "," + point.y + ")")
			  .style("stroke-width", 0.5 / k + "px");

			// artist_g.transition()
			//   .duration(1000)
			//   .attr("transform", "scale(" + k + ")translate(" + point.x + "," + point.y + ")");

			// artist_g.selectAll('path').transition()
			//   .duration(1000)
			//   .attr('d', artist_path);
			//   // .attr("transform", "scale(" + k + ")translate(" + point.x + "," + point.y + ")");
		};

		return map;
	};

	// Modified from d3 zoom example.
	click = function(d) {
		console.log(d);
		var point = {x: 0, y: 0}, k = 1;

		if (d && centered !== d.properties.name) {
			var centroid = path.centroid(d);
			point.x = -centroid[0];
			point.y = -centroid[1];
			k = 4;
			centered = d.properties.name;
		} else {
			centered = null;
		}

		_.each(small_maps, function(m) {
			m.zoom(point, k);
		})
	};

	Vis.load = function() {
		_.each(genre_colors, function(v, k) {
			var id = "map_" + k;
			var map_container = $('<div />').appendTo('body').attr('id', id).css('float', 'left');
			map_container.prepend('<span>' + k + "</span><br />");

			var map = gen_map(map_container.get(0), k);
			map.load_features(countries);
			small_maps.push(map);
		});

		// // Now that the geo boundaries are there, throw on everything else.
		// var genre_maps = _.object(_.zip(_.keys(genre_colors), small_maps));
		// _.each(genre_maps, function(map, genre) {
		// 	map.load_data(artist_features, genre);
		// 	$(map.element).before('<span>' + genre + "</span><br />");
		// });
	};


})();

$(function() {
	Vis.load();
});
