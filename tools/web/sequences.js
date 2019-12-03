// Dimensions of sunburst.
var width = 700;
var height = 750;
var radius = Math.min(width, height) / 2;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
  w: 400, h: 100, s: 3, t: 10
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
var totalSize = 0; 

var vis = d3.select("#chart").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .style("margin-left", 100)
    .append("svg:g")
    .attr("id", "container")
    .attr("transform", "translate(" + width / 2 + "," + 400 + ")");

var partition = d3.partition()
    .size([2 * Math.PI, radius * radius]);

var arc = d3.arc()
    .startAngle(function(d) { return d.x0; })
    .endAngle(function(d) { return d.x1; })
    .innerRadius(function(d) { return Math.sqrt(d.y0); })
    .outerRadius(function(d) { return Math.sqrt(d.y1); });

var names
// Use d3.text and d3.csvParseRows so that we do not need to have a header
// row, and can receive the csv as an array of arrays.
d3.text("csv/data.csv", function(text) {
  var assembly = formatAssembly("json/mscorlib.json")
  var csv = d3.csvParseRows(assembly);
  
  names = csv.map(function(value, index) { return value[0]; })
  names = names.map(function(value, index) { return value.split("-")})
  names = [].concat(...names)
  var json = buildHierarchy(csv);
  createVisualization(json, names);

  
});

var assemblyTree = formatAssemblyTree("json/mscorlib.json")

// Main function to draw and set up the visualization, once we have the data.
function createVisualization(json, names) {
  colors = d3.scaleOrdinal()
    .domain(names)
    .range(d3.schemeCategory20b)
  // Basic setup of page elements.
  initializeBreadcrumbTrail();
  drawLegend(names);
  d3.select("#togglelegend").on("click", toggleLegend);

  // Bounding circle underneath the sunburst, to make it easier to detect
  // when the mouse leaves the parent g.
  vis.append("svg:circle")
      .attr("r", radius)
      .style("opacity", 0);

  // Turn the data into a d3 hierarchy and calculate the sums.
  var root = d3.hierarchy(json)
      .sum(function(d) { return d.size; })
      .sort(function(a, b) { return b.value - a.value; });
  
  // For efficiency, filter nodes to keep only those large enough to see.
  var nodes = partition(root).descendants()
      .filter(function(d) {
          return (d.x1 - d.x0 > 0.005); // 0.005 radians = 0.29 degrees
      });

  var path = vis.data([json]).selectAll("path")
      .data(nodes)
      .enter().append("svg:path")
      .attr("display", function(d) { return d.depth ? null : "none"; })
      .attr("d", arc)
      .attr("fill-rule", "evenodd")
      .style("fill", function(d) { return colors(d.data.name); })
      .style("opacity", 1)
      .on("mouseover", mouseover);

  // Add the mouseleave handler to the bounding circle.
  d3.select("#container").on("mouseleave", mouseleave);

  // Get total size of the tree = value of root node from partition.
  totalSize = path.datum().value;
 };

// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {

  var percentage = (100 * d.value / totalSize).toPrecision(3);
  var percentageString = percentage + "%";
  if (percentage < 0.1) {
    percentageString = "< 0.1%";
  }

  d3.select("#percentage")
      .text(percentageString);

  d3.select("#explanation")
      .style("visibility", "");

  var sequenceArray = d.ancestors().reverse();
  sequenceArray.shift(); // remove root node from the array
  updateBreadcrumbs(sequenceArray, percentageString);

  // Fade all the segments.
  d3.selectAll("path")
      .style("opacity", 0.3);

  // Then highlight only those that are an ancestor of the current segment.
  vis.selectAll("path")
      .filter(function(node) {
                return (sequenceArray.indexOf(node) >= 0);
              })
      .style("opacity", 1);
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {

  // Hide the breadcrumb trail
  d3.select("#trail")
      .style("visibility", "hidden");

  // Deactivate all segments during transition.
  d3.selectAll("path").on("mouseover", null);

  // Transition each segment to full opacity and then reactivate it.
  d3.selectAll("path")
      .transition()
      .duration(1000)
      .style("opacity", 1)
      .on("end", function() {
              d3.select(this).on("mouseover", mouseover);
            });

  d3.select("#explanation")
      .style("visibility", "hidden");
}

