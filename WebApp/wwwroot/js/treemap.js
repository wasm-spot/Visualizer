function treeDisplay() {
    d3v4.select("#tree-title").html("Dependency treemap");
    d3v4.select("#tree-description").html("A dependency treemap visualizes the \
                            relative size and hierarchy of classes and methods \
                            in a library. Click each class block to zoom in and view \
                            its methods.");
}

function displayTreemap(dataJson, dataJson_in, compare, resource = false) {
    treeDisplay();
    displayTree(dataJson_in, dep=false, state="in", compare=compare, resource=resource);
    var inTree = "#in-tree"
    var outTree = "#out-tree"
    if (resource) {
        inTree += "-res"
        outTree += "-res"
    }
    d3v4.select(inTree).style("width", () => {
        if (!resource) return "95%"
        return "49%"
    })
    .style("margin", null)
    displayTree(dataJson, dep=false, state="out", compare=compare, resource=resource);
    d3v4.select(outTree).style("width", () => {
        if (!resource) return "95%"
        return "49%"
    })
    .style("margin", null)
    
}

function displayTree(data, dep=false, state="in", compare=false, resource=false) {
    var el_id = state + '-tree';
    if (resource) el_id += "-res";
    var margin = {top: 30, right: 30, bottom: 30, left: 10},
        width = window.innerWidth * 0.9,
        height = window.innerHeight - margin.top - margin.bottom,
        formatNumber = d3v4.format(","),
        transitioning;
    
    if (dep) {
        width = window.innerWidth * 0.45 ;
        height *= 0.8;
        el_id = "dep-tree";
        d3v4.select("#dep").remove();
    }
    if (resource) {
        width = window.innerWidth * 0.45 ;
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
        .round(true);
    
    if (!dep && !resource) d3v4.select("#treemap-" + state).remove();

    var svg = d3v4.select('#'+el_id).append("svg")
        .attr("id", function(d) {
            if (dep) return "dep";
            return "treemap-" + state;
        })
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.bottom + margin.top)
        .style("margin-left", margin.left + "px")
        .style("margin-right", -margin.right + "px")
        .style("left", 0)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .style("shape-rendering", "crispEdges");

    var grandparent = svg.append("g")
            .attr("class", "grandparent");
    grandparent.append("rect")
        .attr("y", -margin.top)
        .attr("width", width) 
        .attr("height", margin.top)
        .attr("fill", '#bbbbbb');
    grandparent.append("text")
        .attr("x", 6)
        .attr("y", 6 - margin.top)
        .attr("dy", ".75em");

    if (dep) {
        grandparent.style("font-size", "10px");
    }
    var root = d3v4.hierarchy(data);
    treemap(root
        .sum(function (d) {
            return d.value;
        })
        .sort(function (a, b) {
            return b.height - a.height || b.value - a.value;
        })
    );

    // console.log(root)
    display(root, dep);

    function display(d, dep=false) {
        var max_size = 0.9;
        if(d.children != null) {
            max_size = d.children[0].value;
        }
        

        // write text into grandparent
        // and activate click's handler
        grandparent
            .datum(d.parent)
            .on("click", d => {
                transition(d, dep)
            })
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
        
        if (d.children != null) {
            var g = g1.selectAll("g")
                .data(d.children)
                .enter()
                .append("g")
        } else {
            var g = g1.selectAll("g")
                .data(d)
                .enter()
                .append("g").append("rect")
                .call(rect)
        }

        
        // add class and click handler to all g's with children
        g.filter(function (d) {
            return d.children || [d];
        })
            .classed("children", true)
            .attr("id", function() {
                if (dep) return "dep-parent";
            })
            .on("click", d => {
                transition(d, dep)
            });            

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
                return color(d.value/max_size);
            });
        
        g.selectAll("rect.child")
            .attr("fill", function(d) {
                return color(d.parent.value/max_size);
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
                if (dep) {
                    return "8px";
                } else {
                    return "11px";
                }
            })
            .attr("class", "textdiv"); //textdiv class allows us to style the text easily with CSS
            

        g.selectAll(".textdiv")
            .style("color", function(d) {
                return textColor(color(d.value/max_size))
            })

        function transition(d, dep) {
            if (transitioning || !d) return;
            transitioning = true;
            var g2 = display(d, dep),
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
                    
    


