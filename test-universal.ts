import { EdgeTTS } from 'edge-tts-universal';
import * as fs from 'fs';

async function test() {
  console.log("Synthesizing using edge-tts-universal...");
  try {
    const tts = new EdgeTTS(
      "Hello from edge tts universal. Testing speed, pitch and audio generation.",
      "en-US-EmmaMultilingualNeural",
      { rate: "+20%", pitch: "+10Hz", volume: "+0%" }
    );
    const result = await tts.synthesize();
    console.log("Success! Received audio data.");
    
    // Convert Blob to Buffer
    const arrayBuffer = await result.audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("Buffer length:", buffer.length, "bytes");
    
    fs.writeFileSync('test-out.mp3', buffer);
    console.log("Saved test-out.mp3 successfully!");
  } catch (err: any) {
    console.error("Failed to synthesize:", err.message);
  }
}

test();
