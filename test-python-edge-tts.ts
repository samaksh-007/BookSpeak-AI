import { exec } from 'child_process';

exec('python3 -c "import edge_tts; print(\\\"Installed\\\")"', (error, stdout, stderr) => {
  if (error) {
    console.log(`Not installed: ${error.message}`);
    return;
  }
  console.log(`Stdout: ${stdout}`);
});
