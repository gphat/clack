// A Histogram HeatMap Renderer.
// Many time series merged into one visualization. Each x "column" is a histogram of Y values, shown as a heatmap.
// Note that this ignores the color set on the series!
CLACK.D3HistogramHeatMapRenderer = function(options) {
  options = options || {};

  // Allow the user to specify a way to convert a color value into an actual holor. The
  // default is to just return the color's value but other implementations might return
  // 'rgba(0, 0, 255, $color)' to adjust the alpha channel.  The result of this is passed
  // to the canvas context's `fillStyle` property.
  options.colorFunction = options.colorFunction || function(color) { return color; };
  // Color scale start value.
  options.colorScaleStart = options.colorScaleStart || 'blue';
  // Color scale end value.
  options.colorScaleEnd = options.colorScaleEnd || 'red';
  // Scale of color. Uses CLACK.makeScale
  options.colorScale = options.colorScale || 'log';

  this.clear = function() {
    if(this.element !== undefined) {
      ($this.element).remove();
    }
    this.ctx = undefined;
    this.memCtx = undefined;
    this.memElement = undefined;
  };

  this.draw = function(c, parent, chart) {
    var parentWidth = parseInt(parent.style.width, 10);
    var parentHeight = parseInt(parent.style.height, 10);

    console.log(parentWidth);
    console.log(parentHeight);

    var exes = {};
    // Create a map of x values to y values, as we need to bucket them.
    for(var j = 0; j < c.series.length; j++) {
      for(var k = 0; k < c.series[j].x.length; k++) {
        var myX = c.series[j].x[k];
        if(myX in exes) {
          exes[myX].push(c.series[j].y[k]);
        } else {
          exes[myX] = [ c.series[j].y[k] ];
        }
      }
    }

    // Create a new histogram and set it's range to the min/max for
    // the entire set of series.
    var binCount = Math.round(parentHeight / 5);
    var layout = d3.layout.histogram()
      .bins(binCount);
    layout.range([ c.ymin, c.ymax ]);

    var bheight = parentHeight / binCount;
    // The width for each bin
    var bwidth = parentWidth / Object.keys(exes).length;

    // Create a color range that spans from 0 to the number of Y values in our histogram.
    var colorScale = CLACK.makeScale(options.colorScale)
      .domain([ 1, c.maxLength ])
      .range([ options.colorScaleStart, options.colorScaleEnd ]);

    var svg = d3.select(parent).append("svg")
    .attr("width", parentWidth)
    .attr("height", parentWidth);

    var finalData = [];
    // For each bin…
    var colIndex = 0;
    for(var col in exes) {
      // Get the histogram for this x position
      var histo = layout(exes[col]);

      // Iterate over the bins.
      for(var bin = 0; bin < histo.length; bin++) {
        var v = histo[bin];
        // Only draw a square if we have a value. Don't waste time on empty spots.
        if(v.y > 0) {
          finalData.push({
            count: v.y,
            color: options.colorFunction(colorScale(v.y)),
            x: 0 + (colIndex * bwidth),
            y: parentHeight - ((bin + 1) * bheight),
          });
        }
      }
      colIndex++;
    }

    svg.selectAll("rect.day")
      .data(finalData)
      .enter().append("svg:rect")
        .attr("width", bwidth)
        .attr("height", bheight)
        .attr("fill", function(d) {
          return d.color;
        })
        .attr("x", function(d) {
          return d.x;
        })
        .attr("y", function(d) {
          return d.y;
        })
        .append("svg:title")
        .text(function(d) { return d.count; });
  };
};
