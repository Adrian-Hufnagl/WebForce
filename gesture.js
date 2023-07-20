

///////////////////////////////////////////////////
////////////////////DEFINITIONS////////////////////
///////////////////////////////////////////////////


const vision = require("@mediapipe/tasks-vision");
const { GestureRecognizer, FilesetResolver } = vision;
const { exec } = require('child_process');
const { execSync } = require('child_process');
const sound = require("sound-play");

const buttonSection = document.getElementById("btn-section");

let initialized = false;
let gestureRecognizer;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
const videoHeight = "270px";
const videoWidth = "360px";

let currentGestureName = "";

let leftGesture;
let leftHistory = [];
let leftHistoryEl = document.getElementById("leftHistory")
let leftCounter = 0;
let leftCounterEl = document.getElementById("leftCounter")

let rightGesture;
let rightHistory = [];
let rightHistoryEl = document.getElementById("rightHistory")
let rightCounter = 0;
let rightCounterEl = document.getElementById("rightCounter")

var tutorialPopup = document.getElementById('tutorial-popup');
var editPopup = document.getElementById('edit-popup');
var editPopupHeader = document.getElementById('edit-popup-header');
var editingActive = false;
var popupButton = document.getElementById('popupButton');
var confirmButton = document.getElementById('confirm-gest-btn');




let activeCounter = 0;

let gestureDuration = 5;
let activeDuration = 30;

let delayCounter = 0;
let delayDuration = 60;


var gestureList = {
    None: "&#10067;",
    Closed_Fist: "&#9994;",
    Open_Palm: "&#128400;",
    Pointing_Up: "&#9757;",
    Thumb_Down: "&#128078;",
    Thumb_Up: "&#128077;",
    Victory: "&#9996;",
    ILoveYou: "&#129311;",
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


const soundPathLeft = "/System/Library/Sounds/Morse.aiff";
const soundPathRight = "/System/Library/Sounds/Pop.aiff";
const soundPathCancel = "/System/Library/Sounds/Purr.aiff";
const soundPathSuccess = "/System/Library/Sounds/Frog.aiff";

let shortcutArray;

let shortCuts = document.getElementById("shortcutList");
let shortCutConfigs = []

let shortCutExample = document.getElementsByClassName("shortcut-card")[0]
shortCutExample.addEventListener('click', function (event) {
  configGesture(event.currentTarget); // Logs the element that was clicked
});

///////////////////////////////////////////////////
///////////////////////SETUP///////////////////////
///////////////////////////////////////////////////


// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
async function loadVision() {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task"
        },
        numHands: 2,
        runningMode: runningMode,
    });
    buttonSection.classList.remove("invisible");
}
loadVision();

// Continuously grab image from webcam stream and detect it.
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const leftHandOutput = document.getElementById("gesture-output-left");
const rightHandOutput = document.getElementById("gesture-output-right");
const canvasRight = document.getElementById("rightHand");
const canvasLeft = document.getElementById("leftHand");
const leftConfidenceBar = document.getElementById("gesture-confidence-left");
const rightConfidenceBar = document.getElementById("gesture-confidence-right");

const leftConfirmed = document.getElementById("gesture-confirmed-left");
const rightConfirmed = document.getElementById("gesture-confirmed-right");
const outputContent = document.getElementById("output-content");
const webcamContent = document.getElementById("webcam-content");
const liveView = document.getElementById("liveView");
const outputContainer1 = document.getElementById("output-container-1");
const outputContainer2 = document.getElementById("output-container-2");

// Check if webcam access is supported.
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
}
else {
    console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start detection.
function enableCam(event) {
    if(!initialized){
      initialized = true;
      configShortcuts();
      showMessage("Shortcuts geladen");
    }
    if (!gestureRecognizer) {
        alert("Please wait for gestureRecognizer to load");
        return;
    }
    if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerHTML = "&#128582; Befehle aktivieren ";
        enableWebcamButton.style = "background: #007f8b;"
        showMessage("Kurzbefehle sind nur noch durch die Buttons ausführbar!");
    }
    else {
        webcamRunning = true;
        enableWebcamButton.innerHTML = "&#128581; Befehle deaktivieren ";
        enableWebcamButton.style = "background: #8b7f8b;"
        showMessage("Kurzbefehle können mit Gesten ausgeführt werden.");
    }
    // getUsermedia parameters.
    const constraints = {
        video: true
    };
    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
}


