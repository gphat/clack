// A Scatter Plot Renderer
CLACK.ScatterPlotRenderer = function(options) {
  options = options || {};

  // Size of the dots!
  options.dotSize = options.dotSize || 2;

  this.clear = function() {
    if(this.element !== undefined) {
      ($this.element).remove();
    }
    this.ctx = undefined;
    this.memCtx = undefined;
    this.memElement = undefined;
  };

  this.draw = function(c, parent, chart) {

    var parentWidth = Number(parent.style.width);
    var parentHeight = Number(parent.style.height);

    // Create our canvas element if we haven't already.
    if(this.element === undefined) {
      this.element = document.createElement('canvas');
      this.element.style.position = 'absolute';
      // Only if the axes are here… XXX
      // this.element.style.left = marginLeft + "px";
      // this.element.style.top = marginTop + "px";
      this.element.width = parentWidth;
      this.element.height = parentHeight;
      // this.element.style.zIndex = 0;
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

    // Iterate over each series
    for(var j = 0; j < c.series.length; j++) {
      // Create a new path for each series.
      ctx.beginPath();
      // Set color
      ctx.fillStyle = c.series[j].color;

      for(var k = 0; k < c.series[j].x.length; k++) {
        ctx.moveTo(c.domainScale(c.series[j].x[k]), c.rangeScale(c.series[j].y[k]));
        ctx.arc(c.domainScale(c.series[j].x[k]), c.rangeScale(c.series[j].y[k]), options.dotSize, 0, 2*Math.PI);
      }
      ctx.fill();
    }

    var fctx = this.ctx;
    // Clear the current in-browser context.
    fctx.clearRect(0, 0, chart.options.width, chart.options.height);
    // Copy the contents on the in-memory canvas into the displayed one.
    fctx.drawImage(this.memElement, 0, 0);
  };
};
