import { WebSocket } from 'ws';
import crypto from 'crypto';

// 1. Core GEC Math
const WINDOWS_TICK_OFFSET = 11644473600000n;
const unixMs = BigInt(Date.now());
const ticks = (unixMs + WINDOWS_TICK_OFFSET) * 10000n;
const roundedTicks = ticks - (ticks % 3000000000n);
const inputStr = roundedTicks.toString() + "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const secMsGecUpper = crypto.createHash('sha256').update(inputStr).digest('hex').toUpperCase();
const secMsGecLower = secMsGecUpper.toLowerCase();

// We will try different versions
const chromeVersions = [
  { full: "131.0.2903.99", major: "131" },
  { full: "130.0.2849.68", major: "130" },
  { full: "123.0.2420.97", major: "123" },
  { full: "143.0.3650.75", major: "143" }
];

const origins = [
  "chrome-extension://jdiccldimpdaidbmpdkjnbmckianbfold", // Modern
  "chrome-extension://jdiccldimpdaidmbeccgafjkbeijdiem"  // Old
];

const cases = [
  { name: "Upper Hash", hash: secMsGecUpper },
  { name: "Lower Hash", hash: secMsGecLower }
];

async function testCombination(chromeVer: { full: string, major: string }, origin: string, hashCase: { name: string, hash: string }, useAcceptEncoding: boolean) {
  const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4`;
  
  const headers: Record<string, string> = {
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache',
    'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVer.major}.0.0.0 Safari/537.36 Edg/${chromeVer.major}.0.0.0`,
    'Origin': origin,
    'Sec-MS-GEC': hashCase.hash,
    'Sec-MS-GEC-Version': `1-${chromeVer.full}`,
    'Accept-Language': 'en-US,en;q=0.9',
  };

  if (useAcceptEncoding) {
    headers['Accept-Encoding'] = 'gzip, deflate, br, zstd';
  }

  return new Promise<string>((resolve) => {
    const ws = new WebSocket(wsUrl, { headers, timeout: 5000 });

    ws.on('open', () => {
      resolve(`SUCCESS (101): Ver=${chromeVer.full}, Origin=${origin.slice(-10)}, Hash=${hashCase.name}, AcceptEncoding=${useAcceptEncoding}`);
      ws.close();
    });

    ws.on('unexpected-response', (req, res) => {
      resolve(`FAIL (${res.statusCode}): Ver=${chromeVer.full}, Origin=${origin.slice(-10)}, Hash=${hashCase.name}, AcceptEncoding=${useAcceptEncoding}`);
      ws.close();
    });

    ws.on('error', (err) => {
      resolve(`ERR (${err.message}): Ver=${chromeVer.full}, Origin=${origin.slice(-10)}, Hash=${hashCase.name}, AcceptEncoding=${useAcceptEncoding}`);
    });
  });
}

async function runAllTests() {
  console.log("Running GEC header diagnostics...");
  const promises: Promise<string>[] = [];
  
  for (const chromeVer of chromeVersions) {
    for (const origin of origins) {
      for (const hashCase of cases) {
        for (const useAcceptEncoding of [true, false]) {
          promises.push(testCombination(chromeVer, origin, hashCase, useAcceptEncoding));
        }
      }
    }
  }

  const results = await Promise.all(promises);
  results.forEach(r => console.log(r));
}

runAllTests();
