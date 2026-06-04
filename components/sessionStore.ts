'use client';

export interface EmotionalLetter {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  studentId: string;
  createdAt: string;
  updatedAt: string;
  letters: EmotionalLetter[];
}

interface SessionDatabase {
  students: Record<string, StudentProfile>;
}

const STORAGE_KEY = 'playa-psicologica-student-profiles-v1';

function nowIso() {
  return new Date().toISOString();
}

function sanitizeStudentId(raw: string) {
  return raw.trim().toUpperCase();
}

function loadDatabase(): SessionDatabase {
  if (typeof window === 'undefined') return { students: {} };

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { students: {} };

  try {
    const parsed = JSON.parse(raw) as SessionDatabase;
    if (!parsed.students || typeof parsed.students !== 'object') {
      return { students: {} };
    }
    return parsed;
  } catch {
    return { students: {} };
  }
}

function saveDatabase(database: SessionDatabase) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
}

export function getOrCreateStudentProfile(rawStudentId: string): { profile: StudentProfile; isNew: boolean } {
  const studentId = sanitizeStudentId(rawStudentId);
  const database = loadDatabase();
  const existing = database.students[studentId];

  if (existing) {
    return { profile: existing, isNew: false };
  }

  const created = nowIso();
  const profile: StudentProfile = {
    studentId,
    createdAt: created,
    updatedAt: created,
    letters: []
  };
  database.students[studentId] = profile;
  saveDatabase(database);
  return { profile, isNew: true };
}

export function upsertEmotionalLetter(studentIdRaw: string, content: string, letterId?: string) {
  const studentId = sanitizeStudentId(studentIdRaw);
  const database = loadDatabase();
  const currentProfile = database.students[studentId];
  if (!currentProfile) {
    throw new Error('Student profile does not exist.');
  }

  const timestamp = nowIso();
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new Error('Letter content cannot be empty.');
  }

  let nextLetters = [...currentProfile.letters];
  if (letterId) {
    nextLetters = nextLetters.map((letter) =>
      letter.id === letterId ? { ...letter, content: trimmedContent, updatedAt: timestamp } : letter
    );
  } else {
    nextLetters.unshift({
      id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      content: trimmedContent,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  const updatedProfile: StudentProfile = {
    ...currentProfile,
    letters: nextLetters,
    updatedAt: timestamp
  };
  database.students[studentId] = updatedProfile;
  saveDatabase(database);
  return updatedProfile;
}

export function getStudentProfile(studentIdRaw: string) {
  const studentId = sanitizeStudentId(studentIdRaw);
  const database = loadDatabase();
  return database.students[studentId] ?? null;
}
