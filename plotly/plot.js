// Find your api_key here: https://plot.ly/settings/api
apiKey = process.argv[2];
if (!apiKey) throw new Error('pass api key as command line argument');

_ = require('underscore');

initialBpm = v0 = 90;
finalBpm = v1 = 135;
durationInBeatsAtInitialTempo = 64;
durationInMinutes = t = durationInBeatsAtInitialTempo / initialBpm;
beatsInChangingTempo = b1 = p1 = 80;

initialAcceleration = a0 = ((6 * b1) - (2 * t) * (v1 + (2 * v0))) / (t * t);
finalAcceleration = a1 = (v0 - v1 + (initialAcceleration * t)) * (-2/(t * t));

// resolution of our time
resolution = 100;
// array of times (in minutes) at which we will sample our curves
time = _(_.range(resolution + 1)).map(function(val){return val / resolution * durationInMinutes});

// array of how many beats have elapsed relative to time
beatsElapsed = _(time).map(function(t){
  return 0 + (v0 * t) + (a0 * t * t)/2 + (a1 * t * t * t)/6;
});

// array of current tempo, sampled <resolution> times
bpm = _(time).map(function(t){
  return v0 + (a0 * t) + (a1 * t * t)/2;
});

staticBeats = _(time).map(function(t){
  return initialBpm * t;
});

var blue = "1f77b4";
var orange = "ff7f0e";

var lightGrey = "bfbfbf";
var grey = "808080";
var black = "000000";
var titleFontSize = 22
var axisLineWidth = 2;
var tempoColor = black;
var beatsColor = grey;
var axisTitleFontSize = 18;
var axisTickFontSize = 16;


var plotly = require('plotly')('cholbrow', apiKey);
var data = [
  {
    x: staticBeats,
    y: bpm,
    type: "scatter",
    name: "Tempo",
    line:{
      color:tempoColor,
      width:2,
      shape:"linear",
      dash:"dash" // solid, dash, dot, longdash, dashdot, longdashdot
    }
  },
  {
    x: staticBeats,
    y: beatsElapsed,
    type: "scatter",
    name: "Beats Elapsed",
    yaxis: "y2",
    line:{
      color:beatsColor,
      width:3,
      shape:"linear",
      dash:"solid"
    }
  }
];

var layout = {
  // title: "Tempo Toy",
  titlefont: {size: titleFontSize},
  xaxis: {
    title: "Time, Measured in Beats at " + initialBpm + " BPM",
    // zeroline on the xaxis is the vertical zero line
    zeroline: false,
    titlefont: {color: beatsColor, size: axisTitleFontSize},
    tickfont: {color: beatsColor, size: axisTickFontSize},
  },
  yaxis: {
    title: "Beats Per Minute",
    titlefont: {color: tempoColor, size: axisTitleFontSize},
    tickfont: {color: tempoColor, size: axisTickFontSize},
    showline: true,
    linecolor: tempoColor,
    linewidth: axisLineWidth,
    side: 'left',
    range: [-1, 138],
    // zeroline on the y axis horizontal line
    zeroline: true,
    zerolinewidth: axisLineWidth,
    zerolinecolor: black,
  },
  yaxis2: {
    title: "Beats Elapsed",
    titlefont: {color: beatsColor, size: axisTitleFontSize},
    tickfont: {color: beatsColor, size: axisTickFontSize},
    overlaying:  'y',
    side:'right',
    showline: true,
    linecolor: beatsColor,
    linewidth: axisLineWidth,
    range: [-1, 138]
  }
};

var graphOptions = {
  filename: "tempo toy",
  fileopt: "overwrite",
  layout: layout
};
plotly.plot(data, graphOptions, function (err, msg) {
  console.log('err:', err);
  console.log(msg);
});
