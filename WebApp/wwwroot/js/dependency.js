d3v4.chart = d3v4.chart || {};

/**
 * Dependency wheel chart for d3v4v4.js
 *
 * Usage:
 * var chart = d3v4.chart.dependencyWheel();
 * d3v4.select('#chart_placeholder')
 *   .datum({
 *      packageNames: [the name of the packages in the matrix],
 *      matrix: [your dependency matrix]
 *   })
 *   .call(chart);
 *
 * // Data must be a matrix of dependencies. The first item must be the main package.
 * // For instance, if the main package depends on packages A and B, and package A
 * // also depends on package B, you should build the data as follows:
 *
 * var data = {
 *   packageNames: ['Main', 'A', 'B'],
 *   matrix: [[0, 1, 1], // Main depends on A and B
 *            [0, 0, 1], // A depends on B
 *            [0, 0, 0]] // B doesn't depend on A or Main
 * };
 *
 * // You can customize the chart width, margin (used to display package names),
 * // and padding (separating groups in the wheel)
 * var chart = d3v4.chart.dependencyWheel().width(700).margin(150).padding(.02);
 *
 * @author François Zaninotto
 * @license MIT
 * @see https://github.com/fzaninotto/DependencyWheel for complete source and license
 */

function filterDepJson(filters) {
  d3v4.json("json/dep.json", function(masterData) {
      var filtered = []
      masterData.forEach(row => {
          if ((parseInt(row.size) >= filters.size) && 
              (row.dependencies.length >= filters.deps)) {
                  filtered.push(row);
          }
      });

      d3v4.json("json/index.json", function(index) {
          var names = getLength(masterData, index, filtered)
          var n = names.length;
          var matrix = makeMatrix(n);
          filtered.forEach(item => {
              var row = names.indexOf(item.name)
              item.dependencies.forEach(dep => {
                  var dep = findDependency(masterData, index[dep]);
                  if (dep != null)
                    matrix[row][names.indexOf(dep.name)] = 1
              })
              
          })

          var wheel = {
              packageNames : names,
              matrix: matrix
          };

          displayWheel(wheel, masterData, index)
      })        
  })  
}

