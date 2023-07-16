const vision = require("@mediapipe/tasks-vision");
const { GestureRecognizer, FilesetResolver } = vision;
const buttonSection = document.getElementById("btn-section");
let gestureRecognizer;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
const videoHeight = "270px";
const videoWidth = "360px";

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


let gestDuration = 10

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
    if (!gestureRecognizer) {
        alert("Please wait for gestureRecognizer to load");
        return;
    }
    if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerText = "ENABLE PREDICTIONS";
    }
    else {
        webcamRunning = true;
        enableWebcamButton.innerText = "DISABLE PREDICITONS";
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
        for (const landmarks of results.landmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                color: "#aabbcc",
                lineWidth: 5
            });
            drawLandmarks(canvasCtx, landmarks, { color: "#667788", lineWidth: 10 });
        }
    }
    canvasCtx.restore();
    leftHandOutput.style.display = "block";
    leftHandOutput.style.width = "100px";
    rightHandOutput.style.display = "block";
    rightHandOutput.style.width = "100px";
    leftHandOutput.innerText = "-";
    rightHandOutput.innerText = "-";
    let leftResultSymbol;
    let leftConfidence;
    let rightResultSymbol;
    let rightConfidence;

    // Check Handedness and delegate output
    // CategoryName is inverted because the original video stream is inverted
    // One Hand -> Ask which one it is
    if (results.gestures.length == 1) {
        let resultSymbol = gestureList[results.gestures[0][0].categoryName];
        if (results.handednesses[0][0].categoryName == "Right") {
            leftHandOutput.innerHTML = resultSymbol + " " +
                Math.round(parseFloat(results.gestures[0][0].score) * 100) +
                "%";
            checkGesture(resultSymbol, true);
        }
        if (results.handednesses[0][0].categoryName == "Left") {
            rightHandOutput.innerHTML =
                resultSymbol + " " +
                Math.round(parseFloat(results.gestures[0][0].score) * 100) +
                "%";
            checkGesture(resultSymbol, false);
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
    }

    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}

function checkGesture(gesture, left) {
    // No Gesture
    if (gesture != undefined && gesture != gestureList["None"]) {
        // If Left Gesture
        if (left) {
            console.log("left is true")
            if (gesture != leftGesture) {
                leftCounter = 1;
                leftGesture = gesture;
            } else {
                leftCounter++;
                if (leftCounter == gestDuration) {
                    leftHistory.push(gesture);
                    leftHistoryEl.innerHTML = leftHistoryEl.innerHTML + leftGesture;
                }
            }
            // If Right Gesture
        } else {
            if (gesture != rightGesture) {
                rightCounter = 1;
                rightGesture = gesture;
            } else {
                rightCounter++;
                if (rightCounter == gestDuration) {
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
    leftCounterEl.innerHTML = leftCounter;
    rightCounterEl.innerHTML = rightCounter;
}