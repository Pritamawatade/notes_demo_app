import * as SQLite from 'expo-sqlite';

export interface Note {
  id?: number;
  title: string;
  content: string;
  is_pinned: number; // 0 or 1
  reminder_time: string | null; // ISO string
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id?: number;
  text: string;
  is_completed: number; // 0 or 1
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  created_at: string;
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
      reminder_time TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Migrations
  try {
    await db.execAsync('ALTER TABLE notes ADD COLUMN reminder_time TEXT;');
  } catch (e) {}
  
  console.log('Database initialized');
};

// ... Note CRUD ...

export const getNotes = async (searchQuery: string = ''): Promise<Note[]> => {
  if (searchQuery) {
    return await db.getAllAsync<Note>(
      'SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY is_pinned DESC, updated_at DESC',
      [`%${searchQuery}%`, `%${searchQuery}%`]
    );
  }
  return await db.getAllAsync<Note>('SELECT * FROM notes ORDER BY is_pinned DESC, updated_at DESC');
};

export const addNote = async (title: string, content: string, reminderTime: string | null = null): Promise<number> => {
  const result = await db.runAsync(
    'INSERT INTO notes (title, content, reminder_time, created_at, updated_at) VALUES (?, ?, ?, DATETIME("now"), DATETIME("now"))',
    [title, content, reminderTime]
  );
  return result.lastInsertRowId;
};

export const updateNote = async (id: number, title: string, content: string, reminderTime: string | null = null): Promise<void> => {
  await db.runAsync(
    'UPDATE notes SET title = ?, content = ?, reminder_time = ?, updated_at = DATETIME("now") WHERE id = ?',
    [title, content, reminderTime, id]
  );
};

export const deleteNote = async (id: number): Promise<void> => {
  await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
};

export const togglePin = async (id: number, currentStatus: number): Promise<void> => {
  await db.runAsync('UPDATE notes SET is_pinned = ? WHERE id = ?', [currentStatus === 1 ? 0 : 1, id]);
};

// Todo CRUD
export const getTodos = async (type: string): Promise<Todo[]> => {
  return await db.getAllAsync<Todo>(
    'SELECT * FROM todos WHERE type = ? ORDER BY created_at DESC',
    [type]
  );
};

export const addTodo = async (text: string, type: string): Promise<number> => {
  const result = await db.runAsync(
    'INSERT INTO todos (text, type, created_at) VALUES (?, ?, DATETIME("now"))',
    [text, type]
  );
  return result.lastInsertRowId;
};

export const updateTodo = async (id: number, text: string): Promise<void> => {
  await db.runAsync('UPDATE todos SET text = ? WHERE id = ?', [text, id]);
};

export const toggleTodo = async (id: number, currentStatus: number): Promise<void> => {
  await db.runAsync('UPDATE todos SET is_completed = ? WHERE id = ?', [currentStatus === 1 ? 0 : 1, id]);
};

export const deleteTodo = async (id: number): Promise<void> => {
  await db.runAsync('DELETE FROM todos WHERE id = ?', [id]);
};
