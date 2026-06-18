/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, 
  Clock, Timer, Bookmark, FileText, ChevronRight, 
  ChevronLeft, Settings, MessageSquarePlus, Maximize2, Loader2, Download
} from 'lucide-react';
import { Book, Chapter, VoiceSettings, Voice, Bookmark as BookmarkType, Note } from '../types';

interface AudiobookPlayerProps {
  book: Book | null;
  voiceSettings: VoiceSettings;
  setVoiceSettings: React.Dispatch<React.SetStateAction<VoiceSettings>>;
  theme: 'dark' | 'light';
  onAddBookmark: (bookmark: BookmarkType) => void;
  bookmarks: BookmarkType[];
  onAddNote: (note: Note) => void;
  notes: Note[];
}

const PREBUILT_VOICES: Voice[] = [
  // Primary highly optimized storytelling standard voices (Extremely fast, high reality)
  { id: 'en-US-GuyNeural', name: 'Guy (Warm Storyteller)', gender: 'male', style: 'Storytelling', locale: 'en-US', label: 'Warm Storyteller - Male (Instant)' },
  { id: 'en-US-SteffanNeural', name: 'Steffan (Deep Narrator)', gender: 'male', style: 'Professional', locale: 'en-US', label: 'Deep Academic - Male (Instant)' },
  { id: 'en-US-JennyNeural', name: 'Jenny (Professional Female)', gender: 'female', style: 'Corporate', locale: 'en-US', label: 'Professional - Female (Instant)' },
  { id: 'en-US-MichelleNeural', name: 'Michelle (Soothing Female)', gender: 'female', style: 'Soothing', locale: 'en-US', label: 'Warm & Soothing - Female (Instant)' },
  { id: 'en-GB-RyanNeural', name: 'Ryan (Elegant British)', gender: 'male', style: 'Classic', locale: 'en-GB', label: 'British Male - Classic (Instant)' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (Sophisticated British)', gender: 'female', style: 'Elegant', locale: 'en-GB', label: 'British Female - Elegant (Instant)' },
  
  // Secondary standard options
  { id: 'en-US-BrianNeural', name: 'Brian (Bright Male)', gender: 'male', style: 'Bright', locale: 'en-US', label: 'Bright Narrator - Male (Instant)' },
  { id: 'en-US-EmmaNeural', name: 'Emma (Bright Female)', gender: 'female', style: 'Cheerful', locale: 'en-US', label: 'Cheerful - Female (Instant)' },
  { id: 'en-US-AriaNeural', name: 'Aria (Storytelling Female)', gender: 'female', style: 'Dramatic', locale: 'en-US', label: 'Dramatic Novel - Female (Instant)' },
  { id: 'en-US-RogerNeural', name: 'Roger (Wise Elder)', gender: 'other', style: 'Wise', locale: 'en-US', label: 'Elderly Narrator - Wise (Instant)' },
  { id: 'en-US-AnaNeural', name: 'Ana (Playful Child)', gender: 'other', style: 'Playful', locale: 'en-US', label: 'Child Narrator - Playful (Instant)' },

  // Premium Multilingual Neural Voices (Excellent accent blend, but high latency/long queue times on Microsoft servers)
  { id: 'en-US-AndrewMultilingualNeural', name: 'Andrew (Premium Multilingual)', gender: 'male', style: 'Natural Narrative', locale: 'en-US', label: 'Andrew Multilingual (Premium - High Latency)' },
  { id: 'en-US-AvaMultilingualNeural', name: 'Ava (Premium Multilingual)', gender: 'female', style: 'Natural Narrative', locale: 'en-US', label: 'Ava Multilingual (Premium - High Latency)' },
  { id: 'en-US-BrianMultilingualNeural', name: 'Brian (Premium Multilingual)', gender: 'male', style: 'Natural Narrative', locale: 'en-US', label: 'Brian Multilingual (Premium - High Latency)' },
  { id: 'en-US-EmmaMultilingualNeural', name: 'Emma (Premium Multilingual)', gender: 'female', style: 'Natural Narrative', locale: 'en-US', label: 'Emma Multilingual (Premium - High Latency)' },
];

interface SpeechChunk {
  index: number;
  text: string;
  wordCount: number;
  estimatedDuration: number;
  startRelativeTime: number;
  endRelativeTime: number;
  audioUrl?: string;
}

function splitTextIntoSpeechChunks(text: string, maxChars: number = 1200): string[] {
  if (!text) return [];
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    
    if (trimmed.length > maxChars) {
      if (current.trim()) {
        chunks.push(current.trim());
        current = "";
      }
      let remaining = trimmed;
      while (remaining.length > maxChars) {
        let splitIdx = remaining.lastIndexOf(" ", maxChars);
        if (splitIdx === -1) splitIdx = maxChars;
        chunks.push(remaining.slice(0, splitIdx).trim());
        remaining = remaining.slice(splitIdx).trim();
      }
      if (remaining.length > 0) {
        current = remaining;
      }
    } else if ((current + " " + trimmed).length > maxChars) {
      if (current.trim()) {
        chunks.push(current.trim());
      }
      current = trimmed;
    } else {
      current += (current ? " " : "") + trimmed;
    }
  }
  if (current.trim()) {
    current = current.trim();
    if (current.length > 0) {
      chunks.push(current);
    }
  }
  return chunks;
}

