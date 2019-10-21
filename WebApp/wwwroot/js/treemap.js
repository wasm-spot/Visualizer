function getInputTree() {
    var inputSize = document.getElementById("size").value;
    var overload = document.getElementById("overload").checked;
    displayTree(data, inputSize, overload);
    window.scrollTo(0,document.body.scrollHeight);
  }
function displayTreemap(data) {

    d3v4.select("#submit")
        .on("click", function() {
            getInputTree();
        })
    d3v4.select("#size")
        .on("keypress", function() {
          if (d3v4.event.keyCode == 13) {
            d3v4.event.preventDefault();
            getInputTree();
          }
        })
    }

    function displayTree(data, inputSize, overload, flower=false) {
        var el_id = 'chart';
        var obj = document.getElementById(el_id);
        var margin = {top: 30, right: 100, bottom: window.innerHeight*0.1, left: 100},
            width = window.innerWidth -25,
            grandparent_width = width,
            height = window.innerHeight - margin.top - margin.bottom,
            formatNumber = d3v4.format(","),
            transitioning;

        var color = d3v4.scaleOrdinal().range(d3v4.schemeCategory20c);
        if (!flower) {
            d3v4.select("svg").remove();
            data = formatAssemblyTree(data, size=inputSize, overload=overload, type="tree")
        } else {
            width *= 0.8;
            height *= 0.3;
            grandparent_width = width/2;
            el_id = "visualization";
            d3v4.select("#flower-tree").remove();
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
        .style("margin-left", -margin.left + "px")
        .style("margin-right", -margin.right + "px")
        .style("position", "absolute")
        .style("left", 0)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .style("shape-rendering", "crispEdges");
    } else{
        var svg = d3v4.select('#'+el_id).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.bottom + margin.top)
        .style("margin-left", -margin.left + "px")
        .style("margin-right", -margin.right + "px")
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

    // if (data.children == null) data.children = data._children;
    var root = d3v4.hierarchy(data);
    console.log(root)
    treemap(root
        .sum(function (d) {
            if (flower){
                return d.size;
            } else {
                return d.value;
            }
        })
        .sort(function (a, b) {
            return b.height - a.height || b.value - a.value
        })
    );
    
    display(root);

    function display(d) {
        // write text into grandparent
        // and activate click's handler
        grandparent
            .datum(d.parent)
            .on("click", transition)
            .select("text")
            .text(name(d));
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
                return color(d.data.name);
            });
        
        g.selectAll("rect.child")
            .attr("fill", function(d) {
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
                    
    


