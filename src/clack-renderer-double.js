CLACK.DoubleRenderer = function(options) {
  options = options || {};

  this.clear = function() {
    if(this.element !== undefined) {
      ($this.element).remove();
    }
  };

  this.draw = function(c, parent, chart) {
    // Create our canvas element if we haven't already.
    if(this.leftElement === undefined) {
      this.leftElement = document.createElement('div');
      // this.element.style.position = 'absolute';
      // Only if the axes are here… XXX
      // this.element.style.left = marginLeft + "px";
      // this.element.style.top = marginTop + "px";
      this.leftElement.style.display = 'inline-block';
      this.leftElement.style.position = 'relative';
      this.leftElement.width = (parent.width - marginLeft - marginRight) / 2;
      this.leftElement.height = parent.height - marginTop - marginBottom;
      // this.element.style.zIndex = 0;
      parent.appendChild(this.leftElement);
    }

    // Create our canvas element if we haven't already.
    if(this.rightElement === undefined) {
      this.rightElement = document.createElement('div');
      // this.element.style.position = 'absolute';
      // Only if the axes are here… XXX
      // this.element.style.left = marginLeft + "px";
      // this.element.style.top = marginTop + "px";
      this.rightElement.style.display = 'inline-block';
      this.rightElement.style.position = 'relative';
      this.rightElement.width = (parent.width - marginLeft - marginRight) / 2;
      this.rightElement.height = parent.height - marginTop - marginBottom;
      // this.element.style.zIndex = 0;
      parent.appendChild(this.rightElement);
    }

    options.leftRenderer.draw(c, this.leftElement, chart);
    options.rightRenderer.draw(c, this.rightElement, chart);
  };
};
