// Problems
// Assumes the data is sorted.
// context name defaults to default everywhere
// No way to set line widths

// Ideas
// Is this applicable: http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/

var CLACK = CLACK || {};

CLACK.Chart = function(parent, width, height, axes) {
  this.contexts = {
    default: {    
      this: {},
      domainAxis: undefined,
      domainScale: undefined,
      domainScaleType: 'linear',
      rangeAxis: undefined,
      rangeScale: undefined,
      rangeScaleType: 'linear',
      series: [],
      xmax: -Infinity,
      xmin: Infinity,
      xrange: 0,
      ymax: -Infinity,
      ymin: Infinity,
      yrange: 0,
      markers: []
    }
  };
  this.parent = parent;
  this.axes = axes;

  // Some error checking on this is needed. XXX
  this.width = width;
  this.height = height;

  // Some control on the grid? XXX
  this.d3shit = d3.select(parent)
    .append("svg")
    .attr("class", "chart")
    .attr("width", this.width + 40)
    .attr("height", this.height + 20)
    .append("g");

  // Add the chart canvas
  this.element = document.createElement('canvas');
  this.element.style.position = 'absolute';
  // Only if the axes are here… XXX
  this.element.style.left = "40px";
  this.element.style.top = 0;
  this.element.width = this.width;
  this.element.height = this.height;
  this.element.style.zIndex = 0;
  parent.appendChild(this.element);
  this.ctx = this.element.getContext('2d');

  // Add the topmost "decoration" canvas
  this.decoElement = document.createElement('canvas');
  this.decoElement.style.position = 'absolute';
  // Only if the axes are here… XXX
  this.decoElement.style.left = "40px";
  this.decoElement.style.top = 0;
  this.decoElement.width = this.width;
  this.decoElement.height = this.height;
  this.decoElement.style.zIndex = 1;
  parent.appendChild(this.decoElement);
  this.decoCtx = this.decoElement.getContext('2d');

  // Create an in-memory canvas!
  this.memElement = document.createElement('canvas');
  this.memElement.width = this.width;
  this.memElement.height = this.height;
  this.memCtx = this.memElement.getContext('2d');

  this.renderer = new CLACK.LineRenderer();
  console.log(this.renderer);

  this.getContext = function(name) {
    return this.contexts[name];
  }

  this.addMarker = function(marker) {
    var ctx = this.contexts['default'];
    
    ctx.markers.push(marker);

    this.updateContext('default');
    return ctx.markers.length;
  }

  this.addSeries = function(series) {
    var ctx = this.contexts['default'];

    ctx.series.push(series);
    // Establish some defaults that can be later.
    series.xmax = -Infinity;
    series.xmin = Infinity;
    series.xrange = 0;
    series.ymax = -Infinity;
    series.ymin = Infinity;
    series.yrange = 0;
    var idx = ctx.series.length - 1;
    this.updateSeries('default', idx, series.x, series.y);
    return idx;
  }

  this.addToSeries = function(ctxName, index, exes, whys, replace) {

    var ctx = this.contexts[ctxName];

    series = ctx.series[index];

    if((exes instanceof Array) && (whys instanceof Array)) {
      series.x = series.x.concat(exes);
      series.y = series.y.concat(whys);
    }

    if(replace === true) {
      series.x = series.x.slice(exes.length);
      series.y = series.y.slice(whys.length);
    }

    this.updateSeries(ctxName, index, exes, whys);
  }

  // Update stats for the series.
  this.updateSeries = function(ctxName, index) {
    var ctx = this.contexts[ctxName];

    series = ctx.series[index];

    series.xmax = d3.max(series.x);
    series.xmin = d3.min(series.x)

    series.ymax = d3.max(series.y);
    series.ymin = d3.min(series.y);

    series.xrange = series.xmax - series.xmin;
    series.yrange = series.ymax - series.ymin;

    //ctx.series[index] = series;

    this.updateContext(ctxName);
  }

  // Update stats for the context.
  this.updateContext = function(ctxName) {
    var ctx = this.contexts[ctxName];

    // Iterate through each series, establishing the maxes of x and y.
    var xmax = -Infinity;
    var ymax = -Infinity;
    var xmin = Infinity;
    var ymin = Infinity;
    for(var i = 0; i < ctx.series.length; i++) {
      var s = ctx.series[i];
      xmax = Math.max(xmax, s.xmax);
      xmin = Math.min(xmin, s.xmin);
      ymax = Math.max(ymax, s.ymax);
      ymin = Math.min(ymin, s.ymin);
    }

    // Do the same for any markers.
    for(var i = 0; i < ctx.markers.length; i++) {
      var m = ctx.markers[i];
      if(m.x1 !== undefined) {
        xmin = Math.min(xmin, m.x1);
      }
      if(m.x2 !== undefined) {
        xmax = Math.max(xmax, m.x2);
      }
      if(m.y1 !== undefined) {
        ymin = Math.min(ymin, m.y1);
      }
      if(m.y2 !== undefined) {
        ymax = Math.max(ymax, m.y2);
      }
    }

    ctx.xmax = xmax;
    ctx.xmin = xmin;
    ctx.ymax = ymax;
    ctx.ymin = ymin;

    // Set the range based on what we know now.
    ctx.xrange = ctx.xmax - ctx.xmin;
    ctx.yrange = ctx.ymax - ctx.ymin;

    // Create the scales if they don't exist.
    if(ctx.domainScale === undefined) {
      ctx.domainScale = this.makeScale(ctx.domainScaleType);
      ctx.domainScale.rangeRound([0, this.width]);
    
      ctx.rangeScale = this.makeScale(ctx.rangeScaleType);;
      ctx.rangeScale.rangeRound([this.height, 0]);
    }

    // Some help for log scales, which can't have a 0!
    if(ctx.domainScaleType === 'log') {
      if(ctx.xmin === 0) {
        // log(0) == -Infinity!
        ctx.xmin = 1;
      }
    }
    if(ctx.rangeScaleType === 'log') {
      // log(0) == -Infinity!
      if(ctx.ymin === 0) {
        ctx.ymin = 1;
      }
    }

    // Finally, set the comain for each scale.
    ctx.domainScale.domain([ctx.xmin, ctx.xmax]);
    ctx.rangeScale.domain([ctx.ymin, ctx.ymax]);
  }

  // Convencience function for creating a scale based
  // on a string name.
  this.makeScale = function(type) {
    if(type === 'log') {
      return d3.scale.log();
    } else if(type === 'quantile') {
      return d3.scale.quantize();
    } else if(type === 'quantize') {
      return d3.scale.quantize();
    } else if(type === 'sqrt') {
      return d3.scale.pow();
    } else if(type === 'threshold') {
      return d3.scale.threshold();
    } else if(type === 'time') {
      return d3.time.scale();
    } else {
      return d3.scale.linear();
    }
  }

  // Draw the chart. Erases everything first.
  this.draw = function() {
    // console.time('draw');

    // Handle the axes in the common draw method before calling the renderer.
    // Only create the axes if they don't already exist.
    if(this.axes) {
      var defCtx = this.contexts['default'];

      if(defCtx.domainAxis === undefined) {
        // This isn't axes, it's ticks! XXX
        this.d3shit.selectAll("line.x")
          .data(defCtx.domainScale.ticks(5))
          .enter().append("line")
          .attr("class", "x")
          .attr("x1", defCtx.domainScale)
          .attr("x2", defCtx.domainScale)
          .attr("y1", 0)
          .attr("y2", this.height)
          .attr("transform", "translate(40, 0)")
          .style("stroke", "#ccc");

        // This isn't axes, it's ticks! XXX
        this.d3shit.selectAll("line.y")
          .data(defCtx.rangeScale.ticks(5))
          .enter().append("line")
          .attr("class", "y")
          .attr("x1", 0)
          .attr("x2", this.width)
          .attr("y1", defCtx.rangeScale)
          .attr("y2", defCtx.rangeScale)
          .attr("transform", "translate(40, 0)")
          .style("stroke", "#ccc");

        defCtx.domainAxis = d3.svg.axis().scale(defCtx.domainScale).orient('bottom').ticks(5);
        defCtx.rangeAxis = d3.svg.axis().scale(defCtx.rangeScale).orient('left').ticks(5);
        this.gx = this.d3shit.append('g')
          .attr("class", "axis")
          .attr("transform", "translate(40,200)")
          .call(defCtx.domainAxis);
         
        this.gy = this.d3shit.append('g')
          .attr("class", "axis")
          .attr("transform", "translate(40,0)")
          .call(defCtx.rangeAxis);
      } else {
        // If the axes already exist transition them so they can be updated
        // if they have changed.
        this.gx.transition().call(defCtx.domainAxis);
        this.gy.transition().call(defCtx.rangeAxis);
      }
    }

    this.renderer.draw(this);

    // console.timeEnd('draw');
  }

  this.drawDecorations = function() {
    var self = this;
    var ctx = self.memCtx;
    ctx.clearRect(0, 0, self.width, self.height);
    for(var ctxName in self.contexts) {
      var c = self.contexts[ctxName];

      if(c.markers.length > 0) {
        // Iterate over any markers
        for(var i = 0; i < c.markers.length; i++) {
          var m = c.markers[i];
          if(m.x1 !== undefined) {
            if(m.x2 !== undefined) {
              // XXX Draw a box
            } else {
              // Just a simple line
              ctx.beginPath();
              ctx.strokeStyle = m.color;
              ctx.lineWidth = 1;
              ctx.moveTo(m.x1, 0);
              ctx.lineTo(m.x1, self.height);
              ctx.stroke();
            }
          } else if(m.y1 !== undefined) {
            if(m.y2 !== undefined) {
              // XXX Draw a box
            } else {
              // Just a simple line
              ctx.beginPath();
              ctx.strokeStyle = m.color;
              ctx.lineWidth = 3;
              ctx.moveTo(0, m.y1);
              ctx.lineTo(self.width, m.y1);
              ctx.stroke();
            }
          }
        }
      }
    }
    this.decoCtx.clearRect(0, 0, this.width, this.height);
    this.decoCtx.drawImage(this.memElement, 0, 0);
  }
}

