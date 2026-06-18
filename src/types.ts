/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Chapter {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
  summary: string;
  durationSeconds: number;
  text: string;
  order: number;
}

export interface CharacterDialogue {
  characterName: string;
  speakingStyle: string;
  voiceStyle: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  listeningSeconds: number;
  uploadDate: string;
  coverColor: string;
  coverPattern: string;
  currentChapterIndex: number;
  currentPositionSeconds: number;
  sizeMb: number;
  status: 'uploading' | 'analyzing' | 'ready' | 'processing' | 'error';
  progress: number;
  summary: string;
  keyTakeaways: string[];
  characters: CharacterDialogue[];
  chapters: Chapter[];
  isPlaying?: boolean;
}

export interface Bookmark {
  id: string;
  bookId: string;
  chapterIndex: number;
  positionSeconds: number;
  label: string;
  timestamp: string;
}

export interface Note {
  id: string;
  bookId: string;
  chapterIndex: number;
  positionSeconds: number;
  text: string;
  timestamp: string;
}

export interface Voice {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  style: string;
  locale: string;
  label: string;
}

export interface VoiceSettings {
  voiceId: string;
  speed: number; // 0.5 to 3.0
  pitch: number; // 0.5 to 2.0
  volume: number; // 0 to 1
  dialogueEnhancement: boolean;
  sleepTimerDuration?: number; // duration in seconds
  sleepTimerStartedAt?: number; // timestamp in ms
}