function initializeBreadcrumbTrail() {
  // Add the svg area.
  var trail = d3.select("#sequence").append("svg:svg")
      .attr("width", b.w*3 + 100)
      .attr("height", 100)
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
  var trail = d3.select("#trail")
      .selectAll("g")
      .data(nodeArray, function(d) { return d.data.name + d.depth; });

  // Remove exiting nodes.
  trail.exit().remove();

  // Add breadcrumb and label for entering nodes.
  var entering = trail.enter().append("svg:g");

  entering.append("svg:polygon")
      .attr("points", breadcrumbPoints)
      .style("fill", function(d) { return colors(d.data.name); });

  entering.append("svg:text")
      .attr("class", "bread")
      .attr("x", (b.w + b.t) / 2)
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.data.name; })
      .selectAll(".bread text")
        .call(wrap, b.w-50);
    
    var l = entering.selectAll(".bread text")._parents;
    l.forEach(function(t, i) {
        t = d3.selectAll("tspan").nodes()
        var len  = t.map(tspan => tspan.getComputedTextLength());
    })

  // Merge enter and update selections; set position for all nodes.
  entering.merge(trail).attr("transform", function(d, i) {
    return "translate(" + i * (b.w + b.s) + ", 0)";
  });

  // Now move and update the percentage at the end.
  d3.select("#trail").select("#endlabel")
      .attr("x", (nodeArray.length + 0.1) * (b.w + b.s))
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(percentageString);

  // Make the breadcrumb trail visible, if it's hidden.
  d3.select("#trail")
      .style("visibility", "");

}

function drawLegend(names) {
  // Dimensions of legend item: width, height, spacing, radius of rounded rect.
  var li = {
    w: 400, h: 30, s: 3, r: 3
  };
  var legend_colors = names.reduce(function(obj, x) {
      obj[x] = colors(x);
      return obj;
  }, {})
  
  var legend = d3.select("#legend").append("svg:svg")
      .attr("width", li.w)
      .attr("height", d3.keys(legend_colors).length * (li.h + li.s));

  var g = legend.selectAll("g")
      .data(d3.entries(legend_colors))
      .enter().append("svg:g")
      .attr("transform", function(d, i) {
              return "translate(0," + i * (li.h + li.s) + ")";
           });

  g.append("svg:rect")
      .attr("rx", li.r)
      .attr("ry", li.r)
      .attr("width", li.w/2-10)
      .attr("height", li.h)
      .style("position", "relative")
      .style("display", "block")
      .style("fill", function(d) { return d.value; });

  g.append("svg:text")
      .attr("x", li.w / 2)
      .attr("y", li.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.key; });
}

function toggleLegend() {
  var legend = d3.select("#legend");
  if (legend.style("visibility") == "hidden") {
    legend.style("visibility", "");
  } else {
    legend.style("visibility", "hidden");
  }
}

// Take a 2-column CSV and transform it into a hierarchical structure suitable
// for a partition layout. The first column is a sequence of step names, from
// root to leaf, separated by hyphens. The second column is a count of how 
// often that sequence occurred.
function buildHierarchy(csv) {
  var root = {"name": "root", "children": []};
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
 	  childNode = {"name": nodeName, "children": []};
 	  children.push(childNode);
 	}
 	currentNode = childNode;
      } else {
 	// Reached the end of the sequence; create a leaf node.
 	childNode = {"name": nodeName, "size": size};
 	children.push(childNode);
      }
    }
  }
  return root;
};

//  given json file of assembly dependencies, reformat to match format
//  needed for sunburst visualization
function formatAssembly(json) {
    var request = new XMLHttpRequest();
    request.open("GET", json, false);
    request.send(null)
    var data = JSON.parse(request.responseText);
    var csv_str = "";
    data.forEach(function(as) {
        var as_name = as["name"];
        var type = as["type"];
        var classes = as["sections"];
        if (classes != null) {
            classes.forEach(function(cl) {
                var class_name = cl["name"];
                var methods = cl["sections"];
                if (methods != null) {
                    methods.forEach(function(method) {
                        var method_name = method["name"];
                        var size = method["size"];
                        var line = as_name + "-" + class_name + "-" + method_name + "," + size + "\n";
                        csv_str += line;
                    })
                }
            })
        }
    })
    return csv_str;
}

//  given json file of assembly dependencies, reformat to match format
//  needed for treemap visualization
function formatAssemblyTree(json) {
    var request = new XMLHttpRequest();
    request.open("GET", json, false);
    request.send(null)

    var data = JSON.parse(request.responseText);
    var as_dict = {};
    data.forEach(function(as) {
        var as_name = as["name"];
        
        as_dict["name"] = as_name;
        as_dict["children"] = [];
        var classes = as["sections"];
        if (classes != null) {
            classes.forEach(function(cl) {
                var class_dict = {};
                var class_name = cl["name"];
                class_dict["name"] = class_name;
                class_dict["children"] = []
                var methods = cl["sections"];
                if (methods != null) {
                    methods.forEach(function(method) {
                        class_dict["children"].push({"name": method["name"], 
                                                    "value": method["size"]});
                    })
                    as_dict["children"].push(class_dict);
                }
            })
            
        }
    })
    console.log(as_dict)
    return as_dict;
}

function wrap(text, width) {
    text = text._parents
    text.forEach(function(t, i) {
        t = d3.select(t)
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