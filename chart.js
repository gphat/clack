function chart(element) {
  this.contexts = {
    default: {    
      this: {},
      domainAxis: undefined,
      rangeAxis: undefined,
      series: [],
      xmax: undefined,
      xmin: undefined,
      xrange: undefined,
      ymax: undefined,
      ymin: undefined,
      yrange: undefined,
    }
  };
  this.scale = 'linear',
  paper.setup(element);
  this.element = element;

  this.getContext = function(name) {
    return this.contexts[name];
  }

  this.addSeries = function(series) {
    var ctx = this.contexts['default'];

    ctx.series.push(series);
    var idx = ctx.series.length - 1;
    this.updateSeries('default', idx);
    return idx;
  }

  this.addToSeries = function(ctxName, index, exes, whys) {

    var ctx = this.contexts[ctxName];

    series = ctx.series[index];

    if((exes instanceof Array) && (whys instanceof Array)) {
      series.x = series.x.concat(exes);
      series.y = series.y.concat(whys);
    }
    this.updateSeries(ctxName, index);
  }

  this.updateSeries = function(ctxName, index) {
    var ctx = this.contexts[ctxName];

    series = ctx.series[index];

    series.xmin = d3.min(series.x);
    series.xmax = d3.max(series.x);

    series.ymin = d3.min(series.y);
    series.ymax = d3.max(series.y);

    series.xrange = series.xmax - series.xmin;
    series.yrange = series.ymax - series.ymin;

    ctx.series[index] = series;

    this.updateContext(ctxName);
  }

  this.updateContext = function(ctxName) {
    var ctx = this.contexts[ctxName];

    _.each(ctx.series, function(s) {
      if(ctx.xmax === undefined || ctx.xmax < s.xmax) {
        ctx.xmax = s.xmax;
      }
      if(ctx.xmin === undefined || ctx.xmin > s.xmin) {
        ctx.xmin = s.xmin;
      }
      if(ctx.ymax === undefined || ctx.ymax < s.ymax) {
        ctx.ymax = s.ymax;
      }
      if(ctx.ymin === undefined || ctx.ymin > s.ymin) {
        ctx.ymin = s.ymin;
      }
      ctx.xrange = ctx.xmax - ctx.xmin;
      ctx.yrange = ctx.ymax - ctx.ymin;
    });
  }

  this.draw = function() {

    // Iterate over each context
    _.each(_.values(this.contexts), function(ctx) {

      // Create a domain and range scale
      // XXX Could probably generate this once then adjust the domain/range.
      var domainScale = d3.scale.linear()
        .domain([ctx.xmin, ctx.xmax])
        .range([0, $(element).width()]);
      var rangeScale = d3.scale.linear()
        .domain([ctx.ymin, ctx.ymax])
        .range([$(element).height(), 0]);

      // Iterate over each series
      _.each(ctx.series, function(s) {
        if(s.hasOwnProperty('layer')) {
          // If we have a layer, remove it.
          s.layer.remove();
        }
        // Make a new layer and activate it.
        var layer = new paper.Layer();
        layer.activate();
        // Make a path for the series.
        var path = new paper.Path();
        // Set the color of the stroke
        path.strokeColor = s.color;
        path.strokeWidth = 1;
        s.layer = layer;
        // Zip together the x,y and iterate over them drawing lines.
        _.reduce(_.zip(s.x, s.y), function(last, p) {
          if(last === undefined) {
            path.moveTo(domainScale(p[0]), rangeScale(p[1]));
          } else {
            path.lineTo(domainScale(p[0]), rangeScale(p[1]));
          }
          return p;
        }, undefined);
      });
    });

    paper.view.draw();
  }
}