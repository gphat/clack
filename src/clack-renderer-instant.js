// Doesn't know how to deal with added series. :(
CLACK.InstantRenderer = function(options) {
  options = options || {};

  options.formatter = options.formatter || d3.format(".2f");

  this.domSeriesDivs = undefined;

  this.clear = function() {
    if(this.element !== undefined) {
      ($this.element).remove();
    }
  };

  this.draw = function(c, parent, chart) {

     if(this.element === undefined) {
      this.element = document.createElement('div');
      parent.appendChild(this.element);
    }

    // Making these here so that aren't being made inside the loop
    var nameFetcher = function(s) {
      return s.name;
    };
    var minFormatter = function(s) {
      return options.formatter(s.ymin);
    };
    var maxFormatter = function(s) {
      return options.formatter(s.ymax);
    };
    var currFormatter = function(s) {
      return options.formatter(s.y[s.y.length - 1]);
    };

    if(this.demSeriesDivs === undefined) {
      this.demSeriesDivs = d3.select(this.element).selectAll("div")
        // XXX Need a key for efficient updates here, series name or a UUID or something?
        .data(c.series)
        .enter().append('div')
        .style('display', 'inline-block')
        .style('margin', '3px')
        .style('padding', '3px')
        .style('border', '1px solid #efefef');

      // Name
      this.demSeriesDivs.append('p').text(nameFetcher)
        .style('font-size', '1em')
        .style('font-weight', 'bold')
        .style('text-align', 'center')
        .style('border-bottom', '1px solid #ccc')
        .style('padding', '.05em');

      // Min
      this.demSeriesDivs.append('p').text(minFormatter)
        .style('text-align', 'center')
        .attr('data-min', 'true');

      // Current
      this.demSeriesDivs.append('div')
        .text(currFormatter)
        .style('border-bottom', '1px solid #ccc')
        .style('border-top', '1px solid #ccc')
        .style('font-size', '2em')
        .style('font-weight', 'bold')
        .style('padding', '.25em')
        .style('text-align', 'center')
        .attr('data-current', 'true');

      // Max
      this.demSeriesDivs.append('p').text(maxFormatter)
        .style('font-size', '1em')
        .style('font-weight', 'bold')
        .style('text-align', 'center')
        .style('padding', '.05em')
        .attr('data-max', 'true');
    } else {
      this.demSeriesDivs.data(c.series).selectAll("div[data-min=true]")
        .text(minFormatter);

      this.demSeriesDivs.data(c.series).selectAll("div[data-current=true]")
        .text(currFormatter);

      this.demSeriesDivs.data(c.series).selectAll("div[data-max=true]")
        .text(maxFormatter);
    }
  };
};
