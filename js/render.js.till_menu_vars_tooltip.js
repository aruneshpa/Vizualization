var outerWidth = 1000;
var outerHeight = 500;
var margin = {left:30, top:30, bottom:30, right:30};
var innerWidth = outerWidth - margin.left - margin.right;
var innerHeight = outerHeight - margin.top - margin.bottom;

// Create a dataset to contain the height of the players
var dataset = [];
function render(arg) {
    if (arg === null) {
        arg = HR;
    }
    var formatCount = d3.format(",.0f");
    d3.csv("baseball_data_full.csv", function(data) {
        dataset = data.map(function(d) {
            return +d[arg];
        });
   
        // Create a SVG element
        var svg = d3.select("body").append("svg")
                .attr("width", outerWidth)
                .attr("height", outerHeight);

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                return "<strong>" + arg + ":</strong> <span style='color:red'>" + d.length + "</span>";
            })

        svg.call(tip);
        // Create a group so that properties can be applied
        // to DOM elements at once
        var g = svg.append("g")
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
        
        var minmax = d3.extent(data, function(d) { return +d[arg]; });
        // Creating scale function with domain and range
        var x = d3.scaleLinear()
            .domain(minmax)
            .rangeRound([margin.left, innerWidth]);
            
        // Just the max wont do. what if max is 138 and intervals are 10?
        var tickSize = x.ticks()[1] - x.ticks()[0];
        x.domain([minmax[0]-minmax[0]%tickSize, (minmax[1] + tickSize) - minmax[1]%tickSize])

        // Create the bins. domain will be x. Length of a bin will
        // be the number of the items in each bin
        var bins = d3.histogram()
            .domain(x.domain())
            .thresholds(x.ticks(10))
            (dataset);

        var y = d3.scaleLinear()
            .domain([0, d3.max(bins, function(d) { return d.length; })])
            .range([innerHeight, 0]);

        var bar = g.selectAll(".bar")
            .data(bins)
            .enter().append("g")
                .attr("class", "bar")
                .attr("transform", function(d) {return "translate(" + x(d.x0) + "," + y(d.length) + ")"; });

        bar.append("rect")
            .attr("x", 1)
            .attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
            .attr("height", function(d) { return innerHeight - y(d.length); })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
        
        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + innerHeight + ")")
            .call(d3.axisBottom(x));
    });
}