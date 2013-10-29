# Clack

Clack might be a charting library. It's really just a side project that may or may not turn in to anything.

## Features

* Canvas based
* Scales: Linear, time, log and some others I don't really understand (power, quartile, quantile and threshold)
* Markers (arbitrary x and y charts with optional ranges)
* Can be updated dynamically (adding data on the fly, requires sorting for now)

## Goals

### Leverage D3 or whatever makes sense.

Renderers can use whatever they want, so long as they stay within their dom element. This might be D3 or Canvas or WebGL!

### Flexible

Clack will stay out of your way. Most changes will require working directly with the [Canvas API](https://developer.mozilla.org/en-US/docs/HTML/Canvas).

### Dynamic updates

Data should be able to be added to a chart on the fly and rerendered.

### Fast

Needs to be able to deal with thousands of series each with tens of thousands of points.

### Don't Give A Shit About File Size

Not at all.

## Dependencies

* [D3](http://d3js.org/) for scales and other bits.

The demo and tests require [jQuery](http://jquery.com/) but it is not required for your own use.