import { WebSocket } from 'ws';
import crypto from 'crypto';

async function testTTS() {
  const requestId = crypto.randomBytes(16).toString('hex');
  // New WSS URL from modern edge-tts python constants:
  const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4`;
  
  const WINDOWS_TICK_OFFSET = 11644473600000n;
  const unixMs = BigInt(Date.now());
  const ticks = (unixMs + WINDOWS_TICK_OFFSET) * 10000n;
  const roundedTicks = ticks - (ticks % 3000000000n);
  const inputStr = roundedTicks.toString() + "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
  const secMsGec = crypto.createHash('sha256').update(inputStr).digest('hex').toUpperCase();

  console.log("Rounded Ticks:", roundedTicks.toString());
  console.log("Input String:", inputStr);
  console.log("Sec-MS-GEC:", secMsGec);

  const ws = new WebSocket(wsUrl, {
    headers: {
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
      'Origin': 'chrome-extension://jdiccldimpdaidbmpdkjnbmckianbfold',
      'Sec-MS-GEC': secMsGec,
      'Sec-MS-GEC-Version': '1-143.0.3650.75',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });

  ws.on('open', () => {
    console.log("WS Opened successfully (101 Switching Protocols)!");
    ws.close();
  });

  ws.on('unexpected-response', (req, res) => {
    console.log("Unexpected response status:", res.statusCode);
    console.log("Headers received:", res.headers);
    ws.close();
  });

  ws.on('error', (err) => {
    console.error("WS error details:", err);
  });
}

testTTS();
