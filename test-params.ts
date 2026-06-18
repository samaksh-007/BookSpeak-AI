import { exec } from 'child_process';
import { WebSocket } from 'ws';

function getPythonHash(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec('python3 -c "import time, hashlib; ticks = (int(time.time()) + 11644473600) * 10000000; ticks -= ticks % 3000000000; ipt = str(ticks) + \\"6A5AA1D4EAFF4E9FB37E23D68491D6F4\\"; print(hashlib.sha256(ipt.encode()).hexdigest().upper())"', (err, stdout) => {
      if (err) return reject(err);
      resolve(stdout.trim());
    });
  });
}

async function runTest() {
  const hash = await getPythonHash();
  console.log("Hash:", hash);

  const paths = ["/signature/v1", "/edge/v1"];
  const queries = ["trustedclienttoken", "TrustedClientToken", "Trustedclienttoken"];

  for (const path of paths) {
    for (const query of queries) {
      const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud${path}?${query}=6A5AA1D4EAFF4E9FB37E23D68491D6F4`;
      
      const headers = {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
        'Origin': 'chrome-extension://jdiccldimpdaidbmpdkjnbmckianbfold',
        'Sec-MS-GEC': hash,
        'Sec-MS-GEC-Version': '1-130.0.2849.68',
        'Accept-Language': 'en-US,en;q=0.9',
      };

      const result = await new Promise<string>((resolve) => {
        const ws = new WebSocket(wsUrl, { headers, timeout: 3000 });
        ws.on('open', () => {
          resolve("SUCCESS!");
          ws.close();
        });
        ws.on('unexpected-response', (req, res) => {
          resolve(`STATUS ${res.statusCode}`);
          ws.close();
        });
        ws.on('error', (err) => {
          resolve(`ERROR: ${err.message}`);
        });
      });

      console.log(`Path: ${path} | Query: ${query} => ${result}`);
    }
  }
}

runTest();
