import { exec } from 'child_process';

console.log("Bootstrapping pip via ensurepip...");
exec('python3 -m ensurepip --user', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error ensurepip: ${error.message}`);
    // If ensurepip fails, try installing edge-tts in python without pip (e.g. from git or download)
    return;
  }
  console.log(`Stdout: ${stdout}`);
  console.log(`Stderr: ${stderr}`);
  
  // If successful, install edge-tts
  console.log("Installing edge-tts...");
  exec('python3 -m pip install --user edge-tts', (err2, stdout2, stderr2) => {
    if (err2) {
      console.error(`Error pip install: ${err2.message}`);
      return;
    }
    console.log(`Pip install stdout: ${stdout2}`);
  });
});
