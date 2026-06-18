/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, BookOpen, Clock, HardDrive, Download, ToggleLeft, ToggleRight, Sparkles, AlertCircle } from 'lucide-react';
import { Book } from '../types';

interface DashboardProps {
  books: Book[];
  selectedBookId: string | null;
  onSelectBook: (bookId: string) => void;
  setActiveTab: (tab: 'library' | 'upload' | 'player' | 'detail') => void;
  theme: 'dark' | 'light';
  onDeleteBook: (bookId: string) => void;
}

export default function Dashboard({
  books,
  selectedBookId,
  onSelectBook,
  setActiveTab,
  theme,
  onDeleteBook
}: DashboardProps) {
  const [offlineCaching, setOfflineCaching] = useState(true);

  // Stats summaries
  const totalBooks = books.length;
  const totalListeningSeconds = books.reduce((acc, b) => acc + b.listeningSeconds, 0);
  const totalHours = (totalListeningSeconds / 3600).toFixed(1);
  const totalSizeMb = books.reduce((acc, b) => acc + b.sizeMb, 0).toFixed(1);
  
  // Storage logic: Mock 500MB max limit
  const storagePercent = Math.min(100, Math.max(2, Math.round((parseFloat(totalSizeMb) / 500) * 100)));

  const handleBookCardOpen = (bookId: string) => {
    onSelectBook(bookId);
    setActiveTab('detail');
  };

  const handleBookCardPlay = (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    onSelectBook(bookId);
    setActiveTab('player');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 select-none pb-24" id="dashboard-panel">
      <div className="max-w-6xl mx-auto space-y-8" id="dashboard-container">
        
        {/* Welcome Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="dashboard-welcome">
          <div>
            <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              BookSpeak AI Portal
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Listen to unlimited, crystal-clear narration of PDF books with automated chapter mapping.
            </p>
          </div>
          
          <button
            id="caching-toggle-btn"
            onClick={() => setOfflineCaching(!offlineCaching)}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-xs font-semibold shadow-sm transition-all
              ${theme === 'dark'
                ? 'bg-[#16161D] border-slate-800 text-zinc-300'
                : 'bg-white border-zinc-200 text-zinc-700'
              }`}
          >
            {offlineCaching ? (
              <>
                <ToggleRight className="h-5 w-5 text-indigo-500" />
                <span>Offline Caching: Active</span>
              </>
            ) : (
              <>
                <ToggleLeft className="h-5 w-5 text-zinc-500" />
                <span>Offline Caching: Off</span>
              </>
            )}
          </button>
        </div>

        {/* Statistics Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-stats-grid">
          <div className={`p-5 rounded-3xl border flex items-center gap-4 ${theme === 'dark' ? 'bg-[#16161D] border-slate-800' : 'bg-white border-zinc-200'}`}>
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">My Podcasts</p>
              <h3 className={`text-xl font-black mt-0.5 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{totalBooks} books</h3>
            </div>
          </div>

          <div className={`p-5 rounded-3xl border flex items-center gap-4 ${theme === 'dark' ? 'bg-[#16161D] border-slate-800' : 'bg-white border-zinc-200'}`}>
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Total Duration</p>
              <h3 className={`text-xl font-black mt-0.5 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{totalHours} hours</h3>
            </div>
          </div>

          <div className={`p-5 rounded-3xl border flex flex-col justify-between ${theme === 'dark' ? 'bg-[#16161D] border-slate-800' : 'bg-white border-zinc-200'} sm:col-span-2 lg:col-span-2`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Book Space Limit</p>
                  <h3 className={`text-sm font-extrabold mt-0.5 ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {totalSizeMb}MB used of 500MB
                  </h3>
                </div>
              </div>
              <span className="text-xs text-indigo-400 font-bold font-mono">{storagePercent}%</span>
            </div>
            <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden border border-zinc-750/30">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${storagePercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Shelf Books Section */}
        <div id="bookshelf-section">
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-850'}`}>
              Book Shelf
            </h3>
            <button
              onClick={() => setActiveTab('upload')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Add New eBook
            </button>
          </div>

          {books.length === 0 ? (
            <div className={`border-2 border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center
              ${theme === 'dark' ? 'border-slate-800 bg-[#16161D]/20' : 'border-zinc-200 bg-zinc-50/50'}`}
              id="library-empty"
            >
              <BookOpen className="h-12 w-12 text-zinc-650 mb-4" />
              <h4 className={`text-base font-bold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Create your first audiobook
              </h4>
              <p className="text-xs text-zinc-500 mt-2 max-w-sm mx-auto">
                No audiobook logs found. Upload your favourite text, screenplay or digital PDF to initiate smart AI-OCR structures!
              </p>
              <button
                id="library-upl-redirect-btn"
                onClick={() => setActiveTab('upload')}
                className="mt-6 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-transform hover:scale-[1.02]"
              >
                Go to Upload Studio
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" id="library-books-grid">
              {books.map((book) => {
                const bookListeningHours = (book.listeningSeconds / 3600).toFixed(1);
                const bookPercent = Math.min(
                  100,
                  Math.round(
                    (book.currentChapterIndex / Math.max(1, book.chapters.length)) * 100
                  )
                );

                return (
                  <div
                    key={book.id}
                    id={`book-card-${book.id}`}
                    onClick={() => handleBookCardOpen(book.id)}
                    className={`group relative rounded-3xl border overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-xl
                      ${theme === 'dark'
                        ? 'bg-[#16161D] border-slate-800 hover:border-slate-705 hover:bg-[#16161D]/85 shadow-zinc-950/20'
                        : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-white/80 shadow-zinc-200/50'
                      }`}
                  >
                    {/* Visual Cover Top Banner */}
                    <div className={`h-40 bg-gradient-to-tr ${book.coverColor} relative p-5 flex flex-col justify-between overflow-hidden`}>
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-200 via-red-300 to-indigo-900"></div>
                      
                      {/* Interactive Pattern Decorator */}
                      <div className="absolute -right-10 -bottom-10 opacity-15">
                        <div className={`rounded-full border-4 border-zinc-200 hover:scale-110 transition-transform ${book.coverPattern === 'circles' ? 'h-32 w-32' : 'h-16 w-32 border-dashed'}`}></div>
                      </div>

                      {/* Header Badge */}
                      <div className="flex items-center justify-between z-10">
                        <span className="text-[9px] font-bold tracking-widest font-mono text-zinc-100 uppercase opacity-90 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                          {book.chapters.length} Ch.
                        </span>
                        
                        <button
                          id={`play-shortcut-${book.id}`}
                          onClick={(e) => handleBookCardPlay(e, book.id)}
                          className="h-10 w-10 rounded-full bg-indigo-650 hover:bg-indigo-550 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                        >
                          <Play className="h-4.5 w-4.5 fill-white" />
                        </button>
                      </div>

                      <div className="z-10">
                        <h4 className="text-white text-base font-extrabold tracking-tight line-clamp-1 drop-shadow-md">
                          {book.title}
                        </h4>
                        <p className="text-zinc-200 text-xs font-mono tracking-wide opacity-90 line-clamp-1">
                          {book.author}
                        </p>
                      </div>
                    </div>

                    {/* Book Metadata details */}
                    <div className="p-5 flex flex-col gap-4">
                      <p className="text-zinc-400 text-xs line-clamp-2 min-h-[32px]">
                        {book.summary}
                      </p>

                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-zinc-500" /> {bookListeningHours} hrs listen
                        </span>
                        <span>{book.sizeMb} MB</span>
                      </div>

                      <div className="space-y-1 pt-1.5 border-t border-slate-800/20">
                        <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
                          <span>PROGRESS</span>
                          <span>{bookPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-1.5 rounded-full"
                            style={{ width: `${bookPercent}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Single action deletes */}
                      <div className="flex items-center justify-between pt-1 text-[10px]">
                        <span className="text-zinc-500 font-semibold uppercase">{book.uploadDate}</span>
                        <button
                          id={`delete-btn-${book.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteBook(book.id);
                          }}
                          className="text-rose-500 hover:text-rose-450 font-bold transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Download Guide Notice */}
        <div className={`p-4 rounded-3xl border flex items-start gap-3.5
          ${theme === 'dark' ? 'bg-[#16161D]/40 border-slate-800' : 'bg-zinc-50/50 border-zinc-150'}`}
          id="dashboard-download-advisory"
        >
          <AlertCircle className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h5 className={`font-bold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-800'}`}>Production Deployment Advisory</h5>
            <p className="text-zinc-400 mt-0.5">
              BookSpeak AI uses browser-optimized IndexedDB and offline stream buffers (using Microsoft free Edge APIs) to secure zero latency. Books are stored locally in sandbox container memory and remain intact until your browser storage or node container session restarts.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
