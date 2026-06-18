import https from 'https';

console.log("Fetching Edge TTS voice list...");
const url = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4';

https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0'
  }
}, (res) => {
  console.log("Response status code:", res.statusCode);
  console.log("Headers:", res.headers);
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Response data prefix (first 200 chars):", data.slice(0, 200));
  });
}).on('error', (err) => {
  console.error("Error fetching voice list:", err);
});
