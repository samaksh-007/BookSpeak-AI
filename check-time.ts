import { exec } from 'child_process';

const nodeSec = Date.now() / 1000;
exec('python3 -c "import time; print(time.time())"', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  console.log("Node time (seconds):", nodeSec);
  console.log("Python time (seconds):", parseFloat(stdout.trim()));
  console.log("Difference (seconds):", nodeSec - parseFloat(stdout.trim()));
});
