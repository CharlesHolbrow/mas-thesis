// Find your api_key here: https://plot.ly/settings/api
apiKey = process.argv[2];
if (!apiKey) throw new Error('pass api key as command line argument');

_ = require('underscore');

var generate = function(initialBpm, finalBpm, durationInBeatsAtInitialTempo, beatsInChangingTempo){
  var v0, v1, durationInMinutes;
  var t, b1, p1;
  var initialAcceleration, a0, finalAcceleration, a1;

  v0 = initialBpm;
  v1 = finalBpm;
  
  durationInMinutes = t = durationInBeatsAtInitialTempo / initialBpm;
  b1 = p1 = beatsInChangingTempo;

  initialAcceleration = a0 = ((6 * b1) - (2 * t) * (v1 + (2 * v0))) / (t * t);
  finalAcceleration = a1 = (v0 - v1 + (initialAcceleration * t)) * (-2/(t * t));

  // resolution of our time
  var resolution = 9000;
  var safety = 100; //sample a little extra, so we don't cut off last beat because of floating point stuff
  // array of times (in minutes) at which we will sample our curves
  time = _(_.range(resolution + safety)).map(function(val){return val / resolution * durationInMinutes});

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

  // keys: beat number
  // values: [timeInMinutes, accuracy]
  firstBeats = {};
  _(beatsElapsed).each(function(val, index){
    t = time[index]
    beat = Math.floor(val);
    // do we already have a time for this beat?
    if (firstBeats[beat]) return;
    firstBeats[beat] = [t, val];
  });

  var changingBeatsRelativeToStaticBeats = _(firstBeats).map(function(val){return val[0] * initialBpm});

  // prepend a fake measure of 4/4
  var pre = [-4, -2, -3, -1];
  var changingBeatsRelativeToStaticBeats = pre.concat(changingBeatsRelativeToStaticBeats);
  staticBeatsDisplayData = pre.concat(_.range(durationInBeatsAtInitialTempo + 1));  // hack: global var
  // Append a fake measure
  end = staticBeatsDisplayData[staticBeatsDisplayData.length - 1] // hack: global var
  var post = [end+1,end+2,end+3,end+4];
  var extra = 80;
  post = _.range(1,extra + 1).map(function(i){return end+i})
  staticBeatsDisplayData = staticBeatsDisplayData.concat(post);
  var oneBeatRealtiveToStatic = aBeat = initialBpm / finalBpm;
  post = [end + aBeat * 1, end + aBeat * 2, end + aBeat * 3, end + aBeat * 4];
  post = _.range(1, extra + 1).map(function(i){return end + aBeat * i});
  changingBeatsRelativeToStaticBeats = changingBeatsRelativeToStaticBeats.concat(post);
  return changingBeatsRelativeToStaticBeats;
};

var initialBpm = 90
changingBeatsRelativeToStaticBeats = generate(initialBpm, 120, 16, 20);
changingBeatsRelativeToStaticBeats2 = generate(initialBpm, 120, 16, 21);



var blue = "1f77b4";
var orange = "ff7f0e";

var lightGrey = "bfbfbf";
var grey = "808080";
var black = "000000";
var titleFontSize = 44
var axisLineWidth = 2;
var tempoColor = black;
var beatsColor = grey;
var axisTitleFontSize = 30;
var axisTickFontSizeX = 30;
var axisTickFontSizeY = 24;
var annotationFontSize = 24;
var dotSize = 6;

var config = {
  x1Low: 10,
  x1High: 60,
  height: 800,
  width: 1440
};

var plotly = require('plotly')('cholbrow', apiKey);

var baseDatum = {
  type: "scatter",
  mode: "markers",
  marker:{
    size: dotSize,
    color:tempoColor,
  }
};

// sequence var used in layout to determine how tall to make the graph
var sequence = _.range(config.x1Low, config.x1High + 1);
var data = _(sequence).map(function(transitionBeats, index){
  var changingBeats = generate(90, 220, 16+index, transitionBeats);
  return _.defaults({
    x: changingBeats,
    y: _(changingBeats).map(function(){return transitionBeats })
  }, baseDatum);
});

var staticData = _(baseDatum).extend({
  x: staticBeatsDisplayData,
  y: _(staticBeatsDisplayData).map(function(){return sequence[0] - 1}),
  marker:{
    size: dotSize,
    color: beatsColor,
  }
});

//data.push(staticData);

var layout = {
  // title: chartTitle,
  titlefont: {size: titleFontSize},
  width: config.width,
  height: config.height,
  showlegend: false,
  margin: {
    b:90,
    t:120,
    l:120,
    r:60,
  },
  xaxis: {
    title: "Time, Measured in Beats at Initial Tempo",
    // zeroline on the xaxis is the vertical zero line
    zeroline: false,
    showline: false,
    titlefont: {color: beatsColor, size: axisTitleFontSize},
    tickfont: {color: beatsColor, size: axisTickFontSizeX},
    autotick: false,
    tick0: -4,
    dtick: 4,
    range: [-0.5, 40]
  },
  yaxis: {
    // autotick: false,
    tick0: 10,
    dtick: 10,
    title: "Beats During Transition",
    titlefont: {color: tempoColor, size: axisTitleFontSize},
    tickfont: {color: tempoColor, size: axisTickFontSizeY},
    showline: false,
    linecolor: tempoColor,
    linewidth: axisLineWidth,
    side: 'left',
    range: [sequence[0] - 1.5, sequence[sequence.length-1] + 0.5], // static beats is one below lowest
    // showticks: false,
    zeroline: false, // zeroline on the y axis horizontal line
    zerolinewidth: axisLineWidth,
    zerolinecolor: black,
  },
  annotations: [
    {
      font:{size:annotationFontSize},
      x: 0,
      y: sequence[sequence.length-1] + 0.4,
      xref: "x",
      yref: "y",
      text: "Begin Tempo Ramp from 90 BPM",
      showarrow: true,
      arrowhead: 2, // integer, choose an arrow style
      arrowsize: 1,
      arrowwidth: 3,
      ax: 0,
      ay: -64
    },
    {
      font:{size:annotationFontSize},
      x: end,
      y: sequence[sequence.length -1] + 0.4,
      xref: "x",
      yref: "y",
      text: "Tempo Acceleration Complete at 120 BPM",
      showarrow: true,
      arrowhead: 2,
      arrowsize: 1,
      arrowwidth: 3,
      ax: 0,
      ay: -64
    }
  ]
};

layout.annotations = [];

var graphOptions = {
  filename: "Stochastic Tempi",
  fileopt: "overwrite",
  layout: layout
};
plotly.plot(data, graphOptions, function (err, msg) {
  console.log('err:', err);
  console.log('res:', msg);
});
