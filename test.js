const { exec } = require('child_process');
const { execSync } = require('child_process');
const sound = require("sound-play");
const soundPathLeft = "/System/Library/Sounds/Morse.aiff";
const soundPathRight = "/System/Library/Sounds/Pop.aiff";
const soundPathCancel = "/System/Library/Sounds/Purr.aiff";
const soundPathSuccess = "/System/Library/Sounds/Frog.aiff";

let yourCommand = 'shortcuts run Test';
let yourCommand2 = 'shortcuts run "Zoom öffnen"';
let shortcutArray;

let shortCuts = document.getElementById("shortcutList");
let shortCutConfigs = []

let shortCutExample = document.getElementsByClassName("shortcut-card")[0]
shortCutExample.addEventListener('click', function (event) {
  configGesture(event.currentTarget); // Logs the element that was clicked
});

let testButton = document.getElementById("testFunctionButton");
testButton.addEventListener("click", testFunction);

let testButton2 = document.getElementById("testFunctionButton2");
testButton2.addEventListener("click", configShortcuts);

function testFunction(event) {
  execSync(yourCommand2);
}

var gestureMap = [
  "&#9994;",
  "&#128400;",
  "&#9757;",
  "&#128077;",
  "&#128078;",
  "&#9996;",
  "&#129311;",
]


function configShortcuts(event) {
  exec('shortcuts list --show-identifiers', (err, stdout, stderr) => {
    if (err) {
      console.error(err);
    } else {
      let str = stdout;
      let lines = str.replace(/\r\n/g, '\n').split('\n');
      let data = lines.map(line => {
        let match = line.match(/(.*)\s\((.+)\)/);
        if (match) {
          return [match[1].trim(), match[2]];
        } else {
          return null;
        }
      }).filter(item => item !== null);
      console.log("Shortcut list Output => [Name, ID]");
      console.log(data);
      //for (let i = 0; i < data.length; i++) {
      //  shortCuts.innerText = shortCuts.innerText + "\n" + data[i][0]
      //}
      // Initialize 7x7 array with null values
      shortcutArray = Array.from({ length: 7 }, () => Array(7).fill(null));

      // Fill the array with data
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          let index = i * 7 + j;
          if (index < data.length) {
            shortcutArray[i][j] = data[index];
          }
        }
      }
      console.log("[7]x[7] Array mit null o. 2 Strings");
      console.log(shortcutArray);
    }
    buildShortcutList();

  });
}

function buildShortcutList() {
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      if (shortcutArray[i][j] != null) {
        console.log("generateListElement mit:");
        console.log(i);
        console.log(j);
        generateListElement(i, j)
      }
    }
  }
}

function generateListElement(x, y) {
  //console.log("leftGesture")
  //console.log(gestureMap[x])
  //console.log("rightGesture")
  //console.log(gestureMap[y])
  //console.log(shortcutArray[x][y]);
  //console.log(shortcutArray[x][y][0]);
  //console.log(shortcutArray[x][y][1]);
  //console.log(shortCutExample)
  let newShortcut = shortCutExample.cloneNode(true)
  newShortcut.addEventListener('click', function (event) {
    configGesture(event.currentTarget); // Logs the element that was clicked
  });
  //console.log(newShortcut)
  //console.log(newShortcut.childNodes)
  //console.log(newShortcut.childNodes[3].childNodes)
  newShortcut.childNodes[1].innerHTML = shortcutArray[x][y][0];
  newShortcut.childNodes[3].childNodes[1].innerHTML = gestureMap[x];
  newShortcut.childNodes[3].childNodes[3].innerHTML = gestureMap[y];
  shortCuts.appendChild(newShortcut);
}

function configGesture(e) {
  console.log("Config Button:")
  console.log(e)
  console.log(e.childNodes[1].innerHTML)
  findCMD(e.childNodes[1].innerHTML)

}

function findCMD(name) {
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      if (shortcutArray[i][j] != null) {
        if (shortcutArray[i][j][0] == name) {
          console.log("shortcutArray");
          console.log(i);
          console.log(j);
          execute(shortcutArray[i][j][1])
        }
      }
    }
  }
}

function execute(cmdID) {
  console.log("shortcuts run " + cmdID);
  playSound(soundPathSuccess);
  execSync("shortcuts run " + cmdID);
}

function playSound(path){
  sound.play(path);
}