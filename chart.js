// XXX Assumes the data is sorted.
// context name defaults to default everywhere
// No way to set line widths

// Ideas
// Is this applicable: http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/

function chart(element, decoElement) {
  this.contexts = {
    default: {    
      this: {},
      domainScale: undefined,
      domainScaleType: 'linear',
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
  // paper.setup(element);
  this.element = element;
  this.decoElement = decoElement;

  this.height = element.clientHeight;
  this.width = element.clientWidth;

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

  this.addToSeries = function(ctxName, index, exes, whys) {

    var ctx = this.contexts[ctxName];

    series = ctx.series[index];

    if((exes instanceof Array) && (whys instanceof Array)) {
      series.x = series.x.concat(exes);
      series.y = series.y.concat(whys);
    }
    this.updateSeries(ctxName, index, exes, whys);
  }

  this.updateSeries = function(ctxName, index, exes, whys) {
    var ctx = this.contexts[ctxName];

    series = ctx.series[index];

    series.xmax = Math.max(d3.max(exes), series.xmax);
    series.xmin = Math.min(d3.min(exes), series.xmin);

    series.ymax = Math.max(d3.max(whys), series.ymax);
    series.ymin = Math.min(d3.min(whys), series.ymin);

    series.xrange = series.xmax - series.xmin;
    series.yrange = series.ymax - series.ymin;

    ctx.series[index] = series;

    this.updateContext(ctxName);
  }

  this.updateContext = function(ctxName) {
    var ctx = this.contexts[ctxName];

    _.each(ctx.series, function(s) {
      ctx.xmax = Math.max(ctx.xmax, s.xmax);
      ctx.xmin = Math.min(ctx.xmin, s.xmin);
      ctx.ymax = Math.max(ctx.ymax, s.ymax);
      ctx.ymin = Math.min(ctx.ymin, s.ymin);
    });

    _.each(ctx.markers, function(m) {
      if(m.x1 !== undefined) {
        ctx.xmin = Math.min(ctx.xmin, m.x1);
      }
      if(m.x2 !== undefined) {
        ctx.xmax = Math.max(ctx.xmax, m.x2);
      }
      if(m.y1 !== undefined) {
        ctx.ymin = Math.min(ctx.ymin, m.y1);
      }
      if(m.y2 !== undefined) {
        ctx.ymax = Math.max(ctx.ymax, m.y2);
      }
    });

    ctx.xrange = ctx.xmax - ctx.xmin;
    ctx.yrange = ctx.ymax - ctx.ymin;

    // Create the scales if they don't exist.
    if(ctx.domainScale === undefined) {
      ctx.domainScale = this.makeScale(ctx.domainScaleType);
      ctx.domainScale.range([0, this.width]);
    
      ctx.rangeScale = this.makeScale(ctx.rangeScaleType);;
      ctx.rangeScale.range([this.height, 0]);
    }

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

    ctx.domainScale.domain([ctx.xmin, ctx.xmax]);
    ctx.rangeScale.domain([ctx.ymin, ctx.ymax]);
  }

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

  this.draw = function() {
    // console.time("draw");

    var ctx = element.getContext('2d');
    ctx.clearRect(0, 0, this.width, this.height);

    // Iterate over each context
    _.each(_.values(this.contexts), function(c) {

      // Iterate over each series
      _.each(c.series, function(s) {
        // console.log(s);
        ctx.beginPath();
        ctx.strokeStyle = s.color;
        ctx.fillStyle = s.color;
        ctx.lineWidth = 1;
        _.each(_.zip(s.x, s.y), function(p) {
            // Rounded to avoid sub-pixel rendering which isn't really useful
            ctx.lineTo(
              Math.round(c.domainScale(p[0])),
              Math.round(c.rangeScale(p[1]))
            );
        });
        ctx.stroke();

        // If line point is desired.
        // ctx.beginPath();
        // _.each(_.zip(s.x, s.y), function(p) {
        //     // Rounded to avoid sub-pixel rendering which isn't really useful
        //     ctx.moveTo(
        //       Math.round(c.domainScale(p[0])),
        //       Math.round(c.rangeScale(p[1]))
        //     );
        //     ctx.arc(c.domainScale(p[0]), c.rangeScale(p[1]), 2, 0, 2 * Math.PI, true);
        // });
        // ctx.fill();
      });
    });
    // console.timeEnd('draw');
  }

  this.drawDecorations = function() {
    var self = this;
    var ctx = decoElement.getContext('2d');
    ctx.clearRect(0, 0, self.width, self.height);
    _.each(_.values(self.contexts), function(c) {
      if(c.markers.length > 0) {
        // Iterate over any markers
        _.each(c.markers, function(m) {
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
        });
      }
    });
  }
}