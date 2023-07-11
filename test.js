const { exec } = require('child_process');
const { spawn } = require('child_process');



let testButton = document.getElementById("testFunctionButton");
testButton.addEventListener("click", testFunction);

let testButton2 = document.getElementById("testFunctionButton2");
testButton2.addEventListener("click", testFunction2);

function testFunction(event){
    console.log('CMD Test')
    console.log('Öffne FaceTime')
    exec('open -a facetime', (err, stdout, stderr) => {
        if (err) {
          // Print error
          console.error(err);
        } else {
          // Print results
          console.log(stdout);
        }
      });
}

var gestures = [{
  0: "&#129778;&#10067;&#129777;",
  1: "&#9994;",
  2: "&#128400;",
  3: "&#9757;",
  4: "&#128077;",
  5: "&#128078;",
  6: "&#9996;",
  7: "&#129311;",
}]


function testFunction2(event){
    //console.log('Kurzbefehle Test')
    //console.log('Öffne Zoom mit GPT versuch 1')
    //const child = spawn('shortcuts', ['run', 'AirDrop']);
    //child.stdout.on('data', (data) => {
    //  console.log(`stdout: ${data}`);
    //});
//
    //child.stderr.on('data', (data) => {
    //  console.error(`stderr: ${data}`);
    //});
//
    //child.on('close', (code) => {
    //  console.log(`child process exited with code ${code}`);
    //});
    var el = event.currentTarget;
    el.innerHTML = gestures[0]["moin"];
    console.log(gestures[0])
    console.log(gestures[0][1])
}