d3v4.chart.dependencyWheel = function(master, index, options) {

  var width = 700;
  var margin = 150;
  var padding = 0.02;
  var scaleValue = 1;
  function chart(selection) {
    selection.each(function(data) {

      var matrix = data.matrix;
      var packageNames = data.packageNames;
      var radius = width * 0.4 - margin;

      // create the layout
      var chord = d3v4.chord()
        .padAngle(padding)
        .sortSubgroups(d3v4.descending);

      // Select the svg element, if it exists.
      var svg = d3v4.select(this).selectAll("svg").data([data]);

      // Otherwise, create the skeletal chart.
      var gEnter = svg.enter().append("svg:svg")
        .attr("width", width)
        .attr("height", width)
        .attr("class", "dependencyWheel")
        .style("display", "block")
      .append("g")
        .attr("transform", "translate(" + (width / 2) + "," + (width / 2) + ")");

      var arc = d3v4.arc()
        .innerRadius(radius)
        .outerRadius(radius + 20);

      var numDeps = []
      data.matrix.forEach(row => {
        numDeps.push(row.reduce((a, b) => a + b, 0))
      });
      var maxDeps = Math.max.apply(Math, numDeps)

      var fill = function(d) {
        // return "hsl(" + parseInt(((packageNames[d.index][0].charCodeAt() - 97) / 26) * 360, 10) + ",90%,70%)";
        var ratio = numDeps[d.index]/maxDeps;
        if (ratio === 0) return '#ccc'

        return color(ratio);
      };

      // Returns an event handler for fading a given chord group.
      var fade = function(opacity) {
        return function(g, i) {
          gEnter.selectAll(".chord")
              .filter(function(d) {
                return d.source.index != i && d.target.index != i;
              })
            .transition()
              .style("opacity", opacity);
          var groups = [];
          gEnter.selectAll(".chord")
              .filter(function(d) {
                if (d.source.index == i) {
                  groups.push(d.target.index);
                }
                if (d.target.index == i) {
                  groups.push(d.source.index);
                }
              });
          groups.push(i);
          var length = groups.length;
          gEnter.selectAll('.group')
              .filter(function(d) {
                for (var i = 0; i < length; i++) {
                  if(groups[i] == d.index) return false;
                }
                return true;
              })
              .transition()
                .style("opacity", opacity);
        };
      };

      var chordResult = chord(matrix);
      var rootGroup = chordResult.groups[0];
      var rotation = - (rootGroup.endAngle - rootGroup.startAngle) / 2 * (180 / Math.PI);

      var g = gEnter.selectAll("g.group")
        .data(chordResult.groups)
        .enter().append("svg:g")
        .attr("class", "group")
        .attr("transform", function(d) {
          return "rotate(" + rotation + ")";
        })
        .on("click", function(d) {
          var name = data.packageNames[d.index];
          var treeData = treemapData(name);
          
          var depData = newDependencies(name);
          console.log(depData)
          displayTree(depData, dep=true)
          d3v4.selectAll("#dep-parent")
            .on("click", function(d) {
              console.log(d)
            })
        });

      g.append("svg:path")
        .style("fill", fill)
        .style("stroke", fill)
        .attr("d", arc)
        .style("cursor", "pointer")
        .on("mouseover",fade(0.1))
        .on("mouseout", fade(1));

      g.append("svg:text")
        .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("class", function(d) {
          var numDeps = matrix[d.index].reduce((a, b) => a + b);
          if (numDeps > 20) {
            return "displayed";
          } else {
            return "hidden";
          }
        })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
        .attr("transform", function(d) {
          return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" +
            "translate(" + (radius + 26) + ")" +
            (d.angle > Math.PI ? "rotate(180)" : "");
        })
        .style("cursor", "pointer")
        .style("font-size", "9px")
        .text(function(d) { 
          return packageNames[d.index]; 
        })
        .style("display", function(d) {
          var numDeps = matrix[d.index].reduce((a, b) => a + b);
          if (numDeps > 20) {
            return null;
          } else {
            return "none";
          }
        })
        .on("mouseover", function(d) {
          fade(0.1)
        })
        .on("mouseout", fade(1));

      gEnter.selectAll("path.chord")
          .data(chordResult)
          .enter().append("svg:path")
          .attr("class", "chord")
          .style("stroke", function(d) { return d3v4.rgb(fill(d.source)).darker(); })
          .style("fill", function(d) { return fill(d.source); })
          .attr("d", d3v4.ribbon().radius(radius))
          .attr("transform", function(d) {
            return "rotate(" + rotation + ")";
          })
          .style("opacity", 1);

      gEnter.call(d3v4.zoom()
      .on("zoom", function() {
        gEnter.selectAll(".group")
              .attr("transform", d3v4.event.transform)
        gEnter.selectAll(".chord")
              .attr("transform", d3v4.event.transform)
        scaleValue = d3v4.event.transform.k;
        text();
      }));


      
    });
  }

  chart.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    return chart;
  };

  chart.margin = function(value) {
    if (!arguments.length) return margin;
    margin = value;
    return chart;
  };

  chart.padding = function(value) {
    if (!arguments.length) return padding;
    padding = value;
    return chart;
  };

  return chart;

  function calcFontSize() {
    return Math.min(24, 10 * Math.pow(scaleValue, -1.2));
  }

  function text() {
    if (scaleValue > 2) {
      d3v4.selectAll(".hidden").style("display", null);
    } else {
      d3v4.selectAll(".hidden").style("display", "none");
    }
    console.log(scaleValue, calcFontSize())
    d3v4.selectAll(".displayed").style("font-size", calcFontSize() + "px");
    d3v4.selectAll(".hidden").style("font-size", calcFontSize() + "px");
  }

  function treemapData(name) {
    var item = findDependency(master, name)
    var treemap = {name: item.name, value: null};
    var children = []
    item.dependencies.forEach(child => {
      var childName = index[child]
      child = findDependency(master, childName)
      if (child != null)
        children.push({name: child.name, value: child.size, children : null});
    })

    treemap.children = children;

    return treemap;
  
  }

  function newDependencies(name) {
    var queue = [], depQueue = [];
    var currNode = findDependency(master, name);
    var allNodes = [name]
    var dep = {"name": name, "children": []};
    var root = dep;
    queue.push(name)
    depQueue.push(dep)
    var depth = 0
    while (queue.length != 0 && depth < 5) {
      var n = queue.length
      
      while (n > 0) {
        var p = queue.shift();
        dep = depQueue.shift();
        currNode = findDependency(master, p);
        if (currNode != null) {
          currNode.dependencies.forEach(child => {
            name = index[child];
            var childNode = findDependency(master, name)
            var depChild;
            if (childNode != null) {
              depChild = {"name": name, "children": [], "value": childNode.size};
            } else {
              depChild = {"name": name, "children": null};
            }
            queue.push(name);
            depQueue.push(depChild)
            dep.children.push(depChild)
            
          })
        }
        n--;
      }
      depth++;
    }

    return root;
  }

};

function findDependency(master, name) {
  for (var i = 0; i < master.length; i++) {
    if (master[i].name == name) {
      return master[i];
    }
  }
  return null;
}

function getLength(data, index, filtered) {
  var names = []
  filtered.forEach(item => {
      if (!names.includes(item.name) && item.size != 0) {
          names.push(item.name)
          item.dependencies.forEach(ix => {
              var dep = findDependency(data, index[ix]);
              if (dep!= null && !names.includes(dep.name) && dep.size != 0) {
                  names.push(dep.name);
              }
          })
      }
  })

  return names;
}

function makeMatrix(n) {
  var arr = [];
  for(let i = 0; i < n; i++) {
      arr.push(new Array(n).fill(0));
  }
  return arr;
}

function displayWheel(data, master, index) {
  d3v4.select(".dependencyWheel").remove()
  var chart = d3v4.chart.dependencyWheel(master, index)
              .width(window.innerWidth * 0.45)
              .margin(150);
  console.log(data)
  d3v4.select("#wheel")
    .datum(data)
    .call(chart)
  d3v4.select(".slidecontainer").style("display", null);
}



