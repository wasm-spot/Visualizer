function hexToRgb(hex) {
    hex = hex.replace('#', '');
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return "rgb(" + r + "," + g + "," + b + ")";
}

function graph(url) {
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    var margin = {top: 120, right: 170, bottom: 130, left: 170},
    width = 1080 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom,
    radius = 6;

    var parseTime = d3.timeParse("%Y-%m-%dT%I:%M:%SZ");

    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", 
                "translate(" + margin.left + "," + margin.top + ")");

    d3.csv(url, 
    function(error, data) {
        if (error) throw error;

        var lines = [];
        var colors = [];
        
        var lib = Object.keys(data[0]).filter(function(value, index, arr) {
            return value != "Date" && value != "Commit";
        })
        console.log(lib)

        lib.forEach(function(l) {
            line = d3.line()
                .x(function(d) { return x(d["Date"]); })
                .y(function(d) { return y(d[l]); });
            lines.push(line);
        })

        data.forEach(function(d) {
            d["Date"] = parseTime(d["Date"]);
            
            lib.forEach(function(l) {
                d[l] = + d[l];
            })
        });

        //  if i want to add mouse over interactivity
        var xScale = d3.scale.linear()
            .domain([0, d3.max(data, function(d) { return d.x + 10; })])
            .range([margin.left, width-margin.right]);
        
        var yScale = d3.scale.linear()
            .domain([0, d3.max(data, function(d) { return d.y + 10; })])
            .range([margin.top. h-margin.bottom]);

        var circleAttrs = {
            cx: function(d) { return xScale(d.x); },
            cy: function(d) { return yScale(d.y); },
            r: radius
        }

        x.domain(d3.extent(data, function(d) { return d["Date"]; }));
        y.domain([0, d3.max(data, function(d) { 
            return Math.max(d["mscorlib.dll"], d["System.dll"], 
                            d["System.Core.dll"]); }) + 100000]);
        
        for (var i=0; i < lines.length; i++) {
            colors.push(hexToRgb(color(i)))
            svg.append("path")
                    .data([data])
                    .attr("class", "line")
                    .attr("data-legend", lib[i])
                    .style("stroke", color(i))
                    .attr("d", lines[i]);
        }

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        svg.append("g")
            .call(d3.axisLeft(y));

        var ordinal = d3.scaleOrdinal()
            .domain(lib)
            .range(colors)

        svg.append("g")
            .attr("class", "legendOrdinal")
            .attr("transform", "translate(" + (width + 20) + ",20)")
            .style("font-size", "10px")
            .style("font-family", "Arial")

        var legendOrdinal = d3.legendColor()
            .scale(ordinal);

        svg.select(".legendOrdinal")
            .call(legendOrdinal);
    });
}