///////////////////////////////////////////////////
///////////////////MAIN PROCESS////////////////////
///////////////////////////////////////////////////


async function predictWebcam() {
    const webcamElement = document.getElementById("webcam");
    // Now let's start detecting the stream.
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await gestureRecognizer.setOptions({ runningMode: runningMode, numHands: 2 });
    }
    let nowInMs = Date.now();
    const results = await gestureRecognizer.recognizeForVideo(video, nowInMs);
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasElement.style.height = videoHeight;
    webcamElement.style.height = videoHeight;
    canvasElement.style.width = videoWidth;
    webcamElement.style.width = videoWidth;
    if (results.landmarks) {
        for (let i = 0; i < results.landmarks.length; i++) {
          const handedness = results.landmarks[i].label;
          let lineColor, pointColor;
          if(results.handednesses[0][0].categoryName == "Right"){
            if (i < 1) {
              lineColor = '#007f8b80';  
              pointColor = '#007f8b';  
            } else {
              lineColor = '#7f8b0080';  
              pointColor = '#007f008b';
            } 
          } else{
            if (i < 1) {
              lineColor = '#7f8b0080';  
              pointColor = '#007f008b'; 
            } else {
              lineColor = '#007f8b80';  
              pointColor = '#007f8b';  
            }  
          }
              
            drawConnectors(canvasCtx, results.landmarks[i], HAND_CONNECTIONS, {
                color: lineColor,
                lineWidth: 20
            });
            drawLandmarks(canvasCtx, results.landmarks[i], { color: pointColor, lineWidth: 10 });
        }      
    }
    canvasCtx.restore();
    leftHandOutput.style.display = "block";
    leftHandOutput.style.width = "200px";
    rightHandOutput.style.display = "block";
    rightHandOutput.style.width = "200px";
    leftHandOutput.innerText = "";
    rightHandOutput.innerText = "";
    let leftResultSymbol;
    let leftConfidence;
    let rightResultSymbol;
    let rightConfidence;

    // Count up active left gesture
    if (activeCounter > 0){
        if (activeCounter == activeDuration){
            activeCounter = 0;
            leftConfirmed.innerHTML = "";
            rightConfirmed.innerHTML = "";
            leftConfirmed.style.background = '#007f8b80';
            rightConfirmed.style.background = '#adb6bd';

            playSound(soundPathCancel)
        } else {
            activeCounter++;
        }
    }
    if(delayCounter > 0){
        if (delayCounter <= delayDuration){
            delayCounter = 0;
            leftConfirmed.innerHTML = "";
            rightConfirmed.innerHTML = "";
            leftConfirmed.style.background = '#007f8b80';
            rightConfirmed.style.background = '#adb6bd';
        } else {
            delayCounter++;
        }
    }


    // Check Handedness and delegate output
    // CategoryName is inverted because the original video stream is inverted
    // One Hand -> Ask which one it is
    if (results.gestures.length == 0) {
      leftCounter = 0;
      rightCounter = 0;
      leftConfidenceBar.style.background = "#007f8b80";
      rightConfidenceBar.style.background = "#7f8b0080";    
    }

    if (results.gestures.length == 1) {
        let resultSymbol = gestureList[results.gestures[0][0].categoryName];
        if (results.handednesses[0][0].categoryName == "Right") {
          leftConfidence = Math.round(parseFloat(results.gestures[0][0].score) * 100)
            leftHandOutput.innerHTML = resultSymbol + " " +
                leftConfidence +
                "%";
            checkGesture(resultSymbol, true);
            rightCounter = 0;
            leftConfidenceBar.style.background = "linear-gradient(to right, #007f8b " + leftConfidence + "%, #007f8b80 " + leftConfidence + "%)";
            rightConfidenceBar.style.background = "#7f8b0080";          
        }
        if (results.handednesses[0][0].categoryName == "Left") {
          rightConfidence = Math.round(parseFloat(results.gestures[0][0].score) * 100)
            rightHandOutput.innerHTML =
                resultSymbol + " " +
                rightConfidence +
                "%";
            checkGesture(resultSymbol, false);
            leftCounter = 0;
            leftConfidenceBar.style.background = "#007f8b80";
            rightConfidenceBar.style.background = "linear-gradient(to right, #7f8b00 " + rightConfidence + "%, #7f8b0080 " + rightConfidence + "%)";    
        }
    }

    // Two Hands -> Ask which one is which
    if (results.gestures.length == 2) {
        if (results.handednesses[0][0].categoryName == "Right") {
            leftResultSymbol = gestureList[results.gestures[0][0].categoryName];
            leftConfidence = Math.round(parseFloat(results.gestures[0][0].score) * 100)
            rightResultSymbol = gestureList[results.gestures[1][0].categoryName];
            rightConfidence = Math.round(parseFloat(results.gestures[1][0].score) * 100);
        } 
        if (results.handednesses[0][0].categoryName == "Left") {
            leftResultSymbol = gestureList[results.gestures[1][0].categoryName];
            leftConfidence = Math.round(parseFloat(results.gestures[1][0].score) * 100)
            rightResultSymbol = gestureList[results.gestures[0][0].categoryName];
            rightConfidence = Math.round(parseFloat(results.gestures[0][0].score) * 100);
        }
        rightHandOutput.innerHTML = rightResultSymbol + " " + rightConfidence + " %";
        leftHandOutput.innerHTML = leftResultSymbol + " " + leftConfidence + " %";
        checkGesture(leftResultSymbol, true);
        checkGesture(rightResultSymbol, false);
        leftConfidenceBar.style.background = "linear-gradient(to right, #007f8b " + leftConfidence + "%, #007f8b80 " + leftConfidence + "%)";
        rightConfidenceBar.style.background = "linear-gradient(to right, #7f8b00 " + rightConfidence + "%, #7f8b0080 " + rightConfidence + "%)";    
    }

    leftCounterEl.innerHTML = leftCounter;
    rightCounterEl.innerHTML = rightCounter;


    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}