export default function AudiobookPlayer({
  book,
  voiceSettings,
  setVoiceSettings,
  theme,
  onAddBookmark,
  bookmarks,
  onAddNote,
  notes
}: AudiobookPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [sleepTimerCountdown, setSleepTimerCountdown] = useState<number | null>(null);
  
  // Audio state
  const [chunks, setChunks] = useState<SpeechChunk[]>([]);
  const [activeChunkIndex, setActiveChunkIndex] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<'full' | 'summary'>('full');
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Bookmark and Note mini toggles
  const [isBookmarkedState, setIsBookmarkedState] = useState(false);
  const [bookmarkSuccessAlert, setBookmarkSuccessAlert] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);

  // References
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sleepTimerRef = useRef<any | null>(null);

  const currentChapterIndex = book ? book.currentChapterIndex : 0;
  const chapter: Chapter | null = book && book.chapters[currentChapterIndex] ? book.chapters[currentChapterIndex] : null;

  // Step 1: Chunk the text and map all chunks instantly on chapter/playback mode/voice change
  useEffect(() => {
    if (!book || !chapter) return;

    const voiceId = voiceSettings.voiceId;
    const speed = voiceSettings.speed;
    const pitch = voiceSettings.pitch;

    const baseText = playbackMode === 'summary' ? (chapter.summary || chapter.text) : chapter.text;
    const rawTexts = splitTextIntoSpeechChunks(baseText, 1400); // 1400 chars max
    
    // Build chunks mapping
    let cumulativeTime = 0;
    const initialChunks: SpeechChunk[] = rawTexts.map((textStr, idx) => {
      const wordCount = textStr.split(/\s+/).filter(Boolean).length;
      const estimatedDuration = Math.max(6, Math.round(wordCount / 2.4));
      const url = `/api/tts?text=${encodeURIComponent(textStr)}&voice=${voiceId}&speed=${speed}&pitch=${pitch}`;
      
      const chunk: SpeechChunk = {
        index: idx,
        text: textStr,
        wordCount,
        estimatedDuration,
        startRelativeTime: cumulativeTime,
        endRelativeTime: cumulativeTime + estimatedDuration,
        audioUrl: url,
      };
      cumulativeTime += estimatedDuration;
      return chunk;
    });

    setChunks(initialChunks);
    
    // Find initial active chunk based on book's saved position
    const savedSpot = book.currentPositionSeconds || 0;
    const initialActiveIndex = initialChunks.findIndex(c => savedSpot >= c.startRelativeTime && savedSpot < c.endRelativeTime);
    setActiveChunkIndex(initialActiveIndex !== -1 ? initialActiveIndex : 0);
    setDuration(cumulativeTime || 120);
    setCurrentTime(savedSpot);

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setIsLoadingAudio(false);
  }, [book?.id, currentChapterIndex, playbackMode, voiceSettings.voiceId, voiceSettings.speed, voiceSettings.pitch]);

  // Step 2: Initialize or switch HTML5 Audio when active chunk index or its audioUrl changes
  useEffect(() => {
    if (chunks.length === 0) return;
    const activeChunk = chunks[activeChunkIndex];
    if (!activeChunk || !activeChunk.audioUrl) return;

    setAudioUrl(activeChunk.audioUrl);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(activeChunk.audioUrl);
    audio.preload = "auto";
    audioRef.current = audio;

    // Apply speed and volume
    audio.playbackRate = voiceSettings.speed;
    audio.volume = voiceSettings.volume;

    // Set position inside chunk
    const relativeTime = currentTime - activeChunk.startRelativeTime;
    if (relativeTime > 0 && relativeTime < activeChunk.estimatedDuration) {
      audio.currentTime = relativeTime;
    }

    const handleLoadedMetadata = () => {};

    const handleTimeUpdate = () => {
      const overallCurrentTime = activeChunk.startRelativeTime + audio.currentTime;
      setCurrentTime(overallCurrentTime);
      if (book) {
        book.currentPositionSeconds = Math.round(overallCurrentTime);
      }
    };

    const handleAudioEnded = () => {
      if (activeChunkIndex < chunks.length - 1) {
        setActiveChunkIndex(prev => prev + 1);
      } else {
        handleNextChapter();
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleAudioEnded);

    if (isPlaying) {
      audio.play().catch(err => console.log("Chunk play error:", err));
    }

    // Next chunk sequential preloader
    const nextChunk = chunks[activeChunkIndex + 1];
    if (nextChunk && nextChunk.audioUrl) {
      const preloadAudio = new Audio(nextChunk.audioUrl);
      preloadAudio.preload = "auto";
      preloadAudio.load();
    }

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleAudioEnded);
    };
  }, [chunks, activeChunkIndex, isPlaying]);

  // Download handler - compiles full chapter on-demand
  const handleDownloadMP3 = async () => {
    if (!book || !chapter) return;
    try {
      setIsDownloading(true);
      const textToSynthesize = playbackMode === 'summary' ? (chapter.summary || chapter.text) : chapter.text;

      const regRes = await fetch('/api/tts/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSynthesize })
      });
      if (!regRes.ok) throw new Error("Full registration failed");
      const regData = await regRes.json();
      
      const speed = voiceSettings.speed;
      const pitch = voiceSettings.pitch;
      const voiceId = voiceSettings.voiceId;
      const fullUrl = `/api/tts?textId=${regData.id}&voice=${voiceId}&speed=${speed}&pitch=${pitch}`;

      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      const bTitle = book.title.replace(/[^a-zA-Z0-9_-]/g, "_");
      const cTitle = chapter.title.replace(/[^a-zA-Z0-9_-]/g, "_");
      const mode = playbackMode === 'summary' ? 'summary' : 'verbatim';
      link.download = `${bTitle}_${cTitle}_${mode}.mp3`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Study companion download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Adjust parameters dynamically
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = voiceSettings.speed;
      audioRef.current.volume = voiceSettings.volume;
    }
  }, [voiceSettings.speed, voiceSettings.volume]);

  // Handle Playback State toggler
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (book) book.isPlaying = false;
    } else {
      setIsPlaying(true);
      if (book) book.isPlaying = true;
    }
  };

  // Skip +-15s controls using scrub helper
  const scrubToTime = (value: number) => {
    setCurrentTime(value);
    const targetIndex = chunks.findIndex(c => value >= c.startRelativeTime && value < c.endRelativeTime);
    const finalIndex = targetIndex !== -1 ? targetIndex : chunks.length - 1;

    if (finalIndex !== activeChunkIndex) {
      setActiveChunkIndex(finalIndex);
    } else if (chunks[finalIndex]) {
      const relativeTime = value - chunks[finalIndex].startRelativeTime;
      if (audioRef.current) {
        audioRef.current.currentTime = relativeTime;
      }
    }
  };

  const handleProgressScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    scrubToTime(parseFloat(e.target.value));
  };

  const handleSkipForward = () => {
    const targetTime = Math.min(duration, currentTime + 15);
    scrubToTime(targetTime);
  };

  const handleSkipBackward = () => {
    const targetTime = Math.max(0, currentTime - 15);
    scrubToTime(targetTime);
  };

  // Chapter shifts
  const handleNextChapter = () => {
    if (!book) return;
    if (currentChapterIndex < book.chapters.length - 1) {
      book.currentChapterIndex += 1;
      book.currentPositionSeconds = 0;
      setCurrentTime(0);
    }
  };

  const handlePrevChapter = () => {
    if (!book) return;
    if (currentChapterIndex > 0) {
      book.currentChapterIndex -= 1;
      book.currentPositionSeconds = 0;
      setCurrentTime(0);
    }
  };

  // Canvas waveform paint simulator loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;
    let barsCount = 60;
    let barWidth = width / barsCount;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < barsCount; i++) {
        // Generate simulated dynamic node heights
        const amplitude = isPlaying ? Math.sin(i * 0.15 + Date.now() * 0.008) * 14 + 16 : 4;
        const randomHeight = isPlaying ? Math.max(2, amplitude + Math.sin(Date.now() * 0.01 + i) * 6) : 2;
        
        ctx.fillStyle = theme === 'dark' ? '#818cf8' : '#4f46e5'; // Indigo premium waveform
        ctx.fillRect(
          i * (barWidth + 1.2),
          height / 2 - randomHeight / 2,
          barWidth - 1,
          randomHeight
        );
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, theme]);

  // Sleep Timer countdown processor
  const handleSleepTimerSetup = (minutes: number) => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    
    const totalSeconds = minutes * 60;
    setSleepTimerCountdown(totalSeconds);

    sleepTimerRef.current = setInterval(() => {
      setSleepTimerCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(sleepTimerRef.current);
          if (audioRef.current && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearSleepTimer = () => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
    }
    setSleepTimerCountdown(null);
  };

  // Sync Bookmarks
  const createBookmark = () => {
    if (!book) return;
    const newBookmark: BookmarkType = {
      id: 'bmark_' + Date.now(),
      bookId: book.id,
      chapterIndex: currentChapterIndex,
      positionSeconds: Math.round(currentTime),
      label: `Ch. ${currentChapterIndex + 1} - ${formatTime(currentTime)}`,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
    onAddBookmark(newBookmark);
    setBookmarkSuccessAlert(true);
    setTimeout(() => setBookmarkSuccessAlert(false), 2500);
  };

  // Submit notes
  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || !noteText.trim()) return;

    const newNote: Note = {
      id: 'note_' + Date.now(),
      bookId: book.id,
      chapterIndex: currentChapterIndex,
      positionSeconds: Math.round(currentTime),
      text: noteText,
      timestamp: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    };

    onAddNote(newNote);
    setNoteText("");
    setShowNoteForm(false);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);

    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');

    if (h > 0) {
      return `${h}:${mStr}:${sStr}`;
    }
    return `${m}:${sStr}`;
  };

  if (!book || !chapter) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none" id="player-error">
        <Clock className="h-12 w-12 text-zinc-650 mb-3 animate-spin" />
        <h3 className="text-zinc-400 text-sm font-semibold">Select a PDF book from Library to play</h3>
      </div>
    );
  }

  const selectedVoice = PREBUILT_VOICES.find(v => v.id === voiceSettings.voiceId) || PREBUILT_VOICES[0];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 select-none pb-24" id="main-player-panel">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8" id="player-layout-container">
        
        {/* Left Side: Dynamic cover cards & visualizer waveform */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6" id="player-avatar-section">
          <div className={`h-80 w-60 rounded-3xl bg-gradient-to-tr ${book.coverColor} shadow-2xl relative p-6 flex flex-col justify-between overflow-hidden border border-white/5`}>
            
            {/* Gloss pattern overlay */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
            
            <div className="flex items-center justify-between z-10">
              <span className="text-[10px] font-bold font-mono text-white/80 uppercase">Free Audiobook Player</span>
              <Timer className="h-4 w-4 text-white/50" />
            </div>

            <div className="z-10 text-center">
              <div className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Bookmark className="h-5 w-5 text-indigo-400 fill-indigo-400" />
              </div>
              <h3 className="text-white text-lg font-black tracking-tight leading-snug line-clamp-2 drop-shadow-md">
                {book.title}
              </h3>
              <p className="text-zinc-300 text-xs mt-1.5 font-mono tracking-wide uppercase opacity-90">
                {book.author}
              </p>
            </div>

            <div className="flex items-center justify-between z-10 text-[10px] text-zinc-300/80 font-mono">
              <span>CHAPTER {currentChapterIndex + 1} OF {book.chapters.length}</span>
              <span>HD 48kHz</span>
            </div>
          </div>

          {/* Animated Waveform Visualizer */}
          <div className="w-full max-w-sm flex flex-col items-center">
            <canvas ref={canvasRef} width="320" height="40" className="w-full opacity-90" id="waveform-visualizer" />
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-2">Active Audio Signal</span>
          </div>
        </div>

        {/* Right Side: Controllers and customization menus */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6" id="player-controls-section">
          
          <div id="chapter-title-strip">
            <span className="text-[11px] text-indigo-400 font-bold font-mono uppercase tracking-widest">CHAPTER NARRATION</span>
            <h3 className={`text-xl font-extrabold mt-1 leading-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              {chapter.title}
            </h3>
            <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
              {chapter.summary}
            </p>
          </div>

          {/* Playback Mode Focus & Download Widget */}
          <div className="flex bg-[#16161D]/80 p-2 rounded-2xl border border-slate-800/40 w-full justify-between items-center z-10" id="playback-mode-selector">
            <span className="text-[10px] text-zinc-400 font-bold font-mono uppercase pl-2 flex items-center gap-1.5">
              Playback Focus:
            </span>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
                <button
                  id="mode-full-book"
                  onClick={() => setPlaybackMode('full')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    playbackMode === 'full' 
                      ? 'bg-indigo-650 text-white shadow-sm' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Full Book
                </button>
                <button
                  id="mode-summary-book"
                  onClick={() => setPlaybackMode('summary')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    playbackMode === 'summary' 
                      ? 'bg-indigo-650 text-white shadow-sm' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Summary Only
                </button>
              </div>
              
              <div className="h-5 w-px bg-slate-800/85"></div>
              
              <button
                id="download-mp3-btn"
                onClick={handleDownloadMP3}
                disabled={isDownloading || isLoadingAudio}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-650/15 hover:bg-indigo-650/30 text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer border border-indigo-650/20 transition-all ${
                  (isDownloading || isLoadingAudio) ? 'opacity-50 cursor-wait' : ''
                }`}
              >
                {isDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>Download MP3</span>
              </button>
            </div>
          </div>

          {/* Slider scrubbing navigation */}
          <div className="space-y-1.5" id="audio-scrub-bar-container">
            {isLoadingAudio && (
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono justify-center animate-pulse py-1">
                <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
                <span>Synthesizing vocal frequencies... Guy & Jenny are instant; premium voices can take 15s.</span>
              </div>
            )}
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleProgressScrub}
              className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
              id="player-timeline-slider"
            />
            <div className="flex justify-between items-center text-xs font-mono text-zinc-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls Hub buttons */}
          <div className="flex items-center justify-around py-3" id="player-controls-hub">
            <button
              id="prev-chapter-btn"
              onClick={handlePrevChapter}
              disabled={currentChapterIndex === 0}
              className="p-2.5 rounded-full hover:bg-zinc-800/10 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            <button
              id="skip-back-15s-btn"
              onClick={handleSkipBackward}
              className="p-2.5 rounded-full hover:bg-zinc-800/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-[10px] font-mono font-bold block mt-0.5">-15s</span>
            </button>

            <button
              id="player-play-pause-toggle"
              onClick={togglePlay}
              disabled={isLoadingAudio}
              className={`h-16 w-16 rounded-full bg-indigo-650 hover:bg-indigo-550 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all outline-none cursor-pointer ${isLoadingAudio ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isLoadingAudio ? (
                <Loader2 className="h-7 w-7 text-white animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-7.5 w-7.5" />
              ) : (
                <Play className="h-7.5 w-7.5 fill-white ml-1" />
              )}
            </button>

            <button
              id="skip-forward-15s-btn"
              onClick={handleSkipForward}
              className="p-2.5 rounded-full hover:bg-zinc-800/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" />
              <span className="text-[10px] font-mono font-bold block mt-0.5">+15s</span>
            </button>

            <button
              id="next-chapter-btn"
              onClick={handleNextChapter}
              disabled={currentChapterIndex === book.chapters.length - 1}
              className="p-2.5 rounded-full hover:bg-zinc-800/10 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          <div className="border-t border-zinc-800/10 pt-4 grid grid-cols-2 md:grid-cols-4 gap-3.5 text-center" id="player-utility-panel">
            
            {/* Speed controller */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-zinc-500 font-bold font-mono uppercase">Speed</span>
              <select
                id="speed-selector"
                value={voiceSettings.speed}
                onChange={(e) => setVoiceSettings({ ...voiceSettings, speed: parseFloat(e.target.value) })}
                className="mt-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100"
              >
                <option value="0.5">0.5x Slow</option>
                <option value="0.75">0.75x</option>
                <option value="1.0">1.0x Norm</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x Fast</option>
                <option value="1.8">1.8x</option>
                <option value="2.0">2.0x Duo</option>
                <option value="2.5">2.5x Max</option>
                <option value="3.0">3.0x Edge</option>
              </select>
            </div>

            {/* Pitch adjuster */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-zinc-500 font-bold font-mono uppercase">Pitch</span>
              <select
                id="pitch-selector"
                value={voiceSettings.pitch}
                onChange={(e) => setVoiceSettings({ ...voiceSettings, pitch: parseFloat(e.target.value) })}
                className="mt-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100"
              >
                <option value="0.8">0.8x Bass</option>
                <option value="0.9">0.9x Dark</option>
                <option value="1.0">1.0x Flat</option>
                <option value="1.1">1.1x Bright</option>
                <option value="1.2">1.2x Higher</option>
              </select>
            </div>

            {/* Voice Narrator preset selection */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-zinc-500 font-bold font-mono uppercase">Voice talent</span>
              <button
                id="voice-picker-toggle"
                onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                className="mt-1.5 text-xs font-bold px-3 py-1 bg-zinc-950 border border-slate-800 rounded-lg text-indigo-400 hover:text-indigo-300 truncate max-w-full cursor-pointer transition-colors"
              >
                {selectedVoice.name.split(' ')[0]}
              </button>
            </div>

            {/* Sleep timer trigger */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-zinc-500 font-bold font-mono uppercase">Sleep Timer</span>
              {sleepTimerCountdown !== null ? (
                <button
                  id="cancel-sleep-timer"
                  onClick={clearSleepTimer}
                  className="mt-1.5 text-xs font-bold px-2.5 py-1 bg-indigo-600 border border-transparent rounded-lg text-white cursor-pointer transition-colors"
                >
                  {formatTime(sleepTimerCountdown)}
                </button>
              ) : (
                <select
                  id="sleep-timer-selector"
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val > 0) handleSleepTimerSetup(val);
                  }}
                  defaultValue="0"
                  className="mt-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-950 border border-slate-800 text-zinc-100"
                >
                  <option value="0">Disabled</option>
                  <option value="5">5 Min</option>
                  <option value="15">15 Min</option>
                  <option value="30">30 Min</option>
                  <option value="45">45 Min</option>
                  <option value="60">1 Hour</option>
                </select>
              )}
            </div>

          </div>

          {/* Voice talents modal list */}
          {showVoiceMenu && (
            <div className="p-4 rounded-2xl bg-[#16161D]/95 border border-slate-800 shadow-xl space-y-3 relative z-30" id="voice-picker-modal">
              <div className="flex items-center justify-between text-xs font-bold border-b border-zinc-800/20 pb-2">
                <span className="text-zinc-200">Neural Narrator Presets</span>
                <button id="close-voice-picker" onClick={() => setShowVoiceMenu(false)} className="text-zinc-500 hover:text-white cursor-pointer">Close</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-h-48 overflow-y-auto pr-1" id="presets-list-container">
                {PREBUILT_VOICES.map((v) => {
                  const active = v.id === voiceSettings.voiceId;
                  return (
                    <button
                      key={v.id}
                      id={`voice-preset-${v.id}`}
                      onClick={() => {
                        setVoiceSettings({ ...voiceSettings, voiceId: v.id });
                        setShowVoiceMenu(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-left flex justify-between items-center transition-all cursor-pointer
                        ${active 
                          ? 'bg-indigo-650 text-white shadow-sm' 
                          : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                    >
                      <span className="truncate">{v.name}</span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-black/20 text-indigo-400">{v.gender}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bookmarking and Notes utilities */}
          <div className="border-t border-zinc-800/5 pt-4 flex items-center justify-between" id="bookmarks-bar">
            {bookmarkSuccessAlert ? (
              <span className="text-xs font-bold font-mono text-indigo-400 flex items-center gap-1">
                <Bookmark className="h-4 w-4 fill-indigo-400" /> Bookmark registered at {formatTime(currentTime)}!
              </span>
            ) : (
              <button
                id="trigger-add-bookmark"
                onClick={createBookmark}
                className="text-xs font-extrabold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Bookmark className="h-4 w-4" /> Add Bookmark
              </button>
            )}

            <button
              id="trigger-toggle-note"
              onClick={() => setShowNoteForm(!showNoteForm)}
              className="text-xs font-extrabold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FileText className="h-4 w-4" /> {showNoteForm ? 'Dismiss note' : 'Write Note'}
            </button>
          </div>

          {/* Quick inline note notepad */}
          {showNoteForm && (
            <form onSubmit={handleSubmitNote} className="space-y-3.5 bg-zinc-950/20 p-4 rounded-2xl border border-slate-800/40" id="quick-note-form">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>ATTACH NOTE AT {formatTime(currentTime)}</span>
                <span className="text-zinc-500">Auto-saved to local DB</span>
              </div>
              <textarea
                id="note-text-area"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your study notes, insights, or thoughts for this section..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl bg-zinc-950 border border-slate-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-400"
              />
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  id="cancel-note-btn"
                  onClick={() => setShowNoteForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-note-btn"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
