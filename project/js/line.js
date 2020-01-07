var origin_data = {
	x:[1970,1971,1972,1973,1974,1975,1976,1977,1978,1979,1980,1981,1982,1983,1984,1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020],
	y:[6,11,17,44,26,58,55,107,79,159,133,169,216,242,278,393,471,590,687,872,946,1110,1133,1439,1595,1489,1637,1775,2152,2336,2467,2862,2939,3533,3844,4483,4627,5759,5562,5721,6156,7020,7321,8227,8608,9948,10304,10723,12658,10653,10653]
}

var margin = {
	left: 40, top: 0
}
var data = [];
for (var i = 0; i < origin_data.x.length; i++) {
	var d = {};
	d.x = origin_data.x[i];
	d.y = origin_data.y[i];
	data.push(d);
}


var svg = d3.select('#svg_bottom');
// var width = svg.attr("width");
// var height =svg.attr("height");
var width = 1100;
var height = 40;
var x = d3.scaleLinear().range([0,width]);
var y = d3.scaleLinear().range([height,0]);

x.domain([d3.min(data, function(d) { return d.x; }), d3.max(data, function(d) { return d.x; })]);
y.domain([0, d3.max(data, function(d) { return d.y; })]);

var xAxis = d3.axisBottom(x);
var yAxis = d3.axisLeft(y);

// var brush = d3.brushX()
//     .extent([[0, 0], [width, height]])
//     .on("brush end", brushed);

var line = d3.line()
    // .interpolate("linear")
    .x(function(d) { return x(d.x); })
    .y(function(d) { return y(d.y); })

var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    // .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

// function brushed() {
//   if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
//   var s = d3.event.selection || x2.range();
//   x.domain(s.map(x2.invert, x2));
//   focus.selectAll(".line").attr("d", line);
//   focus.select(".axis--x").call(xAxis);
//   svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
//       .scale(width / (s[1] - s[0]))
//       .translate(-s[0], 0));
// }
context.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line)

context.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);