///////////////////////////////////////////////////
///////////FUNCTIONS HANDLING STUFF////////////////
///////////////////////////////////////////////////


function checkGesture(gesture, left) {
    // No Gesture
    if (gesture != undefined && gesture != gestureList["None"]) {
        // If Left Gesture
        if (left) {
            if (gesture != leftGesture) {
                leftCounter = 1;
                leftGesture = gesture;
            } else {
                leftCounter++;
                if (leftCounter == gestureDuration) {
                    ///FIRING LEFT///
                    playSound(soundPathLeft)
                    activeCounter = 1;
                    leftHistory.push(gesture);
                    leftHistoryEl.innerHTML = leftHistoryEl.innerHTML + leftGesture;
                    leftConfirmed.innerHTML = leftGesture;
                    leftConfirmed.style.background = '#007f8b';
                    rightConfirmed.style.background = '#7f8b0080';
                }
            }
            // If Right Gesture
        } else {
            if (gesture != rightGesture) {
                rightCounter = 1;
                rightGesture = gesture;
            } else {
                rightCounter++;
                if (rightCounter == gestureDuration) {
                    ///FIRING RIGHT///
                    if(activeCounter == 0){
                        playSound(soundPathRight)
                    } else{
                        rightConfirmed.innerHTML = rightGesture;
                        rightConfirmed.style.background = '#7f8b00';
                        playSound(soundPathSuccess)
                        activeCounter = 0;
                        delayCounter = 1;
                        if(!editingActive){
                        gesturesToCommand()
                        } else{
                            configNewGesture();
                        }
                    }
                    rightHistory.push(gesture);
                    rightHistoryEl.innerHTML = rightHistoryEl.innerHTML + rightGesture;
                }
            }
        }
    } else {
        if(left){
            leftCounter = 0;
        } else{
            rightCounter = 0;
        }
    }
}


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
    shortCuts.innerHTML = "";
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (shortcutArray[i][j] != null) {
          generateListElement(i, j)
        }
      }
    }
  }
  
  function generateListElement(x, y) {
  
    let newShortcut = shortCutExample.cloneNode(true)
    newShortcut.addEventListener('click', function (event) {
      configGesture(event.currentTarget);
    });
    newShortcut.childNodes[1].innerHTML = shortcutArray[x][y][0];
    newShortcut.childNodes[3].childNodes[1].innerHTML = gestureMap[x];
    newShortcut.childNodes[3].childNodes[3].innerHTML = gestureMap[y];
    shortCuts.appendChild(newShortcut);
  }

  function findCMD(left) {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (shortcutArray[i][j] != null) {
          if (shortcutArray[i][j][0] == currentGestureName) {
            console.log("shortcutArray");
            console.log(i);
            console.log(j);
            //execute(shortcutArray[i][j][1])
            if(left){
              return i;
            }else{
              return j;
            }
          }
        }
      }
    }
  }

  function findAndExecute() {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (shortcutArray[i][j] != null) {
          if (shortcutArray[i][j][0] == currentGestureName) {
            execute(shortcutArray[i][j][1])
          }
        }
      }
    }
  }

  function execute(cmdID) {
    console.log("shortcuts run " + cmdID);
    execSync("shortcuts run " + cmdID);
  }
  
  function configGesture(e) {
    console.log("Config Button:")
    console.log(e)
    console.log(e.childNodes[1].innerHTML)
    currentGestureName = e.childNodes[1].innerHTML
    if(webcamRunning){
      editingActive = true;
      delayDuration = 180;
      editPopup.style.display = "block";
      outputContainer2.appendChild(liveView)
      outputContainer2.appendChild(outputContent)
      editPopupHeader.innerHTML = currentGestureName + ": Neues Gestenpaar zuordnen";
    } else{
      findAndExecute();
    }
    
    
  }
  

  

  function playSound(path){
    sound.play(path);
  }


  // Get gestures and apply fitting cmd
  function gesturesToCommand(){
    let leftID = gestureMap.indexOf(leftGesture);
    let rightID = gestureMap.indexOf(rightGesture);
    console.log(leftID);
    console.log(rightID);
    if (shortcutArray[leftID][rightID] != null){
      execute(shortcutArray[leftID][rightID][1]);
    } else{
      let leftGesture = gestureMap[leftID];
      let rightGesture = gestureMap[rightID];
      showMessage("Kein Befehl für " + leftGesture + " / " + rightGesture + " hinterlegt!")
    }
  }

  //Get gestures and config shortcut
  //TODO Take Index of Shortcut Array from Gesture
  //Mach erstmal ein Konzept wie Datending funktionieren soll
  function configNewGesture(){
    let oldLeftId  = findCMD(true);
    let oldRightId = findCMD(false);
    let newLeftID = gestureMap.indexOf(leftGesture);
    let newRightID = gestureMap.indexOf(rightGesture);
    console.log("Old IDs: " + oldLeftId + "/" + oldRightId);
    console.log("New IDs: " + newLeftID + "/" + newRightID);

    // 1. Save shortcut
    let gestureData = shortcutArray[oldLeftId][oldRightId];
    // 2. New Shortcut on old position
    shortcutArray[oldLeftId][oldRightId] = shortcutArray[newLeftID][newRightID];
    // 3. Old Shortcut Data on new position
    shortcutArray[newLeftID][newRightID] = gestureData;
    buildShortcutList();
  }


///////////////////////////////////////////////////
///////////////////////POPUPS//////////////////////
///////////////////////////////////////////////////


confirmButton.onclick = function() {
  configNewGesture();
}

popupButton.onclick = function() {
  tutorialPopup.style.display = "block";
}

window.onclick = function(event) {
    if (event.target == tutorialPopup) {
      tutorialPopup.style.display = "none";
    }
    if (event.target == editPopup) {
      editingActive = false;
      delayDuration = 60;
      editPopup.style.display = "none";
      outputContainer1.appendChild(outputContent)
      webcamContent.appendChild(liveView)
    }
}

function showMessage(str){
  var snackBar = document.getElementById("snackbar");
  snackBar.innerHTML = str;  
  snackBar.className = "show";
  setTimeout(function(){ snackBar.className = snackBar.className.replace("show", ""); }, 3000);
}