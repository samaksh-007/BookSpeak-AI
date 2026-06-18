/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { extractPDFText, getRandomCoverSettings } from '../utils/pdfExtractor';
import { Book, Chapter } from '../types';

interface PDFUploadProps {
  onBookCreated: (book: Book) => void;
  theme: 'dark' | 'light';
  isDemoModEnabled: boolean;
  onSelectBook: (bookId: string) => void;
  setActiveTab: (tab: 'library' | 'upload' | 'player' | 'detail') => void;
}

export default function PDFUpload({ 
  onBookCreated, 
  theme, 
  isDemoModEnabled,
  onSelectBook,
  setActiveTab
}: PDFUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Helper mock parser for sample book loads
  const loadSampleBook = async () => {
    setIsLoading(true);
    setProgress(10);
    setStatusText("Preparing Sample Novel Text...");
    await new Promise(r => setTimeout(r, 600));
    
    setProgress(40);
    setStatusText("Invoking Gemini-3.5-Flash Smart Categorization...");
    
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "sample_sample", // Trigger pipeline
          filename: "Mystery_of_Nicolas_Flamel.pdf",
          originalTitle: "The Alchemist's Legacy",
          originalAuthor: "Arthur J. Pendelton"
        })
      });

      if (!response.ok) throw new Error("Backend analyzer failed.");
      
      const structuredData = await response.json();
      setProgress(85);
      setStatusText("Mapping Voice Talents & Chapter Durations...");
      await new Promise(r => setTimeout(r, 800));

      const coverSettings = getRandomCoverSettings();
      const newBook: Book = {
        id: 'book_' + Date.now(),
        title: structuredData.title || "The Alchemist's Legacy",
        author: structuredData.author || "Arthur J. Pendelton",
        totalPages: 24,
        listeningSeconds: structuredData.chapters.reduce((acc: number, c: any) => acc + (c.durationSeconds || 120), 0),
        uploadDate: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        coverColor: coverSettings.color,
        coverPattern: coverSettings.pattern,
        currentChapterIndex: 0,
        currentPositionSeconds: 0,
        sizeMb: 1.4,
        status: 'ready',
        progress: 0,
        summary: structuredData.summary || "A captivating alchemical thriller...",
        keyTakeaways: structuredData.keyTakeaways || [],
        characters: structuredData.characters || [],
        chapters: structuredData.chapters.map((ch: any, idx: number) => ({
          id: 'chap_' + Date.now() + '_' + idx,
          title: ch.title,
          startPage: ch.startPage || (idx * 5 + 1),
          endPage: ch.endPage || ((idx + 1) * 5),
          summary: ch.summary,
          durationSeconds: ch.durationSeconds || 120,
          text: ch.text,
          order: idx
        }))
      };

      onBookCreated(newBook);
      onSelectBook(newBook.id);
      setIsLoading(false);
      setActiveTab('detail');
    } catch (err: any) {
      setErrorText("Could not connect to full stack API. Ensure server.ts is compiling: " + err.message);
      setIsLoading(false);
    }
  };

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setErrorText("Only PDF formatted book files are supported by BookSpeak AI.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorText(null);
      setProgress(2);
      setStatusText("Initializing file processing...");

      // 1. Extract plain text page-by-page inside the browser
      const result = await extractPDFText(file, (p, step) => {
        setProgress(p);
        setStatusText(step);
      });

      // 2. Compile a lightweight skeletal text for the API to prevent timeouts and heavy payload uploads
      setProgress(73);
      setStatusText("Analyzing document structure and preparing skeletal content...");
      
      let condensedText = "";
      if (result.pages && result.pages.length > 0) {
        condensedText = result.pages.map(p => {
          const isIntroOrOutro = p.pageNum <= 12 || p.pageNum > (result.totalPages - 6);
          const cleanText = p.text || "";
          if (isIntroOrOutro) {
            return `--- PAGE ${p.pageNum} ---\n${cleanText}`;
          } else {
            // Include starting snippet and keep lines that contain typical division/chapter markers
            const lines = cleanText.split('\n');
            const divisionMarkers = lines.filter(line => {
              const lower = line.toLowerCase();
              return lower.includes('chapter') || lower.includes('part') || lower.includes('book') || lower.includes('section') || lower.includes('ch.');
            });
            const firstSnippet = cleanText.slice(0, 350);
            return `--- PAGE ${p.pageNum} ---\n${firstSnippet}\n${divisionMarkers.slice(0, 5).join('\n')}`;
          }
        }).join("\n\n");
      } else {
        condensedText = result.text;
      }
      
      setProgress(78);
      setStatusText("De-duplicating watermarks and classifying with Gemini...");
      
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: condensedText,
          filename: file.name,
          originalTitle: file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
          originalAuthor: "AI Studio Reader"
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned error status: ${response.status}`);
      }

      setProgress(90);
      setStatusText("Compiling final chapter metadata, takeaways and voice presets...");
      
      const structuredData = await response.json();
      const coverSettings = getRandomCoverSettings();

      const newBook: Book = {
        id: 'book_' + Date.now(),
        title: structuredData.title || file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
        author: structuredData.author || "Unknown Author",
        totalPages: result.totalPages || 12,
        listeningSeconds: structuredData.chapters.reduce((acc: number, c: any) => acc + (c.durationSeconds || 120), 0),
        uploadDate: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        coverColor: coverSettings.color,
        coverPattern: coverSettings.pattern,
        currentChapterIndex: 0,
        currentPositionSeconds: 0,
        sizeMb: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        status: 'ready',
        progress: 0,
        summary: structuredData.summary || "No description generated.",
        keyTakeaways: structuredData.keyTakeaways || [],
        characters: structuredData.characters || [],
        chapters: structuredData.chapters.map((ch: any, idx: number) => {
          const sPage = ch.startPage || 1;
          const ePage = ch.endPage || 1;
          
          let verbatimText = "";
          if (result && result.pages && result.pages.length > 0) {
            const chapterPages = result.pages.filter(
              (p: any) => p.pageNum >= sPage && p.pageNum <= ePage
            );
            if (chapterPages.length > 0) {
              verbatimText = chapterPages.map((p: any) => p.text).join("\n\n");
            }
          }
          
          const finalChapterText = (verbatimText && verbatimText.trim().length > 100)
            ? verbatimText
            : (ch.text || ch.summary);

          const wordCount = finalChapterText.split(/\s+/).filter(Boolean).length;
          const estimatedDuration = Math.max(30, Math.round(wordCount / 2.5));

          return {
            id: 'chap_' + Date.now() + '_' + idx,
            title: ch.title,
            startPage: sPage,
            endPage: ePage,
            summary: ch.summary,
            durationSeconds: estimatedDuration,
            text: finalChapterText,
            order: idx
          };
        })
      };

      setProgress(100);
      setStatusText("Audiobook compiled successfully!");
      
      // Delay slightly for visual feedback
      await new Promise(resolve => setTimeout(resolve, 800));
      onBookCreated(newBook);
      onSelectBook(newBook.id);
      setIsLoading(false);
      setActiveTab('detail');
    } catch (err: any) {
      console.error(err);
      setErrorText("Analysis failed: " + (err.message || "Ensure server.ts is booting successfully on Port 3000."));
      setIsLoading(false);
    }
  };

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 select-none" id="upload-panel">
      <div className="max-w-3xl mx-auto" id="upload-panel-container">
        {/* Page title */}
        <div className="mb-8" id="upload-header">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <span className="text-xs uppercase tracking-wider font-bold text-indigo-400 font-mono">Premium Converter Tool</span>
          </div>
          <h2 className={`text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            Upload Book Masterpiece
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Publish your digital epubs, scanned books, or historical documents instantly into high-fidelity speech narration.
          </p>
        </div>

        {errorText && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-500 text-sm flex items-start gap-3 animate-fade-in" id="upload-error-alert">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold">Conversion Interrupted</h4>
              <p className="text-zinc-400 text-xs mt-1">{errorText}</p>
            </div>
          </div>
        )}

        {/* Upload card container */}
        {!isLoading ? (
          <div className="space-y-6">
            <div
              id="drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerPicker}
              className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group
                ${isDragging 
                  ? 'border-indigo-500 bg-indigo-500/5 scale-[0.99] shadow-inner' 
                  : theme === 'dark'
                    ? 'border-slate-800 bg-[#16161D]/40 hover:border-slate-700 hover:bg-[#16161D]/60'
                    : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100/50'
                }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
                id="pdf-file-picker"
              />

              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <UploadCloud className="h-8 w-8 text-indigo-400 animate-bounce" />
              </div>

              <h3 className={`text-lg font-bold text-center ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>
                Drag &amp; Drop your PDF Book here
              </h3>
              <p className="text-zinc-400 text-xs text-center mt-2 max-w-md">
                We support large ebooks up to <strong className="text-slate-305 text-white">1GB</strong>. Scanned manuscript pages, research whitepapers, or multi-language novels are automatically cleaned and reformatted using our local OCR extraction engine.
              </p>

              <button
                type="button"
                id="select-pdf-button"
                className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerPicker();
                }}
              >
                Browse PDF Files
              </button>
            </div>

            {/* Quick Demo Pre-analyzer load */}
            <div className={`p-6 rounded-3xl border text-center flex flex-col md:flex-row items-center justify-between gap-4
              ${theme === 'dark' ? 'bg-[#16161D]/50 border-slate-800' : 'bg-zinc-50 border-zinc-200'}`}
              id="upload-demo-helper"
            >
              <div className="text-left">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">No PDFs nearby?</h4>
                <p className="text-zinc-400 text-xs mt-1">Compile our premade alchemical academic novel into an audiobook instantly with one click!</p>
              </div>
              <button
                type="button"
                id="load-demo-book-btn"
                onClick={loadSampleBook}
                className={`w-full md:w-auto px-5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer
                  ${theme === 'dark'
                    ? 'border-slate-800 hover:border-slate-700 bg-zinc-900 text-zinc-300 hover:text-white'
                    : 'border-zinc-200 hover:border-zinc-350 bg-white text-zinc-700 hover:text-zinc-900'
                  }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Generate Sample Book
              </button>
            </div>
          </div>
        ) : (
          /* Analysis progress card */
          <div className={`p-8 rounded-3xl border select-none transition-colors
            ${theme === 'dark' ? 'bg-[#16161D]/80 border-slate-800' : 'bg-white border-zinc-200'}`}
            id="upload-loading-card"
          >
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Loader2 className="h-10 w-10 text-indigo-400 animate-spin mb-4" />
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                Smart Conversion in Progress
              </h3>
              <p className="text-xs text-indigo-400 font-mono mt-1 tracking-wider uppercase">{statusText}</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-slate-850 rounded-full h-2.5 mt-8 mb-4 overflow-hidden relative border border-slate-800/10">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-xs text-zinc-400 font-mono font-bold">{progress}% completed</span>

              {/* Step checklist details */}
              <div className="w-full max-w-md text-left mt-10 space-y-3.5 border-t border-slate-800/20 pt-6">
                <div className="flex items-center gap-3 text-xs">
                  <CheckCircle2 className={`h-4.5 w-4.5 ${progress >= 25 ? 'text-indigo-400' : 'text-zinc-650'}`} />
                  <span className={progress >= 25 ? 'text-zinc-300 font-semibold' : 'text-zinc-500'}>Extracting text layout &amp; discovering paper pages</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <CheckCircle2 className={`h-4.5 w-4.5 ${progress >= 60 ? 'text-indigo-400' : 'text-zinc-650'}`} />
                  <span className={progress >= 60 ? 'text-zinc-300 font-semibold' : 'text-zinc-500'}>AI-OCR error-cleanup, header removal &amp; spelling merge</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <CheckCircle2 className={`h-4.5 w-4.5 ${progress >= 85 ? 'text-indigo-400' : 'text-zinc-650'}`} />
                  <span className={progress >= 85 ? 'text-zinc-300 font-semibold' : 'text-zinc-500'}>Gemini semantic chapter indexing &amp; character tracking</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <CheckCircle2 className={`h-4.5 w-4.5 ${progress >= 100 ? 'text-indigo-400' : 'text-zinc-650'}`} />
                  <span className={progress >= 100 ? 'text-zinc-300 font-semibold' : 'text-zinc-500'}>Compiling voice talents &amp; synchronizing local state</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
