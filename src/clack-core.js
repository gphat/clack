// Problems
// Assumes the data is sorted.
// context name defaults to default everywhere
// Doesn't do multiple contexts yet

var CLACK = CLACK || {};

CLACK.Context = function() {
  return {
    domainAxis: undefined,
    domainAxisOrientation: 'bottom',
    domainScale: undefined,
    domainScaleType: 'linear',
    showDomainAxis: true,
    showDomainGrid: true,
    showRangeAxis: true,
    showRangeGrid: true,
    maxLength: undefined,
    minLength: undefined,
    rangeAxis: undefined,
    rangeAxisOrientation: 'left',
    rangeScale: undefined,
    rangeScaleType: 'linear',
    renderer: undefined,
    root: undefined,
    series: [],
    xmax: -Infinity,
    xmin: Infinity,
    xrange: 0,
    ymax: -Infinity,
    ymin: Infinity,
    yrange: 0,
    markers: []
  };
};

// Make this an object…
CLACK.Chart = function(parent, options) {
  // XXX Make sure this is an object and give reasonable error messages.
  this.options = options || {};

  this.options.gridColor = this.options.gridColor || '#ccc';

  this.options.width = this.options.width || 500;
  this.options.height = this.options.height || 200;

  this.options.renderer = this.options.renderer || new CLACK.LineRenderer();

  // Clear the contents of the chart, destroying urthang.
  this.clear = function() {
    // Clean up the in memory stuff.
    this._memCtx = undefined;
    this._memElement = undefined;
    if(this.inner !== undefined) {
      $(this.inner).remove();
    }
    this.contexts = {
      default: new CLACK.Context()
    };
  };

  // Init some variables
  this.parent = parent;

  // Start things off clean.
  this.clear();

  this.inner = document.createElement('div');
  this.inner.className = 'clack-inner';
  this.inner.style.width = this.options.width + 'px';
  this.inner.width = this.options.width;
  this.inner.style.height = this.options.height + 'px';
  this.inner.height = this.options.height;
  parent.appendChild(this.inner);

  this.getDecorationCanvas = function() {
    // Add the topmost "decoration" canvas
    if(this._decoCtx === undefined) {
      this.decoElement = document.createElement('canvas');
      this.decoElement.style.position = 'absolute';
      // Only if the axes are here… XXX
      this.decoElement.style.left = "40px";
      this.decoElement.style.top = 0;
      this.decoElement.width = this.options.width;
      this.decoElement.height = this.options.height;
      this.decoElement.style.zIndex = 1;
      this.inner.appendChild(this.decoElement);
      this._decoCtx = this.decoElement.getContext('2d');
    }
    return this._decoCtx;
  };

  this.getContext = function(name) {
    return this.contexts[name];
  };

  this.addMarker = function(marker) {
    var ctx = this.contexts['default'];

    ctx.markers.push(marker);

    this.updateContext('default');
    return ctx.markers.length;
  };

  this.addSeries = function(ctxName, series) {
    var ctx = this.contexts[ctxName];

    if(ctx === undefined) {
      // A new context appears!
      ctx = new CLACK.Context();
      this.contexts[ctxName] = ctx;
    }

    ctx.series.push(series);
    // Establish some defaults that can be later.
    series.xmax = -Infinity;
    series.xmin = Infinity;
    series.xrange = 0;
    series.ymax = -Infinity;
    series.ymin = Infinity;
    series.yrange = 0;
    var idx = ctx.series.length - 1;
    this.updateSeries(ctxName, idx);
    return idx;
  };

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
  };

  // Update stats for the series.
  this.updateSeries = function(ctxName, index) {
    var ctx = this.contexts[ctxName];
    series = ctx.series[index];

    series.xmax = d3.max(series.x);
    series.xmin = d3.min(series.x);

    series.ymax = d3.max(series.y);
    series.ymin = d3.min(series.y);

    series.xrange = series.xmax - series.xmin;
    series.yrange = series.ymax - series.ymin;

    this.updateContext(ctxName);
  };

  // Update stats for the context.
  this.updateContext = function(ctxName) {
    var ctx = this.contexts[ctxName];
    // Iterate through each series, establishing the maxes of x and y.
    // Start with the values backwards so that min and max work.
    var xmax = -Infinity;
    var ymax = -Infinity;
    var xmin = Infinity;
    var ymin = Infinity;
    var maxLength = -Infinity;
    var minLength = Infinity;
    for(var i = 0; i < ctx.series.length; i++) {
      var s = ctx.series[i];
      // It is assumed that there are an equal number of xs and ys, but that's not
      // asserted anywhere. XXX
      maxLength = Math.max(maxLength, s.x.length);
      minLength = Math.min(minLength, s.x.length);
      xmax = Math.max(xmax, s.xmax);
      xmin = Math.min(xmin, s.xmin);
      ymax = Math.max(ymax, s.ymax);
      ymin = Math.min(ymin, s.ymin);
    }

    // Do the same for any markers.
    for(var j = 0; j < ctx.markers.length; j++) {
      var m = ctx.markers[j];
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

    ctx.maxLength = maxLength;
    ctx.minLength = minLength;
    ctx.xmax = xmax;
    ctx.xmin = xmin;
    ctx.ymax = ymax;
    ctx.ymin = ymin;

    // Set the range based on what we know now.
    ctx.xrange = ctx.xmax - ctx.xmin;
    ctx.yrange = ctx.ymax - ctx.ymin;

    // Create the scales if they don't exist.
    if(ctx.domainScale === undefined) {
      ctx.domainScale = CLACK.makeScale(ctx.domainScaleType);
      ctx.rangeScale = CLACK.makeScale(ctx.rangeScaleType);
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
  };

  // Draw the chart. Erases everything first.
  this.draw = function() {
    // console.time('draw');
    for(var ctxName in this.contexts) {
      var c = this.contexts[ctxName];
      if(c.renderer === undefined) {
        // If this context has no renderer, use the default one.
        // XXX Maybe this should go?
        c.renderer = this.options.renderer;
      }

      // These are hardcoded and completely wrong.
      var marginLeft = 40;
      var marginBottom = 20;
      var marginTop = 20;
      var marginRight = 40;

      var cWidth = this.inner.width - marginLeft - marginRight;
      var cHeight = this.inner.height - marginBottom - marginTop;

      c.domainScale.rangeRound([0, cWidth]);
      c.rangeScale.rangeRound([cHeight, 0]);

      this.drawAxes(this.inner, ctxName, {
        top: marginTop,
        right: marginRight,
        bottom: marginBottom,
        left: marginLeft
      });

      // Create a root element in which the renderer can create whatever it needs
      if(c.root === undefined) {
        var e = document.createElement('div');
        e.style.display = 'block';
        e.style.position = 'absolute';
        e.style.left = marginLeft + "px";
        e.style.top = marginTop + "px";
        e.style.width = cWidth + "px";
        e.style.height = cHeight + "px";
        this.inner.appendChild(e);
        c.root = e;
      }
      c.renderer.draw(c, c.root, this);
    }
    // console.timeEnd('draw');
  };

  // this.drawDecorations = function() {
  //   var self = this;

  //   var ctx = this.getMemoryCanvas();
  //   // Clear the in-memory context for the renderer.
  //   ctx.clearRect(0, 0, this.options.width, this.options.height);
  //   // Begin a new path, just in case
  //   ctx.beginPath();

  //   for(var ctxName in self.contexts) {
  //     var c = self.contexts[ctxName];
  //     if(c.markers.length > 0) {
  //       // Iterate over any markers
  //       for(var i = 0; i < c.markers.length; i++) {
  //         var m = c.markers[i];
  //         if(m.x1 !== undefined) {
  //           if(m.x2 !== undefined) {
  //             // XXX Draw a box
  //           } else {
  //             // Just a simple line
  //             ctx.beginPath();
  //             ctx.strokeStyle = m.color;
  //             ctx.lineWidth = 1;
  //             ctx.moveTo(m.x1, 0);
  //             ctx.lineTo(m.x1, self.options.height);
  //             ctx.stroke();
  //           }
  //         } else if(m.y1 !== undefined) {
  //           if(m.y2 !== undefined) {
  //             // XXX Draw a box
  //           } else {
  //             // Just a simple line
  //             ctx.beginPath();
  //             ctx.strokeStyle = m.color;
  //             ctx.lineWidth = 3;
  //             ctx.moveTo(0, m.y1);
  //             ctx.lineTo(self.options.width, m.y1);
  //             ctx.stroke();
  //           }
  //         }
  //       }
  //     }
  //   }
  // };

  this.drawAxes = function(parent, ctxName, margins) {
    var context = this.contexts[ctxName];

    // No axes? don't bother then.
    if(!context.showDomainGrid && !context.showRangeGrid && !context.showRangeAxis && !context.showDomainAxis) {
      return;
    }

    if(context.showDomainGrid || context.showRangeGrid || context.showRangeAxis || context.showDomainAxis) {
      if(context.d3shit === undefined) {
        context.d3shit = d3.select(parent)
          .append("svg")
          .attr("class", "chart")
          .attr("clack-context", context)
          .attr("width", parent.width)
          .attr("height", parent.height)
          .style("position", "absolute")
          .style("top", 0)
          .style("left", 0)
          .append("g");
      }
    } else {
      // Nix the svg, if we have one!
      // XXX Must we use jquery here?
      $(this.inner).find("svg").remove();
      context.d3shit = undefined;
      // Nothing else to do, return.
      return;
    }

    margins = margins || {};
    margins.left = margins.left || 40;
    margins.right = margins.right || 0;
    margins.bottom = margins.bottom || 40;
    margins.top = margins.top || 0;

    // The default "bottom" case
    var domX = margins.left;
    var domY = parent.height - margins.bottom;
    if(context.domainAxisOrientation === "top") {
      domX = margins.left;
      domY = margins.top;
    }

    // The default "left" case
    var rangeX = margins.left;
    var rangeY = margins.top;
    if(context.rangeAxisOrientation === "right") {
      rangeX = parent.width - margins.right;
      rangeY = margins.top;
    }

    // Handle the axes in the common draw method before calling the renderer.
    // Only create the axes if they don't already exist.
    if(context.showDomainAxis || context.showRangeAxis) {
      if(context.showDomainAxis) {
        if(context.domainAxis === undefined) {
          context.domainAxis = d3.svg.axis().scale(context.domainScale).orient(context.domainAxisOrientation).tickSize(1);
          context.ax = context.d3shit.append('g')
            .attr("class", "xaxis")
            .attr("transform", "translate(" + domX + "," + domY + ")")
            .call(context.domainAxis);
        } else {
          context.ax.transition().call(context.domainAxis);
        }
      }
      if(context.showRangeAxis) {
        if(context.rangeAxis === undefined) {
          context.rangeAxis = d3.svg.axis().scale(context.rangeScale).orient(context.rangeAxisOrientation).tickSize(1);
          context.ay = context.d3shit.append('g')
            .attr("class", "yaxis")
            .attr("transform", "translate(" + rangeX + "," + rangeY + ")")
            .call(context.rangeAxis);
        } else {
          context.ay.transition().call(context.rangeAxis);
        }
      }
    }

    // remove the ticks. Can't get them to move right so be lazy and re-add them. XXX
    if(context.showDomainGrid === true) {
      context.d3shit.selectAll("line.x").remove();

      context.d3shit.selectAll("line.x")
        .data(context.domainScale.ticks(5))
        .enter().append("line")
        .attr("class", "x")
        .attr("x1", context.domainScale)
        .attr("x2", context.domainScale)
        .attr("y1", margins.top)
        .attr("y2", this.options.height - margins.bottom)
        .attr("transform", "translate(" + margins.left + ", 0)")
        .style("stroke", this.options.gridColor);
    }
    if(context.showRangeGrid === true) {
      context.d3shit.selectAll("line.y").remove();

      context.d3shit.selectAll("line.y")
        .data(context.rangeScale.ticks(5))
        .enter().append("line")
        .attr("class", "y")
        .attr("x1", 0)
        .attr("x2", this.options.width - margins.left - margins.right)
        .attr("y1", context.rangeScale)
        .attr("y2", context.rangeScale)
        .attr("transform", "translate(" + margins.left + " , 0)")
        .style("stroke", this.options.gridColor);
    }
  };
};

// Convencience function for creating a scale based
// on a string name.
CLACK.makeScale = function(type) {
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
};
