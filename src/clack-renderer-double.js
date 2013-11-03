CLACK.DoubleRenderer = function(options) {
  options = options || {};

  this.clear = function() {
    if(this.element !== undefined) {
      ($this.element).remove();
    }
  };

  this.draw = function(c, parent, chart) {
    var parentWidth = parseInt(parent.style.width, 10);
    var parentHeight = parseInt(parent.style.height, 10);

    // Create our canvas element if we haven't already.
    if(this.leftElement === undefined) {
      this.leftElement = document.createElement('div');
      this.leftElement.style.display = 'inline-block';
      this.leftElement.style.position = 'relative';
      this.leftElement.style.width = parentWidth + 'px';
      this.leftElement.style.height = parentHeight + 'px';
      parent.appendChild(this.leftElement);
    }

    // Create our canvas element if we haven't already.
    if(this.rightElement === undefined) {
      this.rightElement = document.createElement('div');
      this.rightElement.style.display = 'inline-block';
      this.rightElement.style.position = 'relative';
      this.rightElement.style.width = parentWidth + 'px';
      this.rightElement.style.height = parentHeight + 'px';
      parent.appendChild(this.rightElement);
    }

    options.leftRenderer.draw(c, this.leftElement, chart);
    options.rightRenderer.draw(c, this.rightElement, chart);
  };
};
