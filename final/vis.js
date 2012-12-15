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

		var default_style = {
			weight: 0,
			fillOpacity: 0.7
		};

		// Init the map immediately.
		console.log("Loading map for ID", map_id);
		var map = L.map(map_id).setView([37.8, -96], 4);

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
					return _.extend(_.clone(default_style), {
						fillColor: genre_scale(gcount)
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
		}

		// Make sure our own stuff is loaded before adding that layer.
		load_features(function() {
			console.log("Rendering GeoJSON...");
			choropleth = L.geoJson(admin_features, {
				onEachFeature: function (feature, layer) {
					// Attach the callbacks
			        layer.bindPopup(feature.properties.ADMIN);
				}
			}).addTo(map);

			updateStyle();
		});

		return {
			set_genre: function(genre) {
				current_genre = genre;
				updateStyle();
			}
		};
	};

})();

$(function() {
	var map = Vis.genMap('map1');

	_.each(Vis.genre_totals, function(v, k) {
		var button = $('<button>' + k + '</button>');
		$('#controls').append(button);
		button.click(function() {
			map.set_genre($(this).text());
		});
	});
});
