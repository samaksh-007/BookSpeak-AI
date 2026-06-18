import http.client
import hashlib
import time
import base64
import os

def test():
    ticks = (int(time.time()) + 11644473600) * 10000000
    ticks -= ticks % 3000000000
    ipt = str(ticks) + "6A5AA1D4EAFF4E9FB37E23D68491D6F4"
    gec = hashlib.sha256(ipt.encode()).hexdigest().upper()
    
    # Generate random WebSocket key
    ws_key = base64.b64encode(os.urandom(16)).decode('utf-8')
    
    print("Ticks:", ticks)
    print("GEC:", gec)
    print("WebSocket Key:", ws_key)
    
    conn = http.client.HTTPSConnection("speech.platform.bing.com")
    
    path = f"/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4"
    
    headers = {
        "Host": "speech.platform.bing.com",
        "Upgrade": "websocket",
        "Connection": "Upgrade",
        "Sec-WebSocket-Key": ws_key,
        "Sec-WebSocket-Version": "13",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
        "Origin": "chrome-extension://jdiccldimpdaidbmpdkjnbmckianbfold",
        "Sec-MS-GEC": gec,
        "Sec-MS-GEC-Version": "1-130.0.2849.68",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br, zstd"
    }
    
    conn.request("GET", path, headers=headers)
    response = conn.getresponse()
    print("Response Status:", response.status)
    print("Response Reason:", response.reason)
    print("Response Headers:")
    for key, value in response.getheaders():
        print(f"  {key}: {value}")

if __name__ == "__main__":
    test()
