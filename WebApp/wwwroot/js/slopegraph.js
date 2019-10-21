function displaySlopegraph(data_in, data_out) {
    d3v4.select("#submit")
        .on("click", function() {
            var inputSize = document.getElementById("size").value;
            var overload = document.getElementById("overload").checked;
            drawSlope(data_in, data_out, inputSize, overload);
            window.scrollTo(0,document.body.scrollHeight);
        })
}

function drawSlope(data_in, data_out, inputSize, overload) {
    var margin = {top: 100, right: 150, bottom: 40, left: 150};
   
    var width = window.innerWidth - margin.left - margin.right,
        height = window.innerHeight - margin.top - margin.bottom;
        

    var url = "https://raw.githubusercontent.com/tlfrd/pay-ratios/master/data/payratio.json";

    var y1 = d3v4.scalePow()
        .exponent(2)
        .range([height, 0]);
    
    var config = {
        xOffset: 0,
        yOffset: 0,
        width: width,
        height: height,
        labelPositioning: {
            alpha: 0.5,
            spacing: 18
        },
        leftTitle: "Linker in",
        rightTitle: "Linker out",
        labelGroupOffset: 5,
        labelKeyOffset: 50,
        radius: 6,
        // Reduce this to turn on detail-on-hover version
        unfocusOpacity: 0.2
        }
    
    var totalData = formatComparison(data_in, data_out, size=inputSize, overload=overload);
    var classData = {"linker_in": totalData.linker_in.class, "linker_out": totalData.linker_out.class};
    drawSlopeGraph(classData);

    function drawSlopeGraph(data, name="mscorlib") {
        
        var svg = d3v4.select("body").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var grandparent = svg.append("g")
        .attr("class", "grandparent");
        grandparent.append("rect")
            .attr("y", -margin.top)
            .attr("width", width) 
            .attr("height", 30)
            .attr("fill", '#bbbbbb');
        var text = grandparent.append("text")
            .attr("x", 6)
            .attr("y", 6 - margin.top)
            .attr("dy", ".75em")
            .text(name)
            .on("click", function() {
                drawSlopeGraph(classData);
            });

        var sizes = [];

        data.linker_in.forEach(function(d) {
            d.state = "in";
            sizes.push(d);
        });

        data.linker_out.forEach(function(d) {
            d.state = "out";
            sizes.push(d);
        });

        var nestedByName = d3v4.nest()
            .key(function(d) { return d.name; })
            .entries(sizes);

        nestedByName = nestedByName.filter(function(d) {
            return d.values.length > 1;
        });

    var y1Min = d3v4.min(nestedByName, function(d) {        
        var ratio1 = d.values[0].value;
        var ratio2 = d.values[1].value;
        
        return Math.min(ratio1, ratio2);
        });

    var y1Max = d3v4.max(nestedByName, function(d) {
        var ratio1 = d.values[0].value;
        var ratio2 = d.values[1].value;

        return Math.max(ratio1, ratio2);
    });

    y1.domain([y1Min, y1Max]);

    var yScale = y1;

    var voronoi = d3v4.voronoi()
        .x(d => d.state == "in" ? 0 : width)
        .y(d => yScale(d.value))
        .extent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);

    var borderLines = svg.append("g")
        .attr("class", "border-lines")
    borderLines.append("line")
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", 0).attr("y2", config.height);
    borderLines.append("line")
        .attr("x1", width).attr("y1", 0)
        .attr("x2", width).attr("y2", config.height);
    
    var slopeGroups = svg.append("g")
        .selectAll("g")
        .data(nestedByName)
        .enter().append("g")
            .attr("class", "slope-group")
            .attr("id", function(d, i) {
                d.id = "group" + i;
                d.values[0].group = this;
                d.values[1].group = this; 
            });

    var slopeLines = slopeGroups.append("line")
        .attr("class", "slope-line")
        .attr("x1", 0)
        .attr("y1", function(d) {
            return y1(d.values[0].value);
        })
        .attr("x2", config.width)
        .attr("y2", function(d) {
            return y1(d.values[1].value);
        });

    

    var leftSlopeCircle = slopeGroups.append("circle")
        .attr("class", "slope-circle")
        .attr("r", config.radius)
        .attr("cy", d => y1(d.values[0].value))
        .append("title")
            .text(d => d.key + "\n" + "Size: " + d.values[0].value)
        .on("mouseover", mouseoverCircle)
        .on("mouseout", mouseleaveCircle);

    function mouseoverCircle(d) {
        var circle = d3v4.select(this)
        circle.attr("r", config.radius * 1.2);
    }

    function mouseleaveCircle(d) {
        var circle = d3v4.select(this);
        circle.attr("r", config.radius);
    }

    var leftSlopeLabels = slopeGroups.append("g")
        .attr("class", "slope-label-left")
        .each(function(d) {
            d.xLeftPosition = -config.labelGroupOffset;
            d.yLeftPosition = y1(d.values[0].value);
        });

    leftSlopeLabels.append("text")
        .attr("class", "label-figure")
        .attr("x", d => d.xLeftPosition)
        .attr("y", d => d.yLeftPosition)
        .attr("dx", -10)
        .attr("dy", 3)
        .attr("text-anchor", "end")
        .text(d => (d.values[0].value).toPrecision(3));

    var rightSlopeCircle = slopeGroups.append("circle")
        .attr("class", "slope-circle")
        .attr("r", config.radius)
        .attr("cx", config.width)
        .attr("cy", d => y1(d.values[1].value));

    var rightSlopeLabels = slopeGroups.append("g")
        .attr("class", "slope-label-right")
        .each(function(d) {
            d.xRightPosition = width + config.labelGroupOffset;
            d.yRightPosition = y1(d.values[1].value);
        });

    rightSlopeLabels.append("text")
        .attr("class", "slope-figure")
        .attr("x", d => d.xRightPosition)
        .attr("y", d => d.yRightPosition)
        .attr("dx", 10)
        .attr("dy", 3)
        .attr("text-anchor", "start")
        .text(d => (d.values[1].value).toPrecision(3));

    var titles = svg.append("g")
                    .attr("class", "title")
    
    titles.append("text")
        .attr("text-anchor", "end")
        .attr("dx", -10)
        .attr("dy", -margin.top/2)
        .text(config.leftTitle);

    titles.append("text")
        .attr("x", config.width)
        .attr("dx", -10)
        .attr("dy", -margin.top/2)
        .text(config.rightTitle);

    // relax(leftSlopeLabels, "yLeftPosition");
    leftSlopeLabels.selectAll("text")
        .attr("y", d => d.yLeftPosition);
    
    // relax(rightSlopeLabels, "yRightPosition");
    rightSlopeLabels.selectAll("text")
        .attr("y", d => d.yRightPosition);

    d3v4.selectAll(".slope-group")
        .attr("opacity", config.unfocusOpacity);

    var voronoiGroup = svg.append("g")
        .attr("class", "voronoi");

    voronoiGroup.selectAll("path")
        .data(voronoi.polygons(d3v4.merge(nestedByName.map(d => d.values))))
        .enter().append("path")
            .attr("d", function(d) { return d ? "M" + d.join("L") + "Z" : null; })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .on("click", show);

    var tooltip = d3v4.select("#tooltip");

    function show(d) {
        d3v4.select("svg").remove();
        var name = d.data.name;
        var newData = classData;
        if (name in totalData.linker_in && name in totalData.linker_out) {
            newData = {"linker_in": totalData.linker_in[name], "linker_out": totalData.linker_out[name]};
        } else {
            name = "mscorlib";
        }       
        
        drawSlopeGraph(newData, name);
    }

    function mouseover(d) {
        d3v4.select(d.data.group).attr("opacity", 1);
        tooltip
            .html(d.data.name)
            .style("display","block")
            .style("left", d3v4.event.pageX + 20 + "px")
            .style("top", d3v4.event.pageY -20 + "px") 

        tooltip.append("div")
            .html("Size: " + d.data.value + "(" + d.data.state + ")");
    }

    function mouseout(d) {
        d3v4.selectAll(".slope-group")
            .attr("opacity", config.unfocusOpacity);

        tooltip.style("display", "none");
    }
    }

    
    
} 