# BookSpeak AI 🎙️📚

BookSpeak AI is a premium, full-featured commercial-grade PDF-to-Audiobook generator built entirely with free, open-source, and zero-cost technologies. It leverages advanced Microsoft Edge TTS Neural voice talents and Google Gemini 3.5-Flash to clean, structure, describe, and narrate books up to 1GB.

<img width="1866" height="971" alt="image" src="https://github.com/user-attachments/assets/f88231a3-c94c-4a85-8caa-f37e1055081d" />
<img width="1526" height="937" alt="image" src="https://github.com/user-attachments/assets/307af6c4-b3a6-4b7b-a5d7-5f726f896648" />
<img width="1877" height="972" alt="image" src="https://github.com/user-attachments/assets/5992db99-958a-4639-85d7-cea72956ca82" />

NOTE-:📖 Important Note for Users
Conversion Time  
When you upload a book (PDF or text), the system may take some time to convert it into audio. This delay happens because the free tier model is being used, which has limited processing speed compared to premium services. Please be patient — the conversion is happening in the background.

Playback & Download Delay  
After conversion, the app may also take a little while to start playing or downloading the audio file. This is normal. Don’t assume the app has stopped working — just give it a moment to finish preparing the audio.

Voice Quality Options  
By default, the free tier uses standard voices. For higher quality, more natural narration, you can switch to the premium voices available in the app. These premium voices are provided free for testing, and they deliver a smoother, more human‑like audiobook experience.

User Tip  
If you want the most natural “narrator” style voice (like professional audiobook readers), select one of the premium voices in the settings panel. This will greatly improve clarity, pacing, and overall listening quality.


---

## 🚀 Key Architectural Decisions

1. **Client-Side PDF Text Extraction**: PDF files are processed locally in your browser using **PDF.js** via CDNs. This avoids heavy server-side memory bloat and bypasses file upload bottlenecks, enabling painless support for huge books (up to 1GB).
2. **Dual-Model Smart Processing**: 
   - **Gemini 3.5-Flash** maps text layouts, discovers title/author names, structures logical sub-chapters, auto-flags scan OCR corrections, schedules reading durations, and performs narrative speaker detection.
   - If a Gemini key is missing, a resilient **Procedural Blueprint Generator** kicks in so the application remains robustly active for users.
3. **Microsoft Edge Free TTS Protocol**: Connects directly via backend WebSockets to Microsoft's Edge Read-Aloud synthesis platform, producing highly natural, noise-free, studio-grade speech without requiring paid third-party voice APIs (like Speechify or ElevenLabs).
4. **Local Device Syncing**: Synchronizes playback states, notes, bookmarks, and configurations across browser refreshes via responsive LocalStorage/IndexedDB state replication.

---

## 🛠️ File Structure

The workspace follows a strict, highly modular fullstack design:

- `server.ts` - Entry point running Express with standard Vite development/production middlewares, Gemini API wrappers, and the native Edge TTS WebSocket client.
- `src/types.ts` - Unified TypeScript type definitions (Book, Chapter, Bookmark, Note, Voice, VoiceSettings).
- `src/App.tsx` - Root viewport manager handling tab coordinates, state replication, and global dark/light theme classes.
- `src/components/`
  - `Sidebar.tsx` - Clean Spotify-inspired sidebar for user contexts and pages navigation.
  - `Dashboard.tsx` - Library layout containing storage counters, statistics summary metrics, and recently active tracks.
  - `PDFUpload.tsx` - Drag-and-drop file import portal with interactive status progress bars and mockup runners.
  - `BookDetail.tsx` - Book summary presenter highlighting insights takeaways, chapter indexes, and speaker lists.
  - `AudiobookPlayer.tsx` - Core player layout equipped with HTML5 media connectors, +/-15s skips, bookmark triggers, dynamic sleep countdowns, and an animated `<canvas>` sound wave visualizer.

---

## 🌐 Deploying to Vercel

BookSpeak AI compiles into a fully self-contained full-stack product. To deploy this to Vercel as serverless functions, follow these setup adjustments:

### 1. Configure dynamic `vercel.json` rewrite paths:
Create a `vercel.json` file in your root folder:
```json
{
  "version": 2,
  "builds": [
    { "src": "server.ts", "use": "@vercel/node" },
    { "src": "package.json", "use": "@vercel/static-build" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server.ts" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

### 2. Add Environment Secrets under your Vercel Dashboard:
- `GEMINI_API_KEY` = `[Your Google AI Studio API Key]`

---

## 🎨 Layout Customizations

You can easily alter corporate branding, visual structures, or color palettes inside the modular code layers:

- **Tailwind Colors**: The primary brand highlight uses a premium Amber-to-Orange gradient (`from-amber-500 to-orange-600`). Search and replace class markers inside `src/components/` with your preferred style ranges:
  - Cyan-to-Blue: `from-cyan-500 to-blue-600`, text `text-cyan-500`
  - Emerald-to-Teal: `from-emerald-500 to-teal-600`, text `text-emerald-500`
- **Speech Rates**: Available speeds can be managed inside the selector in `src/components/AudiobookPlayer.tsx`. Adjust playbackrate defaults as desired:
  - Standard narration recommendation: `1.0x` and `1.2x` speeds.
