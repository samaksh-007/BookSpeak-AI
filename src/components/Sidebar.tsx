/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Library, UploadCloud, PlayCircle, BookOpen, User, BookMarked, Speaker, Moon, Sun } from 'lucide-react';

interface SidebarProps {
  activeTab: 'library' | 'upload' | 'player' | 'detail';
  setActiveTab: (tab: 'library' | 'upload' | 'player' | 'detail') => void;
  selectedBookId: string | null;
  isPlaying: boolean;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  userEmail?: string;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  selectedBookId,
  isPlaying,
  theme,
  setTheme,
  userEmail = 'prosamaksh@gmail.com'
}: SidebarProps) {
  const menuItems = [
    { id: 'library', label: 'My Library', icon: Library, disabled: false },
    { id: 'upload', label: 'Upload Portal', icon: UploadCloud, disabled: false },
    { id: 'detail', label: 'Book Details', icon: BookOpen, disabled: !selectedBookId },
    { id: 'player', label: 'Now Playing', icon: PlayCircle, disabled: !selectedBookId },
  ] as const;

  return (
    <aside className={`w-64 border-r transition-colors duration-300 flex flex-col justify-between select-none
      ${theme === 'dark' 
        ? 'bg-[#0F0F12] border-slate-800 text-slate-200' 
        : 'bg-white border-zinc-200 text-zinc-800'
      }`}
      id="app-sidebar"
    >
      <div className="flex flex-col flex-1 py-6 px-4">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 mb-8" id="sidebar-logo-container">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <Speaker className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold tracking-tight text-lg leading-tight bg-gradient-to-r from-indigo-400 to-indigo-500 bg-clip-text text-transparent">
              BookSpeak AI
            </h1>
            <span className="text-[10px] text-zinc-450 font-mono tracking-wider uppercase">Free Audiobook Studio</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5" id="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isDisabled = item.disabled;

            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                disabled={isDisabled}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group text-left
                  ${isActive 
                    ? 'bg-indigo-600/10 text-indigo-400 shadow-sm border border-indigo-500/10' 
                    : isDisabled
                      ? 'opacity-40 cursor-not-allowed'
                      : theme === 'dark'
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 border border-transparent'
                  }`}
              >
                <Icon className={`h-4.5 w-4.5 transition-transform duration-200 
                  ${isActive ? 'text-indigo-400' : 'text-zinc-400 group-hover:scale-105'}
                `} />
                <span>{item.label}</span>
                {item.id === 'player' && isPlaying && (
                  <span className="ml-auto flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-550"></span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Utility Section */}
      <div className={`p-4 border-t flex flex-col gap-3 ${theme === 'dark' ? 'border-slate-800' : 'border-zinc-200'}`} id="sidebar-footer">
        {/* Dark/Light Toggle */}
        <div className="flex items-center justify-between px-2 text-xs">
         <a href="https://digitalheroesco.com/"> <span className="text-zinc-400"> DIGITAL HEROES</span></a>
          <button
            id="theme-toggler"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-1.5 rounded-lg border flex items-center gap-1.5 transition-all
              ${theme === 'dark'
                ? 'bg-zinc-900 border-zinc-800 text-zinc-350 hover:text-white'
                : 'bg-zinc-100 border-zinc-200 text-zinc-750 hover:text-zinc-900'
              }`}
          >
            {theme === 'dark' ? (
              <>
                <Moon className="h-3.5 w-3.5 text-indigo-400" />
                <span className="text-[10px] pr-1">Dark</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-[10px] pr-1">Light</span>
              </>
            )}
          </button>
        </div>

        {/* User Account Showcase */}
        <div className={`flex items-center gap-3 p-2.5 rounded-xl border
          ${theme === 'dark' ? 'bg-[#16161D]/50 border-slate-800' : 'bg-zinc-50 border-zinc-150'}`}
          id="sidebar-user-card"
        >
          <div className="h-8 w-8 rounded-full bg-zinc-700/65 flex items-center justify-center overflow-hidden border border-slate-850">
            <User className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="truncate flex-1">
            <p className="text-xs font-semibold truncate leading-tight">Subscriber Account</p>
            <p className="text-[10px] text-zinc-400 font-mono truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
