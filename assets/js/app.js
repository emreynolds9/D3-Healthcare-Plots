var svgWidth = 1100;
var svgHeight = 700;

var margin = {
  top: 20,
  right: 20,
  bottom: 80,
  left: 70,
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart,
// and shift the latter by left and top margins.
var svg = d3.select(".chart")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var chosenXAxis = "age";


//UPDATE X-AXIS SCALE
// function used for updating x-scale var upon click on axis label
function xScale(healthData, chosenXAxis) {
  // create scales
  var adjustment = (d3.min(healthData, d => d[chosenXAxis]))/30
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(healthData, d => d[chosenXAxis])-adjustment,
      d3.max(healthData, d => d[chosenXAxis])+1])
    .range([0, width]);

  return xLinearScale;

}

//UPDATE XAXIS
// function used for updating xAxis var upon click on axis label
function renderAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);
  return xAxis;
}

//UPDATE CIRCLES
// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, newXScale, chosenXAxis) {
  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]));

  return circlesGroup;
}

//UPDATE STATE LABELS
function renderLabels(stateLabelsGroup, newXScale, chosenXAxis) {
  stateLabelsGroup.transition()
    .duration(1000)
    .attr("x", d => newXScale(d[chosenXAxis]));
  return stateLabelsGroup;
}

//UPDATE TOOLTIP
// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, circlesGroup) {

  if (chosenXAxis === "age") {
    var label = "Median Age:";
  }
  else {
    var label = "Household Income:";
  }

  var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([100, -60])
    .html(function(d) {
      return (`${d.state}: <br>${label} ${d[chosenXAxis].toLocaleString()} <br>Healthcare Coverage: ${d.coverage}%`);
    });

  circlesGroup.call(toolTip);

  circlesGroup.on('mouseover', (d, i, n) => toolTip.show(d, n[i]))

    // onmouseout event
    .on("mouseout", (d, i, n) => toolTip.hide(d, n[i]));

  return circlesGroup;
}

// Retrieve data from the CSV file and execute everything below
d3.csv("https://raw.githubusercontent.com/emreynolds9/D3-Healthcare-Plots/master/assets/data/data.csv")
  .then(function(healthData) {
  // if (err) throw err;

  // parse data
  healthData.forEach(function(data) {
    data.age = +data.age;
    data.income = +data.income;
    data.state = data.state;
    data.abbr = data.abbr;
    data.coverage = +data.healthcare;
  });


  // xLinearScale function above csv import
  var xLinearScale = xScale(healthData, chosenXAxis);

  // Create y scale function
  var yLinearScale = d3.scaleLinear()
    .domain([d3.min(healthData, d => d.coverage)-2, d3.max(healthData, d => d.coverage)+2])
    .range([height, d3.max(healthData, d => d.coverage)]);

  // Create initial axis functions
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // append x axis
  var xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);

  // append y axis
  chartGroup.append("g")
    .call(leftAxis);

  // append initial circles
  var circlesGroup = chartGroup.selectAll("circle")
    .data(healthData)
    .enter()
    .append("circle")
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d.coverage))
    .attr("r", 20)
    .attr("class","stateCircle")
    .attr("opacity", ".5");

    //append initial labels
    var stateLabelsGroup = chartGroup.selectAll(".label")
    .data(healthData)
    .enter()
    .append("text",d=>d.abbr)
    .attr("x",d=>xLinearScale(d[chosenXAxis]))
    .attr("y",d=>yLinearScale(d.coverage)+5)
    .attr("class","label stateText")
    .text(d=>d.abbr)

  // Create group for  2 x- axis labels
  var labelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  var ageLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("class","xxx")
    .attr("value", "age") // value to grab for event listener
    .classed("active", true)
    .text("Age (Median)");

  var incomeLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("class","xxx")
    .attr("value", "income") // value to grab for event listener
    .classed("inactive", true)
    .text("Household Income");

  // append y axis
  chartGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("class","aText")
    .attr("y", 10 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    // .classed("aText", true)
    .text("Healthcare Coverage (%)");

  // updateToolTip function above csv import
  var circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

  // x axis labels event listener
  labelsGroup.selectAll(".xxx")
    .on("click", function() {
      // get value of selection
      var value = d3.select(this).attr("value");

      if (value !== chosenXAxis) {

        // replaces chosenXAxis with value
        chosenXAxis = value

        // functions here found above csv import
        // updates x scale for new data
        xLinearScale="null"
        console.log(xLinearScale)

        xLinearScale = xScale(healthData, chosenXAxis);

        // updates x axis with transition
        xAxis = renderAxes(xLinearScale, xAxis);

        // updates circles with new x values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis);

        //update labels
        stateLabelsGroup = renderLabels(stateLabelsGroup, xLinearScale, chosenXAxis);

        // updates tooltips with new info
        circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

        // changes classes to change bold text
        if (chosenXAxis === "age") {
          ageLabel
            .classed("active", true)
            .classed("inactive", false);
          incomeLabel
            .classed("active", false)
            .classed("inactive", true);
        }
        else {
          ageLabel
            .classed("active", false)
            .classed("inactive", true);
          incomeLabel
            .classed("active", true)
            .classed("inactive", false);
        }
      }
    });
});
