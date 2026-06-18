import { exec } from 'child_process';

console.log("Installing python edge-tts...");
exec('python3 -m pip install --user edge-tts', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  console.log(`Stdout: ${stdout}`);
  console.log(`Stderr: ${stderr}`);
});
