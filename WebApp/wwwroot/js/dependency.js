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

function filterDepJson(filters, search=null) {
  d3v4.json("json/dep.json", function(masterData) {
      var filtered = []
      masterData.forEach(row => {
          if ((parseInt(row.size) >= filters.size) && 
              (row.dependencies.length <= filters.deps)) {
                if (search != null) {
                  if (row.name.includes(search)) filtered.push(row);
                } else {
                  filtered.push(row);
                }
                  
          }
      });

      d3v4.json("json/index.json", function(index) {
          var names = getNames(masterData, index, filtered);
          var n = names.length;
          var matrix = makeMatrix(n);
          filtered.forEach(item => {
              var row = names.indexOf(item.name);
              item.dependencies.forEach(dep => {
                  var dep = masterData[dep];
                  if (dep.dependencies != null)
                    matrix[row][names.indexOf(dep.name)] = 1
              })
              
          })
          var wheel = {
              packageNames : names,
              matrix: matrix
          };
          d3v4.select(".dependencyWheel").remove()
          displayWheel(wheel, masterData, index, sub=false, "wheel")
      })        
  })  
}

d3v4.chart.dependencyWheel = function(master, index, sub=false, options) {
  var masterTree = {};
  var width = 700;
  var margin = 150;
  var padding = 0.02;
  var scaleValue = 1;
  function chart(selection) {
    selection.each(function(data) {

      var matrix = data.matrix;
      var packageNames = data.packageNames;
      var levels;
      if (data.levels != null) levels = data.levels;
      var radius = width * 0.4 - margin;
      // var maxLevel = Math.floor(packageNames.length * -0.005 + 7);
      var maxLevel = 5;
      var grandParent;
      console.log(levels)
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
        var ratio;
        if (sub) {
          var lvl = levels[packageNames[d.index]] + 1;
          ratio = (maxLevel - lvl)/maxLevel;
        } else {
          ratio = numDeps[d.index]/maxDeps;
        }
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
          grandParent = name;
          var treeData = treemapData(name);
          var depData = newDependencies(name, maxLevel);
          displayTree(treeData, dep=true)
          console.log(depData)
          var wheelData = createDependencies(depData, maxLevel);
          d3v4.select("#wheel2").select("svg").remove();
          displayWheel(wheelData, master, index, sub=true, "wheel2");
          d3v4.select("#wheelName").html(name);
          d3v4.select("#dep-tree").selectAll(".children")
            .on("mouseover", function(d) { 
              var index = packageNames.indexOf(d.data.name)
              d3v4.select("#text" + index).style("display", null)
            })
            .on("mouseleave", function(d) {
              var index = packageNames.indexOf(d.data.name)
              d3v4.select("#text" + index).style("display", "none")
            })
            .on("click", (d) => {click(d, maxLevel)})
        });

      g.append("svg:text")
        .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("class", function(d) {
          var numDeps = matrix[d.index].reduce((a, b) => a + b);
          if (numDeps > 2) {
            return "displayed";
          } else {
            return "hidden";
          }
        })
        .attr("id", function(d) {
          return "text" + d.index;
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
        .style("font-weight", (d) => {
          if (d.index == 0) return "bold";
        })
        .text(function(d) { 
          return packageNames[d.index]; 
        })
        .style("display", function(d) {
          if (!sub) {
            var numDeps = matrix[d.index].reduce((a, b) => a + b);
            if (numDeps < 2) {
              return null;
            } else {
              return "none";
            }
          } else {
            return null;
          } 
          
        })
        .on("mouseover", function(d) {
          d3v4.select(this).style("display", null);
          fade(0.1)
        })
        .on("mouseout", function(d) {
          d3v4.select(this).style("display", "none");
          fade(1)
        });

      g.append("svg:path")
        .style("fill", fill)
        .style("stroke", fill)
        .attr("class", function(d) {
          var numDeps = matrix[d.index].reduce((a, b) => a + b);
          if (numDeps < 2) {
            return "text-displayed";
          } else {
            return "text-hidden";
          }
        })
        .attr("d", arc)
        .style("cursor", "pointer")
        .on("mouseover", function(d) {
          d3v4.select("#text" + d.index).style("display", null)
          fade(0.1)
        })
        .on("mouseout", function(d) {
          if (d3v4.select(this).attr("class") == "text-hidden" && scaleValue <= 3.15)
            d3v4.select("#text" + d.index).style("display", "none")
          fade(1)
        });

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

  function click(d, maxLevel) {
    grandParent = d.data.name;
    treeData = treemapData(d.data.name);
    displayTree(treeData, dep=true)
    depData = newDependencies(d.data.name, maxLevel);
    var wheelData = createDependencies(depData, maxLevel);
    console.log(depData)
    console.log(wheelData)
    d3v4.select("#wheel2").select("svg").remove();
    displayWheel(wheelData, master, index, sub=true, "wheel2");
    d3v4.select("#dep-tree").selectAll(".children")
                .on("click", (d) => {click(d, maxLevel)})
  }

  function calcFontSize() {
    return Math.min(24, 10 * Math.pow(scaleValue, -1.2));
  }

  function text() {
    if (scaleValue > 3.15) {
      d3v4.selectAll(".hidden").style("display", null);
    } else {
      d3v4.selectAll(".hidden").style("display", "none");
    }
    d3v4.selectAll(".displayed").style("font-size", calcFontSize() + "px");
    d3v4.selectAll(".hidden").style("font-size", calcFontSize() + "px");
  }

  function treemapData(name) {
    var item = findDependency(master, name)
    var treemap = {name: item.name, value: null};
    var children = []
    item.dependencies.forEach(child => {
      child = master[child];
      if (child.dependencies != null)
        children.push({name: child.name, value: child.size, children : null});
    })

    treemap.children = children;

    return treemap;
  
  }

  function newDependencies(name, maxLevel) {
    var queue = [], depQueue = [];
    var currNode;
    var dep = {"name": name, "children": []};
    var root = dep;
    queue.push(name);
    depQueue.push(dep);
    var depth = 0;
    if (name in masterTree) {
      dep = masterTree[name];
      return dep;
    }

    while (queue.length != 0 && depth < maxLevel) {
      var n = queue.length;
      
      while (n > 0) {
        var p = queue.shift();
        dep = depQueue.shift();
      
        currNode = findDependency(master, p);
        if (currNode.dependencies != null) {
          currNode.dependencies.forEach(child => {
            var childNode = master[child];
            name = childNode.name
            var depChild;
            if (name in masterTree) {
              depChild = masterTree[childNode.name];
            } else {

              if (childNode.dependencies == null) {
                depChild = {"name": name, "children": null};
                masterTree[childNode.name] = depChild;
              } else {  
                depChild = {"name": name, "children": [], "value": childNode.size};
                queue.push(name);
                depQueue.push(depChild);
              }
            }
            dep.children.push(depChild)
            
          })
          if (!(currNode.name in masterTree)) {
            masterTree[currNode.name] = dep;
          }
        }
        
        
        n--;
      }
      depth++;
    }
    return root;
  }

  function createDependencies(deps, maxLevel) {
    var names = [];
    var queue = [];
    var levels = {};
    queue.push(deps);
    var depth = 0;
    while (queue.length != 0 && depth < maxLevel) {
      var n = queue.length;
      while (n > 0) {
        var node = queue.shift();
        levels[node.name] = depth 
        if (node.children != null) {
          if (!names.includes(node.name)) {
            names.push(node.name)
          }
          node.children.forEach(child => {
            queue.push(child);
          })
        }
        n--;
      }
      depth++;
    }
    var matrix = dependencyMatrix(names);
    return {"packageNames": names, "matrix": matrix, "levels": levels};
  }

  function dependencyMatrix(names) {
    var matrix = makeMatrix(names.length);
    var row, col;
    names.forEach(name => {
      row = names.indexOf(name);
      var dependencies = master[parseInt(getKeyByValue(index, name))].dependencies;
      dependencies.forEach(dep => {
        var depName = master[dep].name;
        col = names.indexOf(depName);
        matrix[row][col] = 1;
      })
    })
    return matrix;
  }

};

function getKeyByValue(dict, value) {
  return Object.keys(dict).find(key => dict[key] === value);
}

function findDependency(master, name) {
  for (var i = 0; i < master.length; i++) {
    if (master[i].name == name) {
      return master[i];
    }
  }
  return null;
}

function getNames(data, index, filtered) {
  var names = []
  filtered.forEach(item => {
      if (!names.includes(item.name) && item.size != 0) {
          names.push(item.name)
          item.dependencies.forEach(ix => {
              var dep = data[ix];
              if (dep.dependencies != null && !names.includes(dep.name) && dep.size != 0) {
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

function displayWheel(data, master, index, sub=false, id) {
  var chart = d3v4.chart.dependencyWheel(master, index, sub=sub)
              .width(window.innerWidth * 0.45)
              .margin(150);
  console.log(data)
  d3v4.select("#" + id)
    .datum(data)
    .call(chart)
  d3v4.select(".slidecontainer").style("display", null);
}



