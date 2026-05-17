import * as SQLite from 'expo-sqlite';

export interface Note {
  id?: number;
  title: string;
  content: string;
  is_pinned: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

let db: SQLite.SQLiteDatabase;

export const initDatabase = async () => {
  db = await SQLite.openDatabaseAsync('notes.db');
  
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_pinned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Database initialized');
};

export const getNotes = async (searchQuery: string = ''): Promise<Note[]> => {
  if (searchQuery) {
    return await db.getAllAsync<Note>(
      'SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY is_pinned DESC, updated_at DESC',
      [`%${searchQuery}%`, `%${searchQuery}%`]
    );
  }
  return await db.getAllAsync<Note>('SELECT * FROM notes ORDER BY is_pinned DESC, updated_at DESC');
};

export const addNote = async (title: string, content: string): Promise<number> => {
  const result = await db.runAsync(
    'INSERT INTO notes (title, content, created_at, updated_at) VALUES (?, ?, DATETIME("now"), DATETIME("now"))',
    [title, content]
  );
  return result.lastInsertRowId;
};

export const updateNote = async (id: number, title: string, content: string): Promise<void> => {
  await db.runAsync(
    'UPDATE notes SET title = ?, content = ?, updated_at = DATETIME("now") WHERE id = ?',
    [title, content, id]
  );
};

export const deleteNote = async (id: number): Promise<void> => {
  await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
};

export const togglePin = async (id: number, currentStatus: number): Promise<void> => {
  await db.runAsync('UPDATE notes SET is_pinned = ? WHERE id = ?', [currentStatus === 1 ? 0 : 1, id]);
};
