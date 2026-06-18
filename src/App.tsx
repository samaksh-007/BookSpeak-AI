/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PDFUpload from './components/PDFUpload';
import AudiobookPlayer from './components/AudiobookPlayer';
import BookDetail from './components/BookDetail';
import { Book, Bookmark, Note, VoiceSettings } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'player' | 'detail'>('library');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  // Synced local database triggers
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('bookspeak_books_db');
    return saved ? JSON.parse(saved) : [];
  });

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem('bookspeak_bookmarks_db');
    return saved ? JSON.parse(saved) : [];
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('bookspeak_notes_db');
    return saved ? JSON.parse(saved) : [];
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('bookspeak_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'dark';
  });

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voiceId: 'en-US-GuyNeural',
    speed: 1.0,
    pitch: 1.0,
    volume: 1.0,
    dialogueEnhancement: true
  });

  // Local serialization watchers
  useEffect(() => {
    localStorage.setItem('bookspeak_books_db', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('bookspeak_bookmarks_db', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('bookspeak_notes_db', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('bookspeak_theme', theme);
  }, [theme]);

  // Selected active book entity references
  const currentSelectedBook = books.find((b) => b.id === selectedBookId) || null;

  // Book modification events
  const handleBookCreated = (newBook: Book) => {
    setBooks((prev) => [newBook, ...prev]);
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    setBookmarks((prev) => prev.filter((bk) => bk.bookId !== bookId));
    setNotes((prev) => prev.filter((n) => n.bookId !== bookId));
    if (selectedBookId === bookId) {
      setSelectedBookId(null);
      setActiveTab('library');
    }
  };

  // Click shortcut play
  const handleSelectBook = (bookId: string) => {
    setSelectedBookId(bookId);
  };

  // Bookmark handlers
  const handleAddBookmark = (newBookmark: Bookmark) => {
    setBookmarks((prev) => [newBookmark, ...prev]);
  };

  const handleDeleteBookmark = (bmarkId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== bmarkId));
  };

  // Study note annotations
  const handleAddNote = (newNote: Note) => {
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  return (
    <div className={`h-screen w-screen overflow-hidden flex transition-colors duration-300
      ${theme === 'dark' ? 'bg-[#09090B] text-slate-200' : 'bg-[#FAFAFA] text-zinc-800'}`}
      id="app-root-container"
    >
      {/* Structural Sidebar Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedBookId={selectedBookId}
        isPlaying={currentSelectedBook?.isPlaying || false}
        theme={theme}
        setTheme={setTheme}
        userEmail="prosamaksh@gmail.com"
      />

      {/* Primary central view display */}
      <main className="flex-1 flex flex-col h-full overflow-hidden" id="viewport-main">
        {activeTab === 'library' && (
          <Dashboard
            books={books}
            selectedBookId={selectedBookId}
            onSelectBook={handleSelectBook}
            setActiveTab={setActiveTab}
            theme={theme}
            onDeleteBook={handleDeleteBook}
          />
        )}

        {activeTab === 'upload' && (
          <PDFUpload
            onBookCreated={handleBookCreated}
            theme={theme}
            isDemoModEnabled={books.length === 0}
            onSelectBook={handleSelectBook}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'detail' && (
          <BookDetail
            book={currentSelectedBook}
            onSelectBook={handleSelectBook}
            setActiveTab={setActiveTab}
            theme={theme}
            bookmarks={bookmarks}
            onDeleteBookmark={handleDeleteBookmark}
            notes={notes}
            onDeleteNote={handleDeleteNote}
          />
        )}

        {activeTab === 'player' && (
          <AudiobookPlayer
            book={currentSelectedBook}
            voiceSettings={voiceSettings}
            setVoiceSettings={setVoiceSettings}
            theme={theme}
            onAddBookmark={handleAddBookmark}
            bookmarks={bookmarks}
            onAddNote={handleAddNote}
            notes={notes}
          />
        )}
      </main>
    </div>
  );
}

