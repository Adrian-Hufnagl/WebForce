const { exec } = require('child_process');

let testButton = document.getElementById("testFunctionButton");
testButton.addEventListener("click", testFunction);

function testFunction(event){
    exec('open -a facetime', (err, stdout, stderr) => {
        if (err) {
          // Print error
          console.error(err);
        } else {
          // Print results
          console.log(stdout);
        }
      });
    console.log('Test')
}