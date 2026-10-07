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
  sort_order: number;
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  updated_at: string;
}

export interface CustomQuote {
  id?: number;
  text: string;
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS custom_quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Migrations
  try {
    await db.execAsync('ALTER TABLE notes ADD COLUMN reminder_time TEXT;');
  } catch (e) {}
  try {
    await db.execAsync('ALTER TABLE todos ADD COLUMN sort_order INTEGER DEFAULT 0;');
  } catch (e) {}
  // Backfill sort_order for pre-existing todos so the current
  // newest-first order is preserved (rank within each type).
  try {
    await db.execAsync(`
      UPDATE todos SET sort_order = (
        SELECT COUNT(*) FROM todos t2
        WHERE t2.type = todos.type
          AND (t2.created_at > todos.created_at
            OR (t2.created_at = todos.created_at AND t2.id > todos.id))
      )
      WHERE sort_order IS NULL OR sort_order = 0;
    `);
  } catch (e) {
    console.warn('Failed to backfill todo sort_order', e);
  }
  
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
    'SELECT * FROM todos WHERE type = ? ORDER BY sort_order ASC, created_at DESC, id DESC',
    [type]
  );
};

export const addTodo = async (text: string, type: string): Promise<number> => {
  // Prepend new tasks at the top (matches the previous newest-first order).
  const row = await db.getFirstAsync<{ m: number | null }>(
    'SELECT MIN(sort_order) as m FROM todos WHERE type = ?',
    [type]
  );
  const nextOrder = (row?.m ?? 1) - 1;
  const result = await db.runAsync(
    'INSERT INTO todos (text, type, created_at, sort_order) VALUES (?, ?, DATETIME("now"), ?)',
    [text, type, nextOrder]
  );
  return result.lastInsertRowId;
};

/** Persist a new manual order for one section (ids in top-to-bottom order). */
export const setTodoOrder = async (orderedIds: number[]): Promise<void> => {
  if (orderedIds.length === 0) return;
  // Single transaction so a half-written order can never stick.
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.runAsync('UPDATE todos SET sort_order = ? WHERE id = ?', [i, orderedIds[i]]);
    }
  });
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

// ---- Profile (single row, id = 1) ----

export const getProfile = async (): Promise<UserProfile> => {
  const row = await db.getFirstAsync<{ first_name: string; last_name: string; updated_at: string }>(
    'SELECT first_name, last_name, updated_at FROM profile WHERE id = 1'
  );
  if (!row) {
    return { first_name: '', last_name: '', updated_at: new Date().toISOString() };
  }
  return row;
};

export const saveProfile = async (firstName: string, lastName: string): Promise<void> => {
  await db.runAsync(
    `INSERT INTO profile (id, first_name, last_name, updated_at)
     VALUES (1, ?, ?, DATETIME("now"))
     ON CONFLICT(id) DO UPDATE SET first_name = excluded.first_name, last_name = excluded.last_name, updated_at = DATETIME("now")`,
    [firstName.trim(), lastName.trim()]
  );
};

export const getDisplayName = async (): Promise<string> => {
  const profile = await getProfile();
  return [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
};

// ---- Custom motivational quotes ----

export const getCustomQuotes = async (): Promise<CustomQuote[]> => {
  return await db.getAllAsync<CustomQuote>('SELECT * FROM custom_quotes ORDER BY created_at DESC');
};

export const addCustomQuote = async (text: string): Promise<number> => {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Quote text cannot be empty');
  const result = await db.runAsync(
    'INSERT INTO custom_quotes (text, created_at) VALUES (?, DATETIME("now"))',
    [trimmed]
  );
  return result.lastInsertRowId;
};

export const deleteCustomQuote = async (id: number): Promise<void> => {
  await db.runAsync('DELETE FROM custom_quotes WHERE id = ?', [id]);
};

export const updateCustomQuote = async (id: number, text: string): Promise<void> => {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Quote text cannot be empty');
  await db.runAsync('UPDATE custom_quotes SET text = ? WHERE id = ?', [trimmed, id]);
};
