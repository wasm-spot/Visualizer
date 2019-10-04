function displayLineGraph(json) {
    var margin = {top: 120, right: 280, bottom: 150, left: 170},
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom,
    radius = 6;

    var data = JSON.parse(json);
    var parseTime = d3v4.timeParse("%Y-%m-%dT%I:%M:%S.0000000+00:00");

    var x = d3v4.scaleTime().range([0, width]);
    var y = d3v4.scaleLinear().range([height, 0]);

    var svg = d3v4.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", 
                "translate(" + margin.left + "," + margin.top + ")");

    var xAxis = d3v4.axisBottom(x);
    var yAxis = d3v4.axisLeft(y);

    var lines = [];
    
    var lib = Object.keys(data[0]).filter(function(value, index, arr) {
        return value != "Date" && index != 0;
    })

    var color = d3v4.scaleOrdinal()
        .domain(lib)
        .range(d3v4.schemeCategory10)

    title = Object.keys(data[0])[0];
    data.forEach(function(d) {
        d["Date"] = parseTime(d["Date"]);
        lib.forEach(function(l) {
            d[l] = +d[l];
        })
    });

    lib.forEach(function(l) {
        line = d3v4.line()
            .x(function(d) { return x(d["Date"]); })
            .y(function(d) { return y(d[l]); });
        lines.push(line);
    })

    x.domain(d3v4.extent(data, function(d) { return d["Date"]; }));
    y.domain([0, d3v4.max(data, function(d) { 
        return Math.max(d["mscorlib.dll"]); }) + 100000]);

    var gX = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add X axis label:
    svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width)
            .attr("y", height+40 )
            .style("font-family", "Arial")
            .text("Time");

    var gY = svg.append("g")
        .call(yAxis)
        .attr("class", "axis axis--y");

    // Add Y axis label:
    svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", 0)
            .attr("y", -20 )
            .text("Size")
            .style("font-family", "Arial")
            .attr("text-anchor", "start")

    svg.append('defs')
        .append('clipPath')
        .attr('id', 'clip')
        .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', width)
            .attr('height', height);

    const main = svg.append('g')
        .attr('class', 'main')
        .attr('clip-path', 'url(#clip)');

    for (var i=0; i < lines.length; i++) {
        main.append("path")
                .data([data])
                .attr("class", "myLine " + lib[i].replace(/\./g, ''))
                .style("stroke", color(lib[i]))
                .style("fill-opacity", 0)
                .style("stroke-width", 2)
                .attr("d", lines[i]);
    }

    var brush = d3v4.brushX()
        .extent([[0, 0], [width, height]])
        .on("end", updateChart)

    main.append("g")
        .attr("class", "brush")
        .call(brush);

    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("text-decoration", "underline")  
        .text(title);

    var idleTimeout
    function idled() { idleTimeout = null; }

    function updateChart() {    
        extent = d3v4.event.selection
        if (!extent) {
            if (!idleTimeout) return idleTimeout = setTimeout(idled, 350);
            x.domain(d3v4.extent(data, function(d) { return d["Date"]; }))
        } else {
            x.domain([x.invert(extent[0]), x.invert(extent[1]) ])
            main.select(".brush").call(brush.move, null)
        }
        gX.transition().duration(1000).call(d3v4.axisBottom(x).ticks(5))
        for (var i=0; i<lib.length; i++) {
            main.select("." + lib[i].replace(/\./g, ''))
                .transition().duration(1000)
                .attr("d", lines[i])
        }

    }

    //////////////////////
    //  HIGHLIGHT GROUP //
    /////////////////////            
    var highlight = function(d) {
        svg.selectAll(".myLine").style("opacity", .1);
        svg.select("." + d.replace(/\./g, "")).style("opacity", 1)
    }

    var noHighlight = function(d) {
        svg.selectAll(".myLine").style("opacity", 1)
    }

    //////////////////////
    //     LEGEND      //
    /////////////////////
    var size = 12
    svg.selectAll("myrect")
        .data(lib)
        .enter()
        .append("rect")
            .attr("x", width + 20)
            .attr("y", function(d, i) { return i*(size+5)})
            .attr("width", size)
            .attr("height", size)
            .style("fill", function(d) { return color(d)})
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)
    
    svg.selectAll("mulabels")
        .data(lib)
        .enter()
        .append("text")
            .attr("x", width + 40)
            .attr("y", function(d, i) { return i*(size+5) + (size/2)})
            .style("fill", function(d) { return color(d)})
            .text(function(d){ return d})
            .style("font-size", 10)
            .style("font-family", "Arial")
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)
}

