function treeDisplay() {
    d3v4.select("#tree-title").html("Dependency treemap");
    d3v4.select("#tree-description").html("A dependency treemap visualizes the \
                            relative size and hierarchy of classes and methods \
                            in a library. Click each class block to zoom in and view \
                            its methods.");
}

function displayTreemap(dataJson, dataJson_in, compare) {
    treeDisplay();
    
    displayTree(dataJson_in, flower=false, state="in", compare=compare);
    if (compare) {
        d3v4.select("#in-tree")
            .style("margin-right", "0.7%")
            .style("width", "49%");
        displayTree(dataJson, flower=false, state="out", compare=compare);
    } else {
        d3v4.select("#in-tree").style("width", "95%")
    }
    window.scrollTo(0, 0);
}

function displayTree(dataJson, flower=false, state="in", compare=false) {
    var el_id = state + '-tree';
    var margin = {top: 30, right: 30, bottom: 30, left: 10},
        width = window.innerWidth * 0.9,
        grandparent_width = width,
        height = window.innerHeight - margin.top - margin.bottom,
        formatNumber = d3v4.format(","),
        transitioning;
    var data;

    if (compare) {
        width *= 0.5;
        grandparent_width *= 0.5;
    } 
    
    if (!flower) {
        data = JSON.parse(dataJson);
    } else {
        width *= 0.8;
        height *= 0.3;
        grandparent_width = width/2;
        el_id = "visualization";
        d3v4.select("#flower-tree").remove();
        data = dataJson;
    }

    // sets x and y scale to determine size of visible boxes
    var x = d3v4.scaleLinear()
        .domain([0, width])
        .range([0, width]);
    var y = d3v4.scaleLinear()
        .domain([0, height])
        .range([0, height]);
    var treemap = d3v4.treemap()
            .size([width, height])
            .paddingInner(0)
            .round(false);
    
if (flower) {
    var svg = d3v4.select('#'+el_id).append("svg")
    .attr("id", "flower-tree")
    .attr("width", width)
    .attr("height", height)
    .style("margin-left", margin.left + "px")
    .style("margin-right", -margin.right + "px")
    .style("position", "absolute")
    .style("left", 0)
    .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .style("shape-rendering", "crispEdges");
} else{
    d3v4.select("#" + el_id + "-title").html("Linker " + state + "put");
    var svg = d3v4.select('#'+el_id).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.bottom + margin.top)
    .style("margin-left", margin.left + "px")
    .style("margin-right", -margin.right + "px")
    .attr("id", "treemap")
    .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .style("shape-rendering", "crispEdges");
}

var grandparent = svg.append("g")
        .attr("class", "grandparent");
grandparent.append("rect")
    .attr("y", -margin.top)
    .attr("width", grandparent_width) 
    .attr("height", margin.top)
    .attr("fill", '#bbbbbb');
grandparent.append("text")
    .attr("x", 6)
    .attr("y", 6 - margin.top)
    .attr("dy", ".75em");

if (flower) {
    grandparent.style("font-size", "10px");
}

var root = d3v4.hierarchy(data);
treemap(root
    .sum(function (d) {
        if (flower){
            return d.size;
        } else {
            return d.value;
        }
    })
    .sort(function (a, b) {
        return b.height - a.height || b.value - a.value;
    })
);
// console.log(root)
display(root, flower);

function display(d, flower=false) {
    
    // write text into grandparent
    // and activate click's handler
    grandparent
        .datum(d.parent)
        .on("click", transition)
        .select("text")
        .text(name(d))
        .style("font-size", "12px");
    // grandparent color
    grandparent
        .datum(d.parent)
        .select("rect")
        .attr("fill", function () {
            return 'orange'
        });
    var g1 = svg.insert("g", ".grandparent")
        .datum(d)
        .attr("class", "depth");

    if (d._children != null) {
        var g = g1.selectAll("g")
        .data(d._children)
        .enter()
        .append("g")
    } else {
        var g = g1.selectAll("g")
        .data(d.children)
        .enter()
        .append("g")
    }
    
        // g.enter().append("g");
    
    // add class and click handler to all g's with children
    g.filter(function (d) {
        return d.children;
    })
        .classed("children", true)
        .on("click", transition);

    g.selectAll(".child")
        .data(function (d) {
            return d.children || [d];
        })
        .enter().append("rect")
        .attr("class", "child")
        .call(rect);

    // add title to parents
    g.append("rect")
        .attr("class", "parent")
        .call(rect)
        .append("title")
        .text(function (d){
            return d.data.name;
        });
    g.selectAll("rect.parent")
        .attr("fill", function(d) {
            // return getRandomColor(d.data.name);
            return color(d.data.name);
        });
    
    g.selectAll("rect.child")
        .attr("fill", function(d) {
            // return getRandomColor(d.parent.data.name);
            return color(d.parent.data.name);
        });
    
    /* Adding a foreign object instead of a text object, allows for text wrapping */
    g.append("foreignObject")
        .call(rect)
        .attr("class", "foreignobj")
        .append("xhtml:div")
        .attr("dy", ".75em")
        .html(function (d) {
            return '' +
                '<p class="title"> ' + d.data.name + '</p>' +
                '<p>' + formatNumber(d.value) + '</p>'
            ;
        })
        .style("font-size", function(d) {
            if (flower) {
                return "8px";
            } else {
                return "11px";
            }
        })
        .attr("class", "textdiv"); //textdiv class allows us to style the text easily with CSS

    function transition(d) {
        if (transitioning || !d) return;
        transitioning = true;
        var g2 = display(d),
            t1 = g1.transition().duration(650),
            t2 = g2.transition().duration(650);
        // Update the domain only after entering new elements.
        x.domain([d.x0, d.x1]);
        y.domain([d.y0, d.y1]);
        // Enable anti-aliasing during the transition.
        svg.style("shape-rendering", null);
        // Draw child nodes on top of parent nodes.
        svg.selectAll(".depth").sort(function (a, b) {
            return a.depth - b.depth;
        });

        // Fade-in entering text.
        g2.selectAll("text").style("fill-opacity", 0);
        g2.selectAll("foreignObject div").style("display", "none");
        /*added*/
        // Transition to the new view.
        t1.selectAll("text").call(text).style("fill-opacity", 0);
        t2.selectAll("text").call(text).style("fill-opacity", 1);
        t1.selectAll("rect").call(rect);
        t2.selectAll("rect").call(rect);
        /* Foreign object */
        t1.selectAll(".textdiv").style("display", "none");
        /* added */
        t1.selectAll(".foreignobj").call(foreign);
        /* added */
        t2.selectAll(".textdiv").style("display", "block");
        /* added */
        t2.selectAll(".foreignobj").call(foreign);
        /* added */
        // Remove the old node when the transition is finished.
        t1.on("end.remove", function(){
            this.remove();
            transitioning = false;
        });
    }
    return g;
}
function text(text) {
    text.attr("x", function (d) {
        return x(d.x) + 6;
    })
        .attr("y", function (d) {
            return y(d.y) + 6;
        });
}
function rect(rect) {
    rect
        .attr("x", function (d) {
            return x(d.x0);
        })
        .attr("y", function (d) {
            return y(d.y0);
        })
        .attr("width", function (d) {
            return x(d.x1) - x(d.x0);
        })
        .attr("height", function (d) {
            return y(d.y1) - y(d.y0);
        });
}
function foreign(foreign) { /* added */
    foreign
        .attr("x", function (d) {
            return x(d.x0);
        })
        .attr("y", function (d) {
            return y(d.y0);
        })
        .attr("width", function (d) {
            return x(d.x1) - x(d.x0);
        })
        .attr("height", function (d) {
            return y(d.y1) - y(d.y0);
        });
}
function name(d) {
    return breadcrumbs(d) +
        (d.parent
        ? " -  Click to zoom out"
        : " - Click inside square to zoom in");
}
function breadcrumbs(d) {
    var res = "";
    var sep = " > ";
    d.ancestors().reverse().forEach(function(i){
        res += i.data.name + sep;
    });
    return res
        .split(sep)
        .filter(function(i){
            return i!== "";
        })
        .join(sep);
}
}
                    
    


