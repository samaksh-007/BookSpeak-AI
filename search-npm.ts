import { exec } from 'child_process';

console.log("Searching npm for edge-tts packages...");
exec('npm search edge-tts --json', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  console.log(`Results:\n${stdout}`);
});
