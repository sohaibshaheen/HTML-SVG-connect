/*!
jQuery HTML SVG connect v2.0.0
license: MIT
based on: https://gist.github.com/alojzije/11127839
alojzije/connectHTMLelements_SVG.png
*/
; (function ($, window, document, undefined) {
//https://github.com/jquery-boilerplate/jquery-boilerplate
"use strict";

var pluginName = "HTMLSVGconnect",
    defaults = {
	stroke: "#000000",
	strokeWidth: 12,
	orientation: "auto",
	// Array of objects with properties "start" & "end" that
	// define the selectors of the elements to connect:
	// i.e., {start: "#purple", end: "#green"}.
	// Optional properties:
	//	"stroke": [color],
	//	"strokeWidth": [px],
	//	"orientation": [horizontal|vertical|auto (default)]
	paths: []
    };

function Plugin(element, options) {
    this.element = element;
    this.$element = $(this.element);
    this.settings = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = pluginName;
    this.init();
}

$.extend(Plugin.prototype, {
    init: function () {
	this.$svg = $(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
	this.$svg.attr("height", 0).attr("width", 0);
	this.$element.append(this.$svg);
	// Draw the paths, and store references to the loaded elements.
	this.loadedPaths = $.map(this.settings.paths, $.proxy(this.connectSetup, this));
	$(window).on("resize", this.throttle(this.reset, 200, this));
    },

    reset: function () {
	this.$svg.attr("height", 0).attr("width", 0);
	var self = this;
	// Recalculate paths.
	$.each(this.loadedPaths, function (i, pathRef) {
	    self.connectElements(pathRef.path, pathRef.start, pathRef.end, pathRef.orientation);
	});
    },

    connectSetup: function (pathConfig) {
	if (pathConfig.hasOwnProperty("start") && pathConfig.hasOwnProperty("end")) {
	    var $start = $(pathConfig.start), $end = $(pathConfig.end);
	    // Start/end elements exist.
	    if ($start.length && $end.length) {
		var $path = $(document.createElementNS("http://www.w3.org/2000/svg", "path"));
		// Custom/default path properties.
		var stroke = pathConfig.hasOwnProperty("stroke") ? pathConfig.stroke : this.settings.stroke;
		var strokeWidth = pathConfig.hasOwnProperty("strokeWidth") ? pathConfig.strokeWidth : this.settings.strokeWidth;
		$path.attr("fill", "none")
		    .attr("stroke", stroke)
		    .attr("stroke-width", strokeWidth);
		this.$svg.append($path);
		// Custom/default forced orientation of path.
		var orientation = pathConfig.hasOwnProperty("orientation") ? pathConfig.orientation : "auto";
		this.connectElements($path, $start, $end, orientation);
		// Save for reference.
		return { "path": $path, "start": $start, "end": $end, "orientation": orientation };
	    }
	}
	return null; // Ignore/invalid.
    },

    // Whether the path should originate from the top/bottom or the sides;
    // based on whichever is greater: the horizontal or vertical gap between the elements
    // (this depends on the user positioning the elements sensibly,
    // and not overlapping them).
    determineOrientation: function ($startElem, $endElem) {
	// If first element is lower than the second, swap.
	if ($startElem.offset().top > $endElem.offset().top) {
	    var temp = $startElem;
	    $startElem = $endElem;
	    $endElem = temp;
	}
	var startBottom = $startElem.offset().top + $startElem.outerHeight();
	var endTop = $endElem.offset().top;
	var verticalGap = endTop - startBottom;
	// If first element is more left than the second, swap.
	if ($startElem.offset().left > $endElem.offset().left) {
	    var temp2 = $startElem;
	    $startElem = $endElem;
	    $endElem = temp2;
	}
	var startRight = $startElem.offset().left + $startElem.outerWidth();
	var endLeft = $endElem.offset().left;
	var horizontalGap = endLeft - startRight;
	return horizontalGap > verticalGap ? "vertical" : "horizontal";
    },

    connectElements: function ($path, $startElem, $endElem, orientation) {
	// Orientation not set per path.
	if (orientation != "vertical" && orientation != "horizontal") {
	    // Check if global orientation has been set.
	    if (this.settings.orientation != "vertical" && this.settings.orientation != "horizontal") {
		// Automatically determine.
		orientation = this.determineOrientation($startElem, $endElem);
	    } else {
		orientation = this.settings.orientation; // User forced setting.
	    }
	}
	var swap = false;
	if (orientation == "vertical") {
	    // If first element is more left than the second.
	    swap = $startElem.offset().left > $endElem.offset().left;
	} else { // Horizontal
	    // If first element is lower than the second.
	    swap = $startElem.offset().top > $endElem.offset().top;
	}
	if (swap) {
	    var temp = $startElem;
	    $startElem = $endElem;
	    $endElem = temp;
	}
	// Get (top, left) corner coordinates of the svg container.
	var svgTop = this.$element.offset().top;
	var svgLeft = this.$element.offset().left;

	// Get (top, left) coordinates for the two elements.
	var startCoord = $startElem.offset();
	var endCoord = $endElem.offset();

	// Centre path above/below or left/right of element.
	var centreSX = 0.5, centreSY = 1,
	    centreEX = 0.5, centreEY = 0;
	if (orientation == "vertical") {
	    centreSX = 1;
	    centreSY = 0.5;
	    centreEX = 0;
	    centreEY = 0.5;
	}
	// Calculate the path's start/end coordinates.
	// We want to align with the elements' mid point.
	var startX = startCoord.left + 15 - svgLeft;
	var startY = startCoord.top + $startElem.outerHeight() - svgTop;
	var endX = endCoord.left - svgLeft;
	var endY = endCoord.top + 0.5 * $endElem.outerHeight() - svgTop;

	this.drawPath($path, startX, startY, endX, endY, orientation);
    },

    drawPath: function ($path, startX, startY, endX, endY, orientation) {
	var stroke = parseFloat($path.attr("stroke-width"));
	// Check if the svg is big enough to draw the path, if not, set height/width.
	if (this.$svg.attr("width") < (Math.max(startX, endX) + stroke)) this.$svg.attr("width", (Math.max(startX, endX) + stroke));
	if (this.$svg.attr("height") < (Math.max(startY, endY) + stroke)) this.$svg.attr("height", (Math.max(startY, endY) + stroke));

	var deltaX = (Math.max(startX, endX) - Math.min(startX, endX)) * 0.15;
	var deltaY = (Math.max(startY, endY) - Math.min(startY, endY)) * 0.15;
	// For further calculations whichever is the shortest distance.
	var delta = Math.min(deltaY, deltaX);
	// Set sweep-flag (counter/clockwise)
	var arc1 = 0; var arc2 = 1;
	orientation = "horizontal";
	if (orientation == "vertical") {
	    var sigY = this.sign(endY - startY);
	    // If start element is closer to the top edge,
	    // draw the first arc counter-clockwise, and the second one clockwise.
	    if (startY < endY) {
		arc1 = 1;
		arc2 = 0;
	    }
	    // Draw the pipe-like path
	    // 1. move a bit right, 2. arch, 3. move a bit down, 4.arch, 5. move right to the end
	    $path.attr("d", "M" + startX + " " + startY +
		" H" + (startX + delta) +
		" A" + delta + " " + delta + " 0 0 " + arc1 + " " + (startX + 2 * delta) + " " + (startY + delta * sigY) +
		" V" + (endY - delta * sigY) +
		" A" + delta + " " + delta + " 0 0 " + arc2 + " " + (startX + 3 * delta) + " " + endY +
		" H" + endX);
	} else {
	    //Horizontal
	    var sigX = this.sign(endX - startX);
	    // If start element is closer to the left edge,
	    // draw the first arc counter-clockwise, and the second one clockwise.
	    if (startX > endX) {
		arc1 = 1;
		arc2 = 0;
	    }
	    // Draw the pipe-like path
	    // 1. move a bit down, 2. arch, 3. move a bit to the right, 4.arch, 5. move down to the end
	    console.log("M" + startX + " " + startY +
		" V" + (startY + delta) +
		" A" + delta + " " + delta + " 0 0 " + arc1 + " " + (startX + delta * sigX) + " " + (startY + 2 * delta) +
		" H" + (endX - delta * sigX) +
		" A" + delta + " " + delta + " 0 0 " + arc2 + " " + endX + " " + (startY + 3 * delta) +
		" V" + endY);
	    $path.attr("d", "M" + startX + " " + startY +
		" V" + (endY - delta) +
		" A" + delta + " " + delta + " 0 0 " + arc1 + " " + (startX + delta * sigX) + " " + (endY) +
		" H" + (endX)
	    );
	}
    },

    // Chrome Math.sign() support.
    sign: function (x) {
	return x > 0 ? 1 : x < 0 ? -1 : x;
    },

    // https://remysharp.com/2010/07/21/throttling-function-calls
    throttle: function (fn, threshhold, scope) {
	threshhold || (threshhold = 250);
	var last, deferTimer;
	return function () {
	    var context = scope || this;
	    var now = +new Date,
		args = arguments;
	    if (last && now < last + threshhold) {
		clearTimeout(deferTimer);
		deferTimer = setTimeout(function () {
		    last = now;
		    fn.apply(context, args);
		}, threshhold);
	    } else {
		last = now;
		fn.apply(context, args);
	    }
	};
    },

    /*
		 * Add paths object
		 * e.g., path = { start: "#red", end: "#green", stroke: "blue" };
		 * Public method within the plugin's prototype:
		 * $("#svgContainer").HTMLSVGconnect("addPaths", paths);
		 */
		addPaths: function (paths) {

			var connRef = this;
			$.each(paths, function (i, ref) {
	    var loadedPath = connRef.connectSetup(paths[i]);
				if (loadedPath) {
					connRef.loadedPaths.push(loadedPath);
				}
	});

		}

});

// A really lightweight plugin wrapper around the constructor,
// preventing against multiple instantiations
$.fn[pluginName] = function (options) {
		var args = arguments;
		if (options === undefined || typeof options === 'object') {
			// Creates a new plugin instance, for each selected element, and
			// stores a reference within the element's data
			return this.each(function() {
				if (!$.data(this, 'plugin_' + pluginName)) {
					$.data(this, 'plugin_' + pluginName, new Plugin(this, options));
				}
			});
		} else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
			// Call a public plugin method (not starting with an underscore) for each 
			// selected element.
			return this.each(function() {
				var instance = $.data(this, 'plugin_' + pluginName);
				if (instance instanceof Plugin && typeof instance[options] === 'function') {
					instance[options].apply(instance, Array.prototype.slice.call(args, 1));
				}
			});
		}
	};

})(jQuery, window, document);