CLACK.LineRenderer = function() {

  this.draw = function(chart) {

    // Note that we're drawing on the in-memory canvas.
    var ctx = chart.memCtx;
    ctx.clearRect(0, 0, chart.width, chart.height);

    // Iterate over each context
    for(var ctxName in chart.contexts) {
      var c = chart.contexts[ctxName];

      // Iterate over each series
      for(var j = 0; j < c.series.length; j++) {
        // Create a new path for each series.
        ctx.beginPath();
        // Set color
        ctx.strokeStyle = c.series[j].color;
        ctx.lineWidth = 1;

        for(var k = 0; k < c.series[j].x.length; k++) {
          // Rounded to avoid sub-pixel rendering which isn't really useful
          ctx.lineTo(c.domainScale(c.series[j].x[k]), c.rangeScale(c.series[j].y[k]));
        }
        ctx.stroke();

        // If line point is desired.
        // ctx.beginPath();
        // _.each(_.zip(s.x, s.y), function(p) {
        //     ctx.fillStyle = s.color;
        //     // Rounded to avoid sub-pixel rendering which isn't really useful
        //     ctx.moveTo(
        //       Math.round(c.domainScale(p[0])),
        //       Math.round(c.rangeScale(p[1]))
        //     );
        //     ctx.arc(c.domainScale(p[0]), c.rangeScale(p[1]), 2, 0, 2 * Math.PI, true);
        // });
        // ctx.fill();
      }
    }

    // Copy the contents on the in-memory canvas into the displayed one.
    chart.ctx.clearRect(0, 0, this.width, this.height);
    chart.ctx.drawImage(chart.memElement, 0, 0);
  } 
}