import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from './types';

const DB_PATH = path.join(process.cwd(), 'todos.db');

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    initDatabase(dbInstance);
  }
  return dbInstance;
}

function initDatabase(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      dueDate TEXT NOT NULL,
      topic TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Todo', 'In-Progress', 'Complete')),
      archived INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export interface TaskFilterOptions {
  archived?: boolean;
  status?: TaskStatus | 'All';
  topic?: string;
  sortBy?: 'dueDate' | 'topic' | 'status' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export function getTasks(options: TaskFilterOptions = {}): Task[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (options.archived !== undefined) {
    conditions.push('archived = ?');
    params.push(options.archived ? 1 : 0);
  }

  if (options.status && options.status !== 'All') {
    conditions.push('status = ?');
    params.push(options.status);
  }

  if (options.topic && options.topic !== 'All') {
    conditions.push('topic = ?');
    params.push(options.topic);
  }

  let sql = 'SELECT * FROM tasks';
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  const validSortColumns = ['dueDate', 'topic', 'status', 'createdAt'];
  const sortBy = options.sortBy && validSortColumns.includes(options.sortBy) ? options.sortBy : 'createdAt';
  const sortOrder = options.sortOrder === 'asc' ? 'ASC' : 'DESC';

  sql += ` ORDER BY ${sortBy} ${sortOrder}`;

  const rows = db.prepare(sql).all(...params) as any[];

  return rows.map((row) => ({
    id: Number(row.id),
    title: String(row.title),
    description: String(row.description || ''),
    dueDate: String(row.dueDate),
    topic: String(row.topic),
    status: row.status as TaskStatus,
    archived: Boolean(row.archived),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }));
}

export function getTaskById(id: number): Task | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
  if (!row) return null;

  return {
    id: Number(row.id),
    title: String(row.title),
    description: String(row.description || ''),
    dueDate: String(row.dueDate),
    topic: String(row.topic),
    status: row.status as TaskStatus,
    archived: Boolean(row.archived),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

export function createTask(input: CreateTaskInput): Task {
  const db = getDb();
  const status: TaskStatus = input.status || 'Todo';
  const description = input.description || '';

  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, dueDate, topic, status, archived, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
  `);

  const result = stmt.run(input.title, description, input.dueDate, input.topic, status);
  const created = getTaskById(Number(result.lastInsertRowid));
  if (!created) {
    throw new Error('Failed to retrieve newly created task');
  }
  return created;
}

export function updateTask(id: number, input: UpdateTaskInput): Task {
  const db = getDb();
  const existing = getTaskById(id);
  if (!existing) {
    throw new Error(`Task with id ${id} not found`);
  }

  const title = input.title !== undefined ? input.title : existing.title;
  const description = input.description !== undefined ? input.description : existing.description;
  const dueDate = input.dueDate !== undefined ? input.dueDate : existing.dueDate;
  const topic = input.topic !== undefined ? input.topic : existing.topic;

  const stmt = db.prepare(`
    UPDATE tasks
    SET title = ?, description = ?, dueDate = ?, topic = ?, updatedAt = datetime('now')
    WHERE id = ?
  `);

  stmt.run(title, description, dueDate, topic, id);
  const updated = getTaskById(id);
  if (!updated) {
    throw new Error('Failed to retrieve updated task');
  }
  return updated;
}

export function archiveTask(id: number): void {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE tasks
    SET archived = 1, updatedAt = datetime('now')
    WHERE id = ?
  `);
  stmt.run(id);
}

export function getAllTopics(): string[] {
  const db = getDb();
  const rows = db.prepare("SELECT DISTINCT topic FROM tasks WHERE topic IS NOT NULL AND topic != '' ORDER BY topic ASC").all() as any[];
  return rows.map((r) => String(r.topic));
}
