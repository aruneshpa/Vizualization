var outerWidth = 694;
var outerHeight = 500;
var margin = {left: 30, top: 30, bottom: 30, right: 30};
var innerWidth = outerWidth - margin.left - margin.right;
var innerHeight = outerHeight - margin.top - margin.bottom;
var radius = Math.min(innerWidth, innerHeight) / 2;
var isPaused = false;
var bins = [];
var binsizechanged = 10;

// ChartType Var to determine what type is selected. 1- Bar, 2-Pie
var chartType = 0;
function render() {
//    svg.selectAll("*").remove();
    
    // Set the appropriate chart type
    chartType = 1;
    var arg = document.getElementById("parameter").innerHTML;
    if (arg.includes("Parameter") || !arg || arg == "") {
        // Nothing has been set yet
        arg = "weight";
    }
    
    binsize = binsizechanged;
    if (arg === "avg") {
        // Scaling the avg
        binsize = binsize/1000;
    } 
    // Create a dataset to contain the height of the players
    var dataset = [],
        formatCount = d3.format(",.0f");
    
    // Parse the data
    d3.csv("data/baseball_data_full.csv", function (data) {
        dataset = data.map(function (d) {
            return +d[arg];
        });

        // Create a SVG element
        // clear the inner HTML
        document.getElementById("svg-container").innerHTML = "";
        var svg = d3.select("#svg-container").append("svg")
                    .attr("width", outerWidth)
                    .attr("height", outerHeight)
                    .attr("id", "chartSVG");
        

        // Create a group so that properties can be applied to DOM elements at once
        var g = svg.append("g")
                    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

        // Color variable (alternative to scale ordinal)
        var color = d3.scaleOrdinal(d3.schemeCategory10);
        
        // Tip function
        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function (d) {
                var label = parseFloat(d.x0).toFixed(2) + "-" + parseFloat(d.x1).toFixed(2);
                return "<strong>" + arg + ":</strong> </br>" + "Bin Size: <span style='color:red'>" + label + "</span></br> Count: <span style='color:red'>" + d.length + "</span>";
            });

        svg.call(tip);
        
        var minmax = d3.extent(data, function (d) { return +d[arg]; });
        // Creating scale function with domain and range
        var x = d3.scaleLinear()
            .domain(minmax)
            .rangeRound([margin.left, innerWidth]);
            
        // Just the max wont do. what if max is 138 and intervals are 10?
        var tickSize = x.ticks()[1] - x.ticks()[0];
        x.domain([minmax[0] - minmax[0] % tickSize, (minmax[1] + tickSize) - minmax[1] % tickSize]);

        // Create the bins. domain will be x. threshholds = no of bins = (max - min)/binsize
        bins = d3.histogram()
            .domain(x.domain())
            .thresholds(Math.ceil((minmax[1] - minmax[0])/binsize))
            (dataset);

        // scale for y (d.length)
        var y = d3.scaleLinear()
            .domain([0, d3.max(bins, function (d) { return d.length; })])
            .range([innerHeight, 0]);

        // set the style and create a bar
        var bar = g.selectAll(".bar")
            .data(bins)
            .enter().append("g")
                .attr("class", "bar")
                .attr("transform", function (d) {return "translate(" + x(d.x0) + "," + y(d.length) + ")"; });

        // Set an id for this rect as well so that we can set the color accordingly
        bar.append("rect")
            .attr("id", function(d, i) { return i; })
            .attr("x", 1)
            .attr("width", Math.max(0, x(bins[0].x1) - x(bins[0].x0) - 2))
            .attr("height", function (d) { return innerHeight - y(d.length); })
            .attr("fill", function(d, i) { return color(i); })
            .on('mouseover', function(d) { 
                    tip.show(d);
                    d3.select(this)
                        .attr("width", x(bins[0].x1) - x(bins[0].x0) + 5)
                        .attr("height", function (d) { return Math.max(0, innerHeight - y(d.length) - 6); })
                        .attr("fill", "red")
                })
            .on('mouseout', function(d) { 
                    tip.hide(d);
                    d3.select(this)
                        .attr("width", x(bins[0].x1) - x(bins[0].x0) - 2)
                        .attr("height", function (d) { return innerHeight - y(d.length); })
                        .attr("fill", function(){ return "" + color(this.id); })
                });
        
        // append the axis
        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + innerHeight + ")")
            .call(d3.axisBottom(x));
        
        d3.selectAll("#binsize").on("mousedown", function() {
            // mark the button as active
            var button = d3.select(this)
                .classed("active", true);
            
            // set the handlers
            var w = d3.select(this)
                .on("mousemove", mousemovehandler)
                .on("mouseup", mouseuphandler);
            
            d3.event.preventDefault();
            function mousemovehandler() {                
				if (arg === "avg") {
                    button.text("Bin Size-" + (parseFloat(d3.mouse(button.node())[0])/1000).toFixed(2));
                } else {
                    button.text("Bin Size-" + parseInt(d3.mouse(button.node())[0]));
                }
				binsizechanged = d3.mouse(button.node())[0];
                render();
            }
            
            function mouseuphandler() {
                button.classed("active", false);
                w.on("mousemove", null)
                 .on("mouseup", null);
            }
        });
    });
}

