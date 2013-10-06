// XXX Assumes the data is sorted.
// context name defaults to default everywhere
// No way to set line widths

// Ideas
// Is this applicable: http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/

function chart(element, decoElement) {
  this.contexts = {
    default: {    
      this: {},
      domainAxis: undefined,
      rangeAxis: undefined,
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
  this.scale = 'linear',
  // paper.setup(element);
  this.element = element;
  this.decoElement = decoElement;

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
  }

  this.draw = function() {
    console.time("draw");
    var height = $(element).height();
    var width = $(element).width();

    var ctx = element.getContext('2d');
    ctx.fillStyle='#FFFFFF';
    ctx.clearRect(0, 0, width, height);

    // Iterate over each context
    _.each(_.values(this.contexts), function(c) {

      // Create a domain and range scale
      // XXX Could probably generate this once then adjust the domain/range.
      var domainScale = d3.scale.linear()
        .domain([c.xmin, c.xmax])
        .range([0, width]);
      var rangeScale = d3.scale.linear()
        .domain([c.ymin, c.ymax])
        .range([height, 0]);

      // Iterate over each series
      _.each(c.series, function(s) {
        // console.log(s);
        ctx.beginPath();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1;
        _.each(_.zip(s.x, s.y), function(p) {
            // Rounded to avoid sub-pixel rendering which isn't really useful
            ctx.lineTo(
              Math.round(domainScale(p[0])),
              Math.round(rangeScale(p[1]))
            );
        });
        ctx.stroke();
      });
    });
    console.timeEnd('draw');
  }

  this.drawDecorations = function() {
    // console.time('drawDecorations');
    var height = $(decoElement).height();
    var width = $(decoElement).width();
    var ctx = decoElement.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    _.each(_.values(this.contexts), function(c) {
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
              ctx.lineTo(m.x1, height);
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
              ctx.lineTo(width, m.y1);
              ctx.stroke();
            }
          }
        });
      }
    });
    // console.timeEnd('drawDecorations');
  }
}