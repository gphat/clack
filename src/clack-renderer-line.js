// A Line Renderer!
CLACK.LineRenderer = function(options) {
  options = options || {};

  // Whether or not to show dots.
  options.dots = options.dots || false;
  // Size of the aboe dots (if true)
  options.dotSize = options.dotSize || 2;
  options.lineWidth = options.lineWidth || 1;

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
      ctx.strokeStyle = c.series[j].color;
      ctx.lineWidth = options.lineWidth;

      for(var k = 0; k < c.series[j].x.length; k++) {
        ctx.lineTo(c.domainScale(c.series[j].x[k]), c.rangeScale(c.series[j].y[k]));
      }
      ctx.stroke();

      if(options.dots) {
        ctx.beginPath();
        ctx.fillStyle = c.series[j].color;
        for(var l = 0; l < c.series[j].x.length; k++) {
          var myX = c.domainScale(c.series[j].x[l]);
          var myY = c.rangeScale(c.series[j].y[l]);
          ctx.moveTo(myX, myY);
          ctx.arc(myX, myY, options.dotSize, 0, 2 * Math.PI, true);
        }
        ctx.fill();
      }
    }

    var fctx = this.ctx;
    // Clear the current in-browser context.
    fctx.clearRect(0, 0, parentWidth, parentHeight);
    // Copy the contents on the in-memory canvas into the displayed one.
    fctx.drawImage(this.memElement, 0, 0);
  };
};
