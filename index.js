var express = require('express');
var app = express();
const https = require('https');

var gpio = require('rpi-gpio');
gpio.setMode(gpio.MODE_BCM);
app.listen(80, function() {
  console.log("Server started.");
});

var pins = {
  1: 23, 
  2: 16, 
  3: 26, 
  4: 21, 
  5: 13, 
  6: 19, 
  reset: 18
};

function closePins(cb) {
  console.log("Closing pins.");
  for (var pin in pins) {
    var curPin = pins[pin]; 
    gpio.write(curPin, (curPin == 18 ? true : false), (err) => {
      if (err) {
        console.log("Error in setting gpio pin.",err);
        return;
      }
      console.log("Pin closed.");
      cb();
    });
  }
}

process.on('uncaughtException', function(err) {
  console.log(err);
  closePins(() => {
    process.exit();
  });
});

process.on('SIGINT', function() {
  console.log("Caught interrupt signal");
  closePins(() => {
    process.exit();
  });
});

function numberSet(which) {
  var lampPin = pins[which];
  if (lampPin) {
    gpio.setup(lampPin, gpio.DIR_OUT, (err) => {
      console.log("Setting pin " + lampPin + " off.");
      gpio.write(lampPin, (lampPin == 18 ? false : true), (err) => {
        if (err) {
          console.log("Error in setting gpio pin.",err);
          return;
        }

        setTimeout(() => {
          console.log("Setting pin " + lampPin + " on.");
          gpio.write(lampPin, (lampPin == 18 ? true: false), (err) => {
            if (err) {
              console.log("Error in setting gpio pin.",err);
              return;
            }
          });
        }, 1000);
      });
    });
  } else {
    console.log("Invalid pin: ", which);
  }
}

app.get('/select', function(req, res) {
  res.setHeader('Content-Type', 'text/javascript');
  var which = req.query.which;
  if (pins[which]) {
    res.write(JSON.stringify({done:true}));
    numberSet(which); 
  } else {
    res.write(JSON.stringify({done:false}));
  }
  res.end();
});

app.get('/walk', function(req, res) {
  res.setHeader('Content-Type', 'text/javascript');
  res.write(JSON.stringify({done:false}));
  walkNumbers();
  res.end();
});

app.get('/rand', function(req, res) {
  res.setHeader('Content-Type', 'text/javascript');
  res.write(JSON.stringify({done:false}));
  randomWalk();
  res.end();
});

function randomWalk() {
  for (var i = 0; i <= 6; i++ ) {
    setTimeout((function(i){ 
      return () => {
        var index = Math.floor(Math.random() * 10) % 7;
        numberSet(index);
      }; 
    })(i), i * 1000);
  }

  setTimeout(() => { numberSet("reset"); }, 7000);
}


function walkNumbers() {
  for (var i = 0; i <= 6; i++ ) {
    setTimeout((function(i){ return () => {numberSet(i);}; })(i), i * 1000);
  }

  setTimeout(() => { numberSet("reset"); }, 7000);
}

walkNumbers();


setInterval(() => {
  https.get("https://theamackers.com/storeip", () => {});
}, 1000 * 60 * 60 * 10);
https.get("https://theamackers.com/storeip", () => {});

const { execSync } = require('child_process');
let numUsers = 0;
setTimeout(() => {
  setInterval(() => {
    let stdout = execSync('users');
    console.log("Command results:", stdout + "");
    newNumUsers = (stdout+"").split(/ /).length;
    if (newNumUsers != numUsers) {
      let resetTimeout = 0;
      if (newNumUsers < numUsers) {
        numberSet("reset");
        resetTimeout = 2000;
      }

      numUsers = newNumUsers;

      setTimeout(() => {
        for (let i = 1; i < numUsers; i++) {
          numberSet(i);
        }
      }, resetTimeout);
    }
  }, 1000);
}, 10000);
