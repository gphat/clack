// A Histogram HeatMap Renderer.
// Many time series merged into one visualization. Each x "column" is a histogram of Y values, shown as a heatmap.
// Note that this ignores the color set on the series!
CLACK.HistogramHeatMapRenderer = function(options) {
  options = options || {};

  // Allow the user to specify a way to convert a color value into an actual holor. The
  // default is to just return the color's value but other implementations might return
  // 'rgba(0, 0, 255, $color)' to adjust the alpha channel.  The result of this is passed
  // to the canvas context's `fillStyle` property.
  options.colorFunction = options.colorFunction || function(color) { return color; };
  // Color scale start value.
  options.colorScaleStart = options.colorScaleStart || "blue";
  // Color scale end value.
  options.colorScaleEnd = options.colorScaleEnd || "red";
  // Scale of color. Uses CLACK.makeScale
  options.colorScale = options.colorScale || "log";

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

    // Create our canvas element if we haven't already.
    if(this.element === undefined) {
      this.element = document.createElement('canvas');
      this.element.style.position = 'absolute';
      this.element.width = parentWidth;
      this.element.height = parentHeight;
      parent.appendChild(this.element);
      this.ctx = this.element.getContext('2d');
    }

    if(this.memElement === undefined) {
      this.memElement = document.createElement('canvas');
      this.memElement.width = parentWidth;
      this.memElement.height = parentHeight;
    }

    if(this.memCtx === undefined) {
      // Create an in-memory canvas!
      this.memCtx = this.memElement.getContext('2d');
    }

    var ctx = this.memCtx;
    // Clear the in-memory context for the renderer.
    ctx.clearRect(0, 0, parentWidth, parentHeight);

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
      // Set the number of bins to the range of our entire context's Y.
      .bins(binCount);
    layout.range([ c.ymin, c.ymax ]);

    var bheight = parentHeight / binCount;
    // The width for each bin
    var bwidth = parentWidth / Object.keys(exes).length;

    // Create a color range that spans from 1 to the number of series in our dataset (the max histogram frequency possible).
    var colorScale = CLACK.makeScale(options.colorScale).domain([ 1, c.series.length ]).range([ options.colorScaleStart, options.colorScaleEnd ]);

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
          ctx.beginPath();
          ctx.fillStyle = options.colorFunction(colorScale(v.y));
          // Calculate a bar height, which will be the 1 - dx from the histogram's bin
          // times the height of the whole chart.
          ctx.fillRect(
            0 + (colIndex * bwidth),              // x is the offset from 0
            parentHeight - ((bin + 1) * bheight),
            bwidth, // bar's width (evenly spaced based on the number of columns)
            bheight // And the height!
          );
        }
      }
      colIndex++;
    }

    var fctx = this.ctx;
    // Clear the current in-browser context.
    fctx.clearRect(0, 0, parentWidth, parentHeight);
    // Copy the contents on the in-memory canvas into the displayed one.
    fctx.drawImage(this.memElement, 0, 0);
  };
};
