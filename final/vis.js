if (typeof console === "undefined" || typeof console.log === "undefined") {
	console = {};
	console.log = function () { };
}

(function() {
	window.Vis = {};

	function countdown(count, callback) {
		return function() {
			count--;
			if (count == 0) {
				callback(arguments);
			}
		};
	}

	// Namespace-level vars / objects.

	// The number of artists in each genre.
	var genre_totals = {
		"RB/Soul": 105,
		"alternative/indie rock": 47,
		"Rock": 132,
		"Country": 173,
		"Pop": 119,
		"Rap/Hip Hop": 129
	};

	genre_totals['all'] = _.chain(genre_totals).values().reduce(function(a, b) { return a + b; }, 0).value();

	Vis.genre_totals = genre_totals;

	var CM_ATTR = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="http://cloudmade.com">CloudMade</a>';


	// This gets populated on init.
	var admin_features = null;
	var country_genre_map = null;
	var resources_loaded = false;

	// Progression: Show a map, then load our layers.
	// If you show a second map, obviously it shouldn't load the data again.

	function load_features (callback) {
		// Called to init the features.  Async.
		// Don't render maps until they're all loaded.

		if (resources_loaded) {
			callback();
		}
		
		var call_check = countdown(2, function() {
			resources_loaded = true;
			callback();
		});

		$.getJSON('data/country_genre_map.js', function(json) {
			country_genre_map = json;
			call_check();
		});

		$.getJSON('data/simple_world_2.js', function(json) {
			admin_features = json;
			call_check();
		});
	};

	Vis.genMap = function(map_id) {
		// This is the main class for the vis.

		// Default to showing all genres.
		var current_genre = 'all';

		var genre_scale = null;
		var choropleth = null;
		var artist_layer_instance = null, artist_layer_class;

		var upper_date = 2012, lower_date = 1960;
		var current_artist = null;

		var default_style = {
			weight: 0,
			fillOpacity: 0.7
		};

		var map_loaded = false;
		var map_callback = null;

		// Init the map immediately.
		console.log("Loading map for ID", map_id);
		var map = L.map(map_id).on('load', function() {
			if (map_callback != null) {
				map_callback();
			}
			map_loaded = true;
		}).setView([37.8, -96], 4);

		// Temporary debugging.
		window.visMap = map;

		L.tileLayer('http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png', {
			key: 'fa9058fec5c847268ff72b834c392c2e',
			attribution: CM_ATTR,
			styleId: 22677
		}).addTo(map);

		// Note: this function gets called a few thousand times and needs to be efficient.
		// Maybe avoid using _.clone?
		function style(feature) {
			// Use a D3 scale to color them.
			var adm_code = country_genre_map[feature.properties.ADM1_CODE];
			if (adm_code) {
				var gcount = adm_code[current_genre];
				if (gcount) {
					// Add together the events for this date range.
					var g_total = {};

					// Fine.  No funny business with functions.
					for (var i = lower_date; i <= upper_date; i++) {
						_.extend(g_total, (gcount[i] || {}));
					}

					// console.log("Got gtotal:", g_total);

					return _.extend(_.clone(default_style), {
						fillColor: genre_scale(_.size(g_total))
					});
				}
			}

			return _.extend(_.clone(default_style), {
				fillOpacity: 0
			});
		}

		function updateStyle() {
			genre_scale = d3.scale.linear()
				.domain([0, genre_totals[current_genre]])
				.range(['#eee', 'red']);

			choropleth.setStyle(style);

			Vis.updateGenreLegend(current_genre, genre_totals[current_genre], genre_scale);
		}

		// Make sure our own stuff is loaded before adding that layer.
		load_features(function() {
			console.log("Rendering GeoJSON...");
			choropleth = L.geoJson(admin_features, {
				onEachFeature: function (feature, layer) {
					// Attach the callbacks
					layer.bindPopup(feature.properties.ADMIN);
				}
			});

			if (map_loaded) {
				choropleth.addTo(map);
				updateStyle();
			} else {
				map_callback = function() {
					choropleth.addTo(map);
					updateStyle();
				}
			}
		});

		// Artist stuff.
		function queryArtist(artist, callback) {
			// Hope you like Usher.
			get_artist_geojson(artist, lower_date, upper_date, callback);
		}

		// Make a custom layer.
		// Woah abrupt programming style shift.
		// But I don't know quite enough Leaflet / JS object patterns to be consistent right now.
		function add_artist_layer(artist) {
			// Bostocks' Leaflet to D3 projection bridge.
			function project(x) {
				var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
				return [point.x, point.y];
			}


			// Local vars.  
			// We're essentially treating them the same as layer vars because I'm not fond of JS "classes"
			// and because it makes it easier to work in the D3 example code.
			var path = d3.geo.path()
					.projection(project);
					// PointRadius gets set when the data actually comes in.

			// It decouples the usual attr('d') call because that's determined by the Leaflet zoom level.
			var svg, g;
			var feature, bounds;
			var artist_data;

			artist_layer_class = L.Class.extend({
				initialize: function() {

				},

				onAdd: function(map) {
					this._map = map;

					// create a DOM element and put it into one of the map panes
					svg = d3.select(map.getPanes().overlayPane).append("svg")
						.classed('leaflet-zoom-hide map_body', true);

					// svg.attr("width", $('#' + map_id).width())
						// .attr("height", $('#' + map_id).height());
					// 	.style("margin-left", bottomLeft[0] + "px")
					// 	.style("margin-top", topRight[1] + "px");

					g = svg.append("g");

					feature = g.selectAll("path")
						.data(artist_data.features)
					.enter().append("path")
						.on('click', function(d) {
							d3.event.stopPropagation();
							var coords = _.clone(d.geometry.coordinates);
							coords.reverse();
							console.log("Clicked", d, "at coords", coords);
							// var popup = new L.Popup().setLatLng([43.0, -79.0]).setContent("blah").openOn(map);
							
							var venue_sql = "select distinct v.name, v.city, v.website, e.image"+
							             " from VENUES v join EVENTS e on v.venue_id = e.venue_id where name = '" 
							             + d.properties.name +"'";
							query_db(venue_sql, function(result){
							    console.log(result);
							    var city = result[0]['city'];
							    var website = result[0]['website'];
							    var img_url = result[0]['image'];
							    var content = "<ul style='list-style-type:none;'><li><strong>"+d.properties.title+"</strong></li>";
							    content += "<li><a href = '" + website +"' target=\"_blank\">"+
							                 d.properties.name+"</a></li>" + "<li>"+city+"</li>";
							    //content += "<img src = '"+img_url +"'>";
							    var popup = new L.Popup()
                                .setLatLng(coords)
                                .setContent(content)
                                .openOn(map);
                                console.log("Generated popup: ", popup, "on map", map);
							})
						});

					bounds = d3.geo.bounds(artist_data);

					// add a viewreset event listener for updating layer's position, do the latter
					map.on('viewreset', this._reset, this);
					this._reset();
				},

				onRemove: function(map) {
					// remove layer's DOM elements and listeners
					console.log("Removing SVG.");
					svg.remove();
					map.off('viewreset', this._reset, this);
				},

				_reset: function() {
					// update layer's position
					console.log("Geo bounds:", bounds);
					var bottomLeft = project(bounds[0]),
						topRight = project(bounds[1]);

					bottomLeft[0] = bottomLeft[0] - map.getZoom() * 10;
					bottomLeft[1] = bottomLeft[1] + map.getZoom() * 10;

					topRight[0] = topRight[0] + map.getZoom() * 10;
					topRight[1] = topRight[1] - map.getZoom() * 10;

					console.log("Repositioning SVG: ", bottomLeft, topRight);
					svg.attr("width", topRight[0] - bottomLeft[0])
						.attr("height", bottomLeft[1] - topRight[1])
						.style("margin-left", bottomLeft[0] + "px")
						.style("margin-top", topRight[1] + "px");

					g.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");

					// project() will be different, so need to redo the attr.
					feature.attr("d", path);
				}
			});

			// Make a GeoJSON thing out of the artist data.
			// (Incorporates the date range filter)
			queryArtist(artist, function(artist_json) {
				artist_data = artist_json;

				var artistScale = d3.scale.linear()
					.domain([0, d3.max(artist_data.features, function(d) { return d.properties.count })])
					.range([3, 11]);

				path.pointRadius(function(d) {
					return artistScale(d.properties.count); // * map.getZoom();
				});

				if (artist_layer_instance != null) {
					console.log("Clearing artist layer.");
					// Remove it from the map.
					map.removeLayer(artist_layer_instance);
				}

				artist_layer_instance = new artist_layer_class();
				map.addLayer(artist_layer_instance);

				Vis.updateArtistLegend(artist, artistScale.domain()[1], artistScale);

			});

		}

		return {
			set_genre: function(genre) {
				current_genre = genre;
				updateStyle();
			},
			set_artist: function(artist) {
				current_artist = artist;
				add_artist_layer(artist);
			},
			update_dates: function(lower, upper) {
				upper_date = upper;
				lower_date = lower;

				if (current_artist != null) {
					add_artist_layer(current_artist);
				}

				updateStyle();
			}
		};
	};

})();

$(function() {
	var map = Vis.genMap('map1');
    setup_db();
	_.each(Vis.genre_totals, function(v, k) {
		//var button = $('<button>' + k + '</button>');
		if(k=="all"){
           var radio = $("<input type=\"radio\" id=\"radio_"+
                        k+"\" name=\"radio\" checked=\"checked\"//><label for=\"radio_"+
                        k+"\">" + k + "</label>")
		} else{
		   var radio = $("<input type=\"radio\" id=\"radio_"+
                    k+"\" name=\"radio\" //><label for=\"radio_"+
                    k+"\">" + k + "</label>") 
		}
		//$('#controls').append(button);
		$('#controls').append(radio);
		radio.click(function() {
		    var genre = ($(this).text());
		    if (genre!=""){
		        map.set_genre($(this).text());
		    }
		});
	});
    
    $(function() {
        $( "#controls" ).buttonset();
    });
    
	//map.set_artist('Usher');

	window.yayMap = map;
});
