const vision = require("@mediapipe/tasks-vision");
const { GestureRecognizer, FilesetResolver } = vision;
const buttonSection = document.getElementById("btn-section");
let gestureRecognizer;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
const videoHeight = "270px";
const videoWidth = "360px";

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
    leftHandOutput.style.width = videoWidth;
    rightHandOutput.style.display = "block";
    rightHandOutput.style.width = videoWidth;
    leftHandOutput.innerText = "Nicht gefunden";
    rightHandOutput.innerText = "Nicht gefunden";
    // Check Handedness and delegate output
    if (results.gestures.length == 1) {
        if(results.handednesses[0][0].categoryName == "Left"){
            rightHandOutput.innerText =
            "GestureRecognizer: " +
            results.gestures[0][0].categoryName +
            "\n Confidence: " +
            Math.round(parseFloat(results.gestures[0][0].score) * 100) +
            "%";
        }
        if(results.handednesses[0][0].categoryName == "Right"){
            leftHandOutput.innerText =
            "GestureRecognizer: " +
            results.gestures[0][0].categoryName +
            "\n Confidence: " +
            Math.round(parseFloat(results.gestures[0][0].score) * 100) +
            "%";
        }
        console.log(results)
    }
    if (results.gestures.length == 2) {
        rightHandOutput.innerText =
            "GestureRecognizer: " +
            results.gestures[0][0].categoryName +
            "\n Confidence: " +
            Math.round(parseFloat(results.gestures[0][0].score) * 100) +
            "%";
        leftHandOutput.innerText =
            "GestureRecognizer: " +
            results.gestures[1][0].categoryName +
            "\n Confidence: " +
            Math.round(parseFloat(results.gestures[1][0].score) * 100) +
            "%";
    }

    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}

function checkGesture(hand){
}