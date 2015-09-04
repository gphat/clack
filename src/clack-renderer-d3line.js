// A Line Renderer!
CLACK.D3LineRenderer = function(options) {
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

    var line = d3.svg.line()
      .x(function(d, i) {
        return c.domainScale(d[0]);
      })
      .y(function(d, i) {
        return c.rangeScale(d[1]);
      });

    var finalData = [];
    for(var j = 0; j < c.series.length; j++) {
      finalData[j] = d3.zip(c.series[j].x, c.series[j].y);
    }

    if(this.svg === undefined) {
      this.svg = d3.select(parent).append("svg");

      this.svg.selectAll("path")
        .data(finalData)
        .enter()
        .append("svg:path")
        .attr("d", line)
        .style("fill", "none")
        .style("stroke", "steelblue")
        // .style("stroke", c.series[j].color)
        .style("stroke-width", options.lineWidth);
        // }
    } else {
      // We're redrawing
      this.svg.selectAll("path")
        .data(finalData)
        .attr("d", line);
    }

    // // Iterate over each series
    //   // Create a new path for each series.
    //   ctx.beginPath();
    //   // Set color
    //   ctx.strokeStyle = c.series[j].color;
    //   ctx.lineWidth = options.lineWidth;

    //   for(var k = 0; k < c.series[j].x.length; k++) {
    //     ctx.lineTo(c.domainScale(c.series[j].x[k]), c.rangeScale(c.series[j].y[k]));
    //   }
    //   ctx.stroke();

    //   if(options.dots) {
    //     ctx.beginPath();
    //     ctx.fillStyle = c.series[j].color;
    //     for(var l = 0; l < c.series[j].x.length; k++) {
    //       var myX = c.domainScale(c.series[j].x[l]);
    //       var myY = c.rangeScale(c.series[j].y[l]);
    //       ctx.moveTo(myX, myY);
    //       ctx.arc(myX, myY, options.dotSize, 0, 2 * Math.PI, true);
    //     }
    //     ctx.fill();
    //   }
    // }
  };
};