function render_pie(arg) {
    // Set the appropriate chart type
    chartType = 2;
    
    var arg = document.getElementById("parameter").innerHTML;
    if (arg.includes("Parameter") || !arg || arg == "") {
        // Nothing has been set yet
        arg = "weight";
    }
    binsize = binsizechanged;
	if (arg === "avg") {
        // Scaling the avg
        binsize = binsize/1000;
    }
    // define the arc generator
    var arc = d3.arc()
        .outerRadius(radius)
        .innerRadius(0);
    
    // define the label arc generator. Same outer and inner radius
    // More like a point
    var labelArc = d3.arc()
        .outerRadius(radius - 50)
        .innerRadius(radius - 50);
    
    // define the pie generator
    var pie = d3.pie()
        .sort(null)
        .value(function (d) { return d.length; });
    
    // create svg
    // clear the inner HTML
    document.getElementById("svg-container").innerHTML = "";
    var svg = d3.select("#svg-container").append("svg")
        .attr("width", outerWidth)
        .attr("height", outerHeight)
        .attr("id", "chartSVG")
        .append("g")
        .attr("transform", "translate(" + innerWidth/2 + "," + innerHeight/2 + ")");
    
    // Tip function
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function (d) {
            return "<strong>" + arg + ":</strong> </br>" + "Bin Size: <span style='color:red'>" + d.data.label + "</span></br> Count: <span style='color:red'>" + d.data.length + "</span>";
        });
    
    svg.call(tip);
    
    // import the data and create the histogram
    d3.csv("data/baseball_data_full.csv", function (error, data) {
        if (error) throw error;
        dataset = data.map(function (d) {
            return +d[arg];
        });
        
        // color scale for arcs
        var color = d3.scaleOrdinal(d3.schemeCategory20c);
        
        //bin the data first
        var minmax = d3.extent(data, function (d) {return +d[arg]; });
        var x = d3.scaleLinear()
            .domain(minmax)
            .rangeRound([margin.left, margin.right]);
        
        // fix the domain. The domain can also be less than the ticks
        var tickSize = x.ticks()[1] - x.ticks()[0];
        x.domain([minmax[0] - minmax[0] % tickSize, (minmax[1] + tickSize) - minmax[1] % tickSize]);
        
        // create the histogram. Use the arg for binsize. No of bins = (max - min)/binsize
        var bins = d3.histogram()
            .domain(x.domain())
            .thresholds(Math.ceil((minmax[1] - minmax[0])/binsize))
            (dataset);
        
        // Remove the the data with 0 count. It messes with the UI
        bins = bins.filter(function(d){ return d.length != "0" }); 
        
        //create the new data out of this
        bins.forEach(function (elem, index) {
            elem.length = +elem.length;
            elem.label = elem.x0 + "-" + elem.x1;
        });
        
        // Append the arcs
        var g = svg.selectAll(".arc")
            .data(pie(bins))
            .enter().append("g")
            .attr("class", "arc");
            
        
        // Append the path
        g.append("path")
            .attr("d", arc)
            .style("fill", function(d, i) { return color(i); })
            .on("mouseover", function(d) { 
                tip.show(d);
            })
            .on("mouseout", function(d) {
                tip.hide(d);
            })
        
        // code for the variable bin size
        d3.selectAll("#binsize").on("mousedown", function() {
            // mark the button as active
            var button = d3.select(this)
                .classed("active", true);
            
            // set the handlers
            var w = d3.select(window)
                .on("mousemove", mousemovehandler)
                .on("mouseout", mouseuphandler);
            
            d3.event.preventDefault();
            function mousemovehandler() {                
				if (arg === "avg") {
                    button.text("Bin Size-" + (parseFloat(d3.mouse(button.node())[0])/1000).toFixed(2));
                } else {
                    button.text("Bin Size-" + parseInt(d3.mouse(button.node())[0]));
                }
				binsizechanged = d3.mouse(button.node())[0];;
                render_pie();
            }
            
            function mouseuphandler() {
                button.classed("active", false);
                w.on("mousemove", null)
                 .on("mouseup", null);
            }
            
        });
    });
}

function render_force() {
    /* Function to draw the Force directed graph
     * Reference - https://bl.ocks.org/mbostock/4062045
     */
    // useful in creating groups
    var svg = d3.select("#svg-container").append("svg")
        .attr("width", 1000)
        .attr("height", 700)
        .attr("id", "forceSVG");
    
    // define the color scale
    var color = d3.scaleOrdinal(d3.schemeCategory20);
    
    // force simulations taken from 
    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(outerWidth / 2, outerHeight / 2));

    var numEdges = 0;
    d3.json("data/baseball_data_force.json", function(error, graph) {
        if (error) throw error;

        var link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(graph.links)
            .enter().append("line")
              .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

        var nodeRadius = 5;
        // Create Node vars using circles. Constant radius. Color based on index. 
        var node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(graph.nodes)
            .enter().append("circle")
              .attr("r", "5")
              .attr("fill", function(d) { return color(d.group); })
              .call(d3.drag()
                  .on("start", dragstarted)
                  .on("drag", dragged)
                  .on("end", dragended));

        node.append("title")
            .text(function(d) { return d.id; });

        simulation
            .nodes(graph.nodes)
            .on("tick", ticked);

        simulation.force("link")
            .links(graph.links);

        // Adjust the cx and cy so that the graph is bounded.
        function ticked() {
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
            node
                .attr("cx", function(d) { return d.x = Math.max(nodeRadius, Math.min(outerWidth - nodeRadius, d.x)); })
                .attr("cy", function(d) { return d.y = Math.max(nodeRadius, Math.min(outerHeight - nodeRadius, d.y)); });
        }
    });
    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

}
