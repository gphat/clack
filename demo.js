function Message(data) {
  this.type = ko.observable(data.type);
  this.text = ko.observable(data.text);
}

function Series(data) {
  this.color = ko.observable(data.color);
  this.name = ko.observable(data.name);
}

function DemoViewModel() {
  var self = this;

  self.clack = new CLACK.Chart(
    document.getElementById('chartContainer'), { width: 500, height: 200 }
  );
  self.clack.renderer = new CLACK.LineRenderer();

  self.axes = ko.observable(true);
  self.colorPicker = d3.scale.category20();
  self.message = ko.observable();
  self.points = 30;
  self.renderer = ko.observable("LineRenderer");
  self.renderers = ko.observableArray(["LineRenderer", "ScatterPlotRenderer", "HistogramHeatMapRenderer"]);
  self.seriesCount = ko.observable(0);
  self.series = ko.observableArray([]);

  self.axes.subscribe(function(a) {
    self.clack.options.axes = a;
    self.refresh();
  }); 

  // Deal with changes to the renderer
  self.renderer.subscribe(function(r) {
    if(CLACK[r] === undefined) {
      self.message(new Message({ type: 'alert-danger', text: "Unable to create renderer '" + r + "'" }));
    } else {
      self.clack.renderer = new CLACK[r]();
      self.refresh();
    }
  });

  // Deal with changes in data.
  self.series.subscribe(function() {
    var currentDate = new Date();
    self.clack.clear();
    for(var j = 0; j < self.series().length; j++) {
      var s = self.series()[j];
      var exes = [];
      var whys = [];
      for(var i = 0; i <= self.points; i++) {
        exes.push(i);
        whys.push((j + 1) * Math.sin(2 * Math.PI * j + i + currentDate.getSeconds()));
      }
      self.clack.addSeries({
        x: exes,
        y: whys,
        label: s.name(),
        color: s.color()
      });
    }
    self.refresh();
  });

  self.refresh = function() {
    self.clack.draw();    
    self.clack.drawDecorations();
  }

  self.addSeries = function() {
    self.series.push(new Series({
      color: self.colorPicker(self.seriesCount()),
      name: 'Series ' + self.seriesCount()
    }));
    self.seriesCount(self.seriesCount() + 1);
  }

  self.removeSeries = function(s) {
    self.series.remove(s);
  }
}