function displayFlameGraph(data) {
    var margin = {top: 30, right: 100, bottom: window.innerHeight*0.1, left: 100};
    var flameGraph = d3v4.flamegraph()
        .width(window.innerWidth - margin.left - margin.right)
        .cellHeight(30)
        .transitionDuration(750)
        .transitionEase(d3v4.easeCubic)
        .sort(true)

    d3v4.select("svg")
        .style("margin-top", "30px");

    var tip = d3v4.tip()
        .direction("s")
        .offset([8, 0])
        .attr("class", "d3v4-flame-graph-tip")
        .html(function(d) { return "name: " + d.data.name + ", value: " + d.data.value; });

    flameGraph.tooltip(tip);

    data = formatAssemblyTree(data, size=100, overload=true, type="flame");

    console.log(data);

    d3v4.select("#chart")
        .datum(data)
        .call(flameGraph);
}