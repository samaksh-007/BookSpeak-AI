import { exec } from 'child_process';

console.log("Running python3 test-handshake.py...");
exec('python3 test-handshake.py', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`Stdout:\n${stdout}`);
});
