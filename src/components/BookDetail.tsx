/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Play, BookOpen, Clock, Tag, Award, Sparkles, 
  Trash2, FileText, ChevronRight, Bookmark, CircleCheck
} from 'lucide-react';
import { Book, Chapter, Bookmark as BookmarkType, Note } from '../types';

interface BookDetailProps {
  book: Book | null;
  onSelectBook: (bookId: string) => void;
  setActiveTab: (tab: 'library' | 'upload' | 'player' | 'detail') => void;
  theme: 'dark' | 'light';
  bookmarks: BookmarkType[];
  onDeleteBookmark: (bookmarkId: string) => void;
  notes: Note[];
  onDeleteNote: (noteId: string) => void;
}

export default function BookDetail({
  book,
  onSelectBook,
  setActiveTab,
  theme,
  bookmarks,
  onDeleteBookmark,
  notes,
  onDeleteNote
}: BookDetailProps) {
  const [activeSubTab, setActiveSubTab] = useState<'chapters' | 'characters' | 'bookmarks' | 'notes'>('chapters');

  if (!book) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none" id="details-error">
        <BookOpen className="h-12 w-12 text-zinc-650 mb-3 animate-pulse" />
        <h3 className="text-zinc-500 text-sm font-semibold">Select an audiobook from your library first</h3>
        <button
          onClick={() => setActiveTab('library')}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
          id="detail-redirect-lib"
        >
          Go to Library
        </button>
      </div>
    );
  }

  // Filter bookmarks and notes specific to this book
  const bookBookmarks = bookmarks.filter(b => b.bookId === book.id);
  const bookNotes = notes.filter(n => n.bookId === book.id);

  const totalListeningHours = (book.listeningSeconds / 3600).toFixed(1);

  const handlePlayChapter = (chapterIdx: number) => {
    book.currentChapterIndex = chapterIdx;
    book.currentPositionSeconds = 0;
    setActiveTab('player');
  };

  const handlePlayBookmark = (chapterIdx: number, seconds: number) => {
    book.currentChapterIndex = chapterIdx;
    book.currentPositionSeconds = seconds;
    setActiveTab('player');
  };

  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')} min`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 select-none pb-24" id="book-detail-panel">
      <div className="max-w-5xl mx-auto space-y-8" id="book-detail-container">
        
        {/* Top Header Block */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-zinc-800/10" id="detail-header-card">
          <div className="flex flex-col md:flex-row gap-5 items-start md:items-center">
            {/* Deterministic colored square card banner */}
            <div className={`h-28 w-28 rounded-2xl bg-gradient-to-tr ${book.coverColor} p-4 flex flex-col justify-between shadow-lg text-white font-black overflow-hidden`}>
              <span className="text-[8px] font-mono tracking-widest opacity-85">STUDIO</span>
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] font-bold tracking-wider uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                  AI Structured
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                  Total {book.chapters.length} Chapters
                </span>
              </div>
              <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                {book.title}
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                Written by <span className={theme === 'dark' ? 'text-zinc-200 font-semibold' : 'text-zinc-850 font-semibold'}>{book.author}</span>
              </p>
            </div>
          </div>

          <button
            id="detail-main-play-btn"
            onClick={() => handlePlayChapter(0)}
            className="w-full md:w-auto px-6 py-3 rounded-2xl bg-indigo-650 hover:bg-indigo-550 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-655/10 transition-transform active:scale-95 cursor-pointer"
          >
            <Play className="h-4 w-4 fill-white text-white" /> Start Listening
          </button>
        </div>

        {/* Two Columns Section: Details on left, statistics/Takeaways on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="book-detail-body">
          
          {/* Column A: Cover details summaries & chapters selection */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-widest font-mono mb-2 text-zinc-500`}>Book Summary</h3>
              <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {book.summary}
              </p>
            </div>

            {/* Segment Controls list */}
            <div className="border-b border-zinc-800/10 flex items-center gap-1 overflow-x-auto select-none" id="detail-subtabs-strip">
              {(['chapters', 'characters', 'bookmarks', 'notes'] as const).map((sub) => {
                const isActive = activeSubTab === sub;
                return (
                  <button
                    key={sub}
                    id={`detail-subtab-${sub}`}
                    onClick={() => setActiveSubTab(sub)}
                    className={`py-3 px-4 text-xs font-bold border-b-2 capitalize tracking-normal transition-all outline-none whitespace-nowrap cursor-pointer
                      ${isActive
                        ? 'border-indigo-400 text-indigo-400 font-extrabold'
                        : 'border-transparent text-zinc-500 hover:text-zinc-200'
                      }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>

            {/* Sub View Cards list */}
            <div className="pt-2" id="detail-subtabs-content">
              
              {/* Chapters list */}
              {activeSubTab === 'chapters' && (
                <div className="space-y-3" id="details-chapters-list">
                  {book.chapters.map((ch, idx) => (
                    <div
                      key={ch.id}
                      id={`detail-chapter-row-${idx}`}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 group
                        ${theme === 'dark'
                          ? 'bg-[#16161D] border-slate-800 hover:border-slate-700 hover:bg-[#16161D]/75'
                          : 'bg-zinc-50/50 border-zinc-200 hover:border-zinc-300 hover:bg-white'
                        }`}
                    >
                      <div className="truncate flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-indigo-400 font-bold">CH {idx + 1}</span>
                          <h4 className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-zinc-850'}`}>
                            {ch.title}
                          </h4>
                        </div>
                        <p className="text-zinc-400 text-xs mt-1 truncate">
                          {ch.summary}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-400 font-mono">
                          <span>Pages {ch.startPage}-{ch.endPage}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-zinc-500" /> {formatSeconds(ch.durationSeconds)}</span>
                        </div>
                      </div>

                      <button
                        id={`play-chap-row-btn-${idx}`}
                        onClick={() => handlePlayChapter(idx)}
                        className="h-9 w-9 rounded-full bg-zinc-950 hover:bg-indigo-650 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800 transition-all cursor-pointer shadow-sm shadow-black/10 group-hover:scale-105"
                      >
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Characters dialogue speakers detection mapping */}
              {activeSubTab === 'characters' && (
                <div className="space-y-3" id="details-characters-list">
                  {book.characters.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic p-3">No distinct speaker characters cataloged. Generating standard narration styles instead.</p>
                  ) : (
                    book.characters.map((char, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border space-y-1.5
                          ${theme === 'dark' ? 'bg-[#16161D] border-slate-800' : 'bg-zinc-50/40 border-zinc-250'}`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-black ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>{char.characterName}</h4>
                          <span className="text-[10px] font-mono uppercase bg-zinc-955 border border-slate-800 text-indigo-400 px-2 py-0.5 rounded-md">
                            Assign Voice: {char.voiceStyle}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          <strong className="text-zinc-300">Tone/Accent Style:</strong> {char.speakingStyle}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Bookmarks manager */}
              {activeSubTab === 'bookmarks' && (
                <div className="space-y-3" id="details-bookmarks-list">
                  {bookBookmarks.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No bookmarks saved for this book.</p>
                      <p className="text-[10px] text-zinc-650 mt-1">Press the "Add Bookmark" button in the active Player.</p>
                    </div>
                  ) : (
                    bookBookmarks.map((bmark) => (
                      <div 
                        key={bmark.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3
                          ${theme === 'dark' ? 'bg-[#16161D] border-slate-800' : 'bg-white border-zinc-200'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Bookmark className="h-4 w-4 text-indigo-400 fill-indigo-450" />
                          <div>
                            <p className="text-xs font-bold leading-none">{bmark.label}</p>
                            <span className="text-[9px] font-mono text-zinc-500">{bmark.timestamp}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            id={`play-bmark-${bmark.id}`}
                            onClick={() => handlePlayBookmark(bmark.chapterIndex, bmark.positionSeconds)}
                            className="px-2.5 py-1 text-[10px] rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-colors"
                          >
                            Listen
                          </button>
                          <button
                            id={`delete-bmark-${bmark.id}`}
                            onClick={() => onDeleteBookmark(bmark.id)}
                            className="p-1.5 rounded-lg text-zinc-550 hover:text-rose-500 border border-slate-800 cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Study notes manager */}
              {activeSubTab === 'notes' && (
                <div className="space-y-3" id="details-notes-list">
                  {bookNotes.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No study annotations written yet.</p>
                    </div>
                  ) : (
                    bookNotes.map((note) => (
                      <div
                        key={note.id}
                        className={`p-4 rounded-2xl border flex flex-col gap-2
                          ${theme === 'dark' ? 'bg-[#16161D] border-slate-800' : 'bg-white border-zinc-200'}`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                          <span>CHAPTER {note.chapterIndex + 1} AT {formatSeconds(note.positionSeconds)}</span>
                          <span>{note.timestamp}</span>
                        </div>
                        <p className={`text-xs ${theme === 'dark' ? 'text-zinc-350' : 'text-zinc-800'}`}>
                          {note.text}
                        </p>
                        <div className="flex justify-end pt-1">
                          <button
                            id={`delete-note-${note.id}`}
                            onClick={() => onDeleteNote(note.id)}
                            className="text-[10px] text-rose-505 hover:text-rose-400 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" /> Delete Note
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Column B: Showcase stats, takeaways and chapters durations */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Quick stats widgets card */}
            <div className={`p-5 rounded-3xl border ${theme === 'dark' ? 'bg-[#16161D] border-slate-800' : 'bg-[#FAFAFA] border-zinc-150'}`} id="detail-stats-card">
              <h4 className="text-[11px] font-black uppercase tracking-widest font-mono text-zinc-500 mb-4">Book Audio File Info</h4>
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5"><Clock className="h-4 w-4 text-zinc-500" /> Podcast length</span>
                  <span className={`font-mono font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>{totalListeningHours} hours</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-zinc-500" /> Pages extracted</span>
                  <span className={`font-mono font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>{book.totalPages} pages</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5"><Tag className="h-4 w-4 text-zinc-500" /> Cache size</span>
                  <span className={`font-mono font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>{book.sizeMb} MegaBytes</span>
                </div>
              </div>
            </div>

            {/* Bulleted Insights Key Takeaways */}
            <div className={`p-6 rounded-3xl border space-y-3
              ${theme === 'dark' ? 'bg-[#16161D] border-slate-800' : 'bg-indigo-50/10 border-indigo-200/40'}`}
              id="detail-takeaways-card"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
                <h4 className="text-[11px] font-black uppercase tracking-widest font-mono text-zinc-500">Key Takeaways</h4>
              </div>

              <ul className="space-y-3">
                {book.keyTakeaways.length === 0 ? (
                  <p className="text-zinc-500 text-xs italic">Analyzing insights of book chapters...</p>
                ) : (
                  book.keyTakeaways.map((task, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start text-xs text-zinc-400 leading-relaxed">
                      <CircleCheck className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                      <span>{task}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