function displayAreaGraph (json) { 
    var margin = {top: 120, right: 280, bottom: 150, left: 170},
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom,
    radius = 6;
    
    var data = JSON.parse(json);
    var parseTime = d3v4.timeParse("%Y-%m-%dT%I:%M:%S.0000000+00:00");

    var x = d3v4.scaleTime().range([0, width]);
    var y = d3v4.scaleLinear().range([height, 0]);

    var svg = d3v4.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", 
                "translate(" + margin.left + "," + margin.top + ")");

    var xAxis = d3v4.axisBottom(x);
    var yAxis = d3v4.axisLeft(y);

    var lib = Object.keys(data[0]).filter(function(value, index, arr) {
        return value != "Date" && index != 0;
    })
    title = Object.keys(data[0])[0];

    var color = d3v4.scaleOrdinal()
        .domain(lib)
        .range(d3v4.schemeCategory10)

    data.forEach(function(d) {
        d["Date"] = parseTime(d["Date"]);
        lib.forEach(function(l) {
            d[l] = +d[l];
        })
    });

    var stackedData = d3v4.stack()
        .keys(lib)
        (data)
        
    x.domain(d3v4.extent(data, function(d) { return d["Date"]; }));
    y.domain([0, d3v4.max(data, function(d) { 
        return Math.max(d["mscorlib.dll"], d["System.dll"], 
                        d["System.Core.dll"]); }) + 100000]);
    
    var areaX = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
        
    // Add X axis label:
    svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width)
            .attr("y", height+40 )
            .style("font-family", "Arial")
            .text("Time");
    
    svg.append("g")
        .call(yAxis)

        // Add Y axis label:
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", 0)
            .attr("y", -20 )
            .text("Size")
            .style("font-family", "Arial")
            .attr("text-anchor", "start")

    var brush = d3v4.brushX()
        .extent([[0,0], [width, height]])
        .on("end", updateChart)

    var areaChart = svg.append("g")
        .attr("clip-path", "url(#clip)")

    var area = d3v4.area()
        .x(function(d) { return x(d.data.Date)})
        .y0(function(d) { return y(d[0]); })
        .y1(function(d) { return y(d[1]); })

    areaChart  
        .selectAll("mylayers")
        .data(stackedData)
        .enter()
        .append("path")
                .attr("class", function(d) { return "myArea " + d.key.replace(/\./g, ""); })
                .style("fill", function(d) { return color(d.key); })
                .attr("d", area)

    areaChart
        .append("g")
        .attr("class", "brush")
        .call(brush)

    var idleTimeout
    function idled() { idleTimeout = null; }

    function updateChart() {    
        extent = d3v4.event.selection
        if (!extent) {
            if (!idleTimeout) return idleTimeout = setTimeout(idled, 350);
            x.domain(d3v4.extent(data, function(d) { return d["Date"]; }))
        } else {
            x.domain([x.invert(extent[0]), x.invert(extent[1]) ])
            areaChart.select(".brush").call(brush.move, null)
        }

        areaX.transition().duration(1000).call(d3v4.axisBottom(x).ticks(5))
        areaChart
            .selectAll("path")
            .transition().duration(1000)
            .attr("d", area)
    }

    //////////////////////
    //  HIGHLIGHT GROUP //
    /////////////////////
    var highlight = function(d) {
        svg.selectAll(".myArea").style("opacity", .1);
        svg.select("."+ d.replace(/\./g, "")).style("opacity", 1);
    }

    var noHighlight = function(d) {
        svg.selectAll(".myArea").style("opacity", 1)
    }

    //////////////////////
    //     LEGEND      //
    /////////////////////
    var size = 12
    svg.selectAll("myrect")
        .data(lib)
        .enter()
        .append("rect")
            .attr("x", width + 20)
            .attr("y", function(d, i) { return i*(size+5)})
            .attr("width", size)
            .attr("height", size)
            .style("fill", function(d) { return color(d)})
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)
        
    
    svg.selectAll("mylabels")
        .data(lib)
        .enter()
        .append("text")
            .attr("x", width + 40)
            .attr("y", function(d, i) { return i*(size+5) + (size/2)})
            .style("fill", function(d) { return color(d)})
            .text(function(d){ return d})
            .style("font-size", 10)
            .style("font-family", "Arial")
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)
}