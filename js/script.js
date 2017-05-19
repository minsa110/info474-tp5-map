$(function() {
    // Set global variables (width, height, etc.)
    var height = 600;
    var width = 1500;

    var minValue = 100;
    var maxValue = 0;

    // Create svg and g elements
    var svg = d3.select("#vis")
        .append("svg")
        .attr('width', width)
        .attr('height', height);
    
    var drawMap = d3.map();
    var drawPath = d3.geoPath();

    // Create a color scale
    var color = d3.scaleThreshold()
        .range(d3.schemeRdBu[6]);

    // Load and prep data and shapefile
    d3.queue()
        .defer(d3.json, "https://d3js.org/us-10m.v1.json")
        .defer(d3.csv, "./data/ihme-life-expectancy.csv", function(d) {
            var fips = d.FIPS;
            if (fips.length == 4)
                fips = "0" + fips;

            var rawData = d["Life expectancy, 2014*"];
            var rawValue = +rawData.split(" ")[0];
            var roundedValue = Math.round(rawValue);

            if (roundedValue != 0 && fips.length == 5) {
                drawMap.set(fips, roundedValue);
                minValue = Math.min(minValue, roundedValue);
                maxValue = Math.max(maxValue, roundedValue);
            }
        })
        .await(ready);

    // Function once data and shapefile are loaded
    function ready(error, us) {
        if (error) throw error;

        // Set color scale domain
        var step = 5;
        color.domain(d3.range(minValue, maxValue, (maxValue-minValue)/step));

        // Append and draw counties (with transition)
        svg.append("g")
            .attr('class', 'countries')
            .selectAll('path')
            .data(topojson.feature(us, us.objects.counties).features)
            .enter().append('path')
            .attr('d', drawPath)
            .attr('fill', 'grey')
            .transition()
            .delay((d, i) => {
                d.lifeExpectancy = drawMap.get(d.id)
                return (d.lifeExpectancy - minValue) * 120;
            })
            .attr('fill', (d) => {
                d.lifeExpectancy = drawMap.get(d.id)
                return color(d.lifeExpectancy);
            })

        // Draw state paths
        svg.append('path')
            .datum(topojson.mesh(us, us.objects.states, (a, b) => {
                return a !== b;
            }))
            .attr('class', 'states')
            .attr('d', drawPath)

        // Append a legend using d3.legend
        svg.append("g")
            .attr("class", "expectancyLegend")
            .attr("transform", "translate(950,125)");

        var legend = d3.legendColor()
            .labelFormat(d3.format(".0f"))
            .labels(d3.legendHelpers.thresholdLabels)
            .scale(color)

        svg.select(".expectancyLegend")
            .call(legend);

    }
});