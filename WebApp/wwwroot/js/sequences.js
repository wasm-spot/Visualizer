// Dimensions of sunburst.
var width = window.innerWidth * 0.3;
var height = window.innerHeight * 0.7;
var radius = Math.min(width, height) / 2;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
  w: window.innerWidth*0.2, h: window.innerHeight*0.13, s: 3, t: 10
};

// Mapping of step names to colors.
var colors = {
  "assembly": "#5687d1",
  "class": "#7b615c",
  "method": "#de783b",
  "account": "#6ab975",
  "other": "#a173d1",
};

// Total size of all segments; we set this later, after loading the data.
var totalSize = 0, inTotalSize = 0; 

var vis, in_vis;

var partition = d3v4.partition()
    .size([2 * Math.PI, radius * radius]);

var arc = d3v4.arc()
    .startAngle(function(d) { return d.x0; })
    .endAngle(function(d) { return d.x1; })
    .innerRadius(function(d) { return Math.sqrt(d.y0); })
    .outerRadius(function(d) { return Math.sqrt(d.y1); });

function sunburstDisplay() {
  d3v4.select("#options")
      .style("display", null);
  d3v4.select("#chart")
      .style("display", null);
  d3v4.select("#explanation")
      .style("display", null);
  d3v4.select("#sequence")
      .style("display", null);
  d3v4.select("#chart-title").html("Sunburst")
  d3v4.select("#description")
    .html("A sunburst diagram visualizes the relative size and hierarchy of \
          classes and methods in a library. Hover over each sector for more \
          information.")
  // d3v4.select("#size")
  //   .on("keypress", function() {
  //     if (d3v4.event.keyCode == 13) {
  //       d3v4.event.preventDefault();
  //       displaySunburst();
  //     }
  //   })
}

function displaySunburst(dataJson, dataJson_in) {
  var inputSize = document.getElementById("size").value;
  var overload = document.getElementById("overload").checked;
  console.log(dataJson);
  createVisualization(dataJson, inputSize, overload, data_in=dataJson_in, state="in");
  window.scrollTo(0,document.body.scrollHeight*0.9);
}

function createCsv(data, inputSize, overload, state) {

  var csv = d3v4.csvParseRows(data);

  var names = csv.map(function(value, index) { return value[0]; })
  names = names.map(function(value, index) { return value.split("-")})
  names = [].concat(...names)
  var json = buildHierarchy(csv, state);

  return json;
}

function createRoot(json, in_root=null) {
  var root = d3v4.hierarchy(json)
    .sum(function(d) { return d.size; })
    .sort(function(a, b) { return b.value - a.value; }); 
  
  console.log(root)

  if (in_root != null) {

  }

  return root;
}

function createSunburst(json ,root, state="in") {
  var id = "#sunburst-" + state;
  var sun = d3v4.select(id).append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "sunburst")
    .append("svg:g")
    .attr("transform", "translate(" + width / 2 + "," + window.innerHeight * 0.35 + ")");
  sun.append("svg:circle")
    .attr("r", radius)
    .style("opacity", 0);

  var text = sun.append("text")
                .attr("class", "sunburst-title")
                .attr("transform", "translate(-30, 0)");

  var nodes = partition(root).descendants()
    .filter(function(d) {
        return (d.x1 - d.x0 > 0.005); // 0.005 radians = 0.29 degrees
    });

  var path = sun.data([json]).selectAll("path")
    .data(nodes)
    .enter().append("svg:path")
    .attr("display", function(d) { return d.depth ? null : "none"; })
    .attr("d", arc)
    .attr("id", state)
    .attr("fill-rule", "evenodd")
    .style("fill", function(d) { return color(d.data.name); })
    .style("opacity", 1)
    .on("mouseover", mouseover);

    d3v4.selectAll("#sunburst").on("mouseleave", mouseleave);

    if (state === "in") {
      inTotalSize = path.datum().value;
      in_vis = sun;
      text.text("Linker input")
    } else {
      totalSize = path.datum().value;
      vis = sun;
      text.text("Linker output")
    }
}

// Main function to draw and set up the visualization, once we have the data.
function createVisualization(data, inputSize, overload, data_in) {
    d3v4.selectAll("#sunburst").remove();
    var in_json = createCsv(data_in, inputSize, overload, "in");
    var json = createCsv(data, inputSize, overload, "out", in_root=in_root);
    var in_root = createRoot(in_json);
    var root = createRoot(json, in_root);

    height = window.innerHeight * 0.8;
    width = window.innerHeight * 0.6;

  // Basic setup of page elements.
  initializeBreadcrumbTrail();

  createSunburst(in_json, in_root, state="in");
  createSunburst(json, root, state="out");
 };

// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {
  var state = d.data.state;
  var total = totalSize;
  if (state == "in") {
    total = inTotalSize;
  }
  var percentage = (100 * d.value / total).toPrecision(3);
  var percentageString = percentage + "%";
  if (percentage < 0.1) {
    percentageString = "< 0.1%";
  }
  
  // Fade all the segments.
  d3v4.selectAll("path")
      .style("opacity", 0.3);

  

  var sequenceArray = d.ancestors().reverse();
  sequenceArray.shift(); // remove root node from the array
  updateBreadcrumbs(sequenceArray, percentageString);

  if (state === "out") {
    d3v4.select("#explanation")
      .style("display", "inline-block")
      .style("visibility", "");
    d3v4.select("#out-size")
      .text(d.value);
    d3v4.select("#percentage")
      .text(percentageString);
    
    vis.selectAll("path")
      .filter(function(node) {
                return (sequenceArray.indexOf(node) >= 0);
              })
      .style("opacity", 1);
  } else {
    d3v4.select("#in-explanation")
      .style("display", "inline-block")
      .style("visibility", "");
    d3v4.select("#in-size")
      .text(d.value);
    d3v4.select("#in-percentage")
      .text(percentageString);
    in_vis.selectAll("path")
      .filter(function(node) {
                return (sequenceArray.indexOf(node) >= 0);
              })
      .style("opacity", 1);
  }
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {
  // Hide the breadcrumb trail
  d3v4.select("#trail")
      .style("visibility", "hidden");

  // Deactivate all segments during transition.
  d3v4.selectAll("path").on("mouseover", null);

  // Transition each segment to full opacity and then reactivate it.
  d3v4.selectAll("path")
      .transition()
      .duration(800)
      .style("opacity", 1)
      .on("end", function() {
              d3v4.select(this).on("mouseover", mouseover);
            });
  d3v4.select("#explanation")
    .style("visibility", "hidden");

  d3v4.select("#in-explanation")
    .style("visibility", "hidden");
  
}

function initializeBreadcrumbTrail() {
  // Add the svg area.
  var trail = d3v4.select("#sequence").append("svg:svg")
      .attr("width", window.innerWidth)
      .attr("height", window.innerHeight*0.15)
      .attr("margin", 20)
      .attr("id", "trail");
  // Add the label at the end, for the percentage.
  trail.append("svg:text")
    .attr("id", "endlabel")
    .style("fill", "#000");
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
  var points = [];
  points.push("0,0");
  points.push(b.w + ",0");
  points.push(b.w + b.t + "," + (b.h / 2));
  points.push(b.w + "," + b.h);
  points.push("0," + b.h);
  if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
    points.push(b.t + "," + (b.h / 2));
  }
  return points.join(" ");
}

// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray, percentageString) {

  // Data join; key function combines name and depth (= position in sequence).
  var trail = d3v4.select("#trail")
      .selectAll("g")
      .data(nodeArray, function(d) { return d.data.name + d.depth; });

  // Remove exiting nodes.
  trail.exit().remove();

  // Add breadcrumb and label for entering nodes.
  var entering = trail.enter().append("svg:g");

  entering.append("svg:polygon")
      .attr("points", breadcrumbPoints)
      .style("fill", function(d) { return color(d.data.name); });

  entering.append("svg:text")
      .attr("class", "bread")
      .attr("x", (b.w + b.t) / 2)
      .attr("y", function(d) {
        var mult = 0.5;
        if (d.data.name.length > 50 && d.data.name.length < 100) mult = 0.3;
        else if (d.data.name.length > 100) mult = 0.2
        return b.h * mult;
      })
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { 
        return d.data.name; 
      })
      .style("font-size", "12px")
      .selectAll(".bread text")
        .call(wrap, b.w-50);
    
    var l = entering.selectAll(".bread text")._parents;
    l.forEach(function(t, i) {
        t = d3v4.selectAll("tspan").nodes()
        var len  = t.map(tspan => tspan.getComputedTextLength());
    })

  // Merge enter and update selections; set position for all nodes.
  entering.merge(trail).attr("transform", function(d, i) {
    return "translate(" + i * (b.w + b.s) + ", 0)";
  });

  // Now move and update the percentage at the end.
  d3v4.select("#trail").select("#endlabel")
      .attr("x", (nodeArray.length + 0.1) * (b.w + b.s))
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(percentageString);

  // Make the breadcrumb trail visible, if it's hidden.
  d3v4.select("#trail")
      .style("visibility", "");

}

// Take a 2-column CSV and transform it into a hierarchical structure suitable
// for a partition layout. The first column is a sequence of step names, from
// root to leaf, separated by hyphens. The second column is a count of how 
// often that sequence occurred.
function buildHierarchy(csv, state) {
  var root = {"name": "root", "state": state, "children": []};
  for (var i = 0; i < csv.length; i++) {
    var sequence = csv[i][0];
    var size = +csv[i][1];
    if (isNaN(size)) { // e.g. if this is a header row
      continue;
    }
    var parts = sequence.split("-");
    var currentNode = root;
    for (var j = 0; j < parts.length; j++) {
      var children = currentNode["children"];
      var nodeName = parts[j];
      var childNode;
      if (j + 1 < parts.length) {
   // Not yet at the end of the sequence; move down the tree.
 	var foundChild = false;
 	for (var k = 0; k < children.length; k++) {
 	  if (children[k]["name"] == nodeName) {
 	    childNode = children[k];
 	    foundChild = true;
 	    break;
 	  }
 	}
  // If we don't already have a child node for this branch, create it.
 	if (!foundChild) {
 	  childNode = {"name": nodeName, "state": state, "children": []};
 	  children.push(childNode);
 	}
 	currentNode = childNode;
      } else {
 	// Reached the end of the sequence; create a leaf node.
 	childNode = {"name": nodeName, "state": state, "size": size};
 	children.push(childNode);
      }
    }
  }
  return root;
};

function wrap(text, width) {
    text = text._parents
    text.forEach(function(t, i) {
        t = d3v4.select(t)
        var words = t.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1,
            x = t.attr("x"),
            y = t.attr("y"),
            dy = parseFloat(t.attr("dy")),
            tspan = t.text(null).append("tspan")
                                .attr("x", x)
                                .attr("y", y)
                                .attr("dy", dy+"em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = t.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em").text(word)
            }
        }
        
    })
}
