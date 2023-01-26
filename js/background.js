var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
});

var c = document.getElementById("bkgCanvas");
c.width = c.height * (c.clientWidth / c.clientHeight)
var ctx = c.getContext("2d");
ctx.fillStyle = '#E9E6FF';
ctx.imageSmoothingEnabled = true;
ctx.lineWidth = 5;
var raf;

class DataPoint {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Dataset {
  constructor(points, fillStyle) {
    this.points = points;
    this.fillStyle = fillStyle;
  }
}

class Point {
  constructor(x, y, vx, vy, flashRate) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.flashRate = flashRate;
    this.brightness = 1.0;
  }
}

class DrawSignal {
  constructor(x, y, width, height, dataset) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.dataset = dataset; //Represents points.  fillStyle, points (x, y) E [0, 1]
  }

  draw() {
    const x = this.x;
    const y = this.y;
    const width = this.width;
    const height = this.height;
    const dataset = this.dataset;
    ctx.beginPath();
    ctx.strokeStyle = dataset.fillStyle;
    ctx.moveTo(this.dataset.points[0].x + this.x, this.dataset.points[0].y + this.y);

    let first = true;
    this.dataset.points.forEach(pt => function() {
      const ptX = x + pt.x * width;
      const ptY = y - pt.y * height;

      if (!first) {
        ctx.lineTo(ptX, ptY);
        ctx.moveTo(ptX, ptY);
      } first = false;
      //ctx.closePath();
    }());
    ctx.stroke();
    ctx.closePath();
  }
}

function fftshift(array) {
  const len = array.length;
  const numToShift = Math.floor(len / 2);
  const odd = len % 2;
  return array.slice(numToShift + odd).concat(array.slice(0, numToShift + odd));
}

class DrawFFT {
  constructor(x, y, width, height, style, array) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.style = style;
    this.array = array;
  }

  draw() {
    const x = this.x;
    const y = this.y;
    const width = this.width;
    const height = this.height;
    const array = this.array;
    ctx.beginPath();
    ctx.strokeStyle = this.style;
    ctx.moveTo(this.x, -Math.abs(array[i]) + this.y)

    let first = true;
    for (i = 0; i < array.length / 2; ++i) {
      const ptX = x + width * ((2 * i) / array.length);
      const power = Math.sqrt(Math.pow(array[2 * i], 2) + Math.pow(array[2 * i + 1], 2));
      const ptY = y - power * height;

      if (!first) {
        ctx.lineTo(ptX, ptY);
        ctx.moveTo(ptX, ptY);
      } first = false;
      //ctx.closePath();
    }
    ctx.stroke();
    ctx.closePath();
  }
}

class DrawThing {
  constructor(points) {
    this.points = points;
  }

  draw() {
    this.points.forEach(pt => function() {
      pt.x += pt.vx
      pt.y += pt.vy
      pt.brightness += pt.flashRate;
      if (pt.brightness >= 1.0 || pt.brightness < 0) pt.flashRate = -pt.flashRate;
      if (pt.x < 0 || pt.x > c.width) pt.vx = -pt.vx;
      if (pt.y < 0 || pt.y > c.width) pt.vy = -pt.vy;

      var roundedX, roundedY;
      if (pt.vx > 0) roundedX = Math.floor(pt.x);
      else roundedX = Math.ceil(pt.x);
      if (pt.vx > 0) roundedY = Math.floor(pt.y);
      else roundedY = Math.ceil(pt.y);

      ctx.fillStyle = `rgb(
        ${Math.floor(255 * pt.brightness)},
        ${Math.floor(255 * pt.brightness)},
        ${Math.floor(255 * pt.brightness)})`;
        
      ctx.beginPath();
      ctx.arc(roundedX+0.5, roundedY+0.5, 1, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
    }());
  }
}

function boundedRand(min, max) {
  var rv = Math.random();
  return (max - min) * rv + min;
}

points = [];
for (i = 0; i < 40; ++i) {
  points.push(new Point(boundedRand(0, c.width), boundedRand(0, c.height), Math.random()*0.1, Math.random()*0.1, Math.random()*0.002));
}

signalPoints = [];
frequency = 100; // hz
pulseWidth = 0.1; // 10ms
dutyCycle = 0.5; // 50%

fullPulseWidth = pulseWidth / dutyCycle;
let numPoints = 4096;
const FFT = new FFTJS(numPoints);
let fftInput = new Array(numPoints);
let fftOutput = new Array(numPoints);

signal = new Dataset(signalPoints, '#32363A');
sig = new DrawSignal(0, 400, c.width, c.height / 16, signal);
drawArray = new DrawFFT(0, 600, c.width, c.height / (16 * 4096), '#32363A', fftOutput);
dt = new DrawThing(points);
let mouseX = 0;
let mouseY = 0;

let handleMousemove = (event) => {
  mouseX = event.x;
  mouseY = event.y;
};

document.addEventListener('mousemove', handleMousemove);

function draw() {
  pulseWidth = mouseX / c.width;
  fullPulseWidth = pulseWidth / dutyCycle;

  signalPoints.length = 0;
  for (i = 0; i < numPoints; ++i) { // 1 sec, 0.1ms per point
    let dt = i / numPoints;
    let I = dt / fullPulseWidth;
    const yVal = Math.sin(2 * Math.PI * (i / numPoints) * mouseY);
    let dp = new DataPoint(i / numPoints, yVal);
    dp.y = dp.y * Math.floor((I+1) % 2);
    signalPoints.push(dp);
    fftInput[i] = yVal;
  }
  FFT.realTransform(fftOutput, fftInput);
  //FFT.completeSpectrum(fftOutput);
  //console.log("Before shift");
  //console.log(fftOutput);
  //fftOutput = fftshift(fftOutput);
  //console.log(fftOutput);
  ctx.clearRect(0, 0, c.width, c.height);
  //dt.draw();
  drawArray.draw();
  sig.draw();
  raf = window.requestAnimationFrame(draw);
}

draw();
