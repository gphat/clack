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
    fctx.clearRect(0, 0, parentWidth, parentHeight);
    // Copy the contents on the in-memory canvas into the displayed one.
    fctx.drawImage(this.memElement, 0, 0);
  };
};
