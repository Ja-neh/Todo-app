import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

/**
 * Derived read-time function to check if a task is overdue.
 * (Overdue is NEVER stored in the database, it is derived at read-time)
 */
function isTaskOverdue(task, referenceDate) {
  if (!task.dueDate || task.status === 'Complete') {
    return false;
  }
  
  if (referenceDate) {
    return task.dueDate < referenceDate;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  return task.dueDate < todayStr;
}

describe('Task Management Tests (In-Memory Database)', () => {
  let db;

  beforeEach(() => {
    // Isolated in-memory database - does NOT touch the real database file
    db = new DatabaseSync(':memory:');
    
    // Initialize schema
    db.exec(`
      CREATE TABLE tasks (
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
  });

  it('1. should create a new task successfully using inserts', () => {
    const insertStmt = db.prepare(`
      INSERT INTO tasks (title, description, dueDate, topic, status, archived)
      VALUES (?, ?, ?, ?, ?, 0)
    `);

    const result = insertStmt.run(
      'Finish SDP Lab Assignment',
      'Complete local-first todo app with SQLite',
      '2026-08-15',
      'University',
      'Todo'
    );

    assert.equal(result.lastInsertRowid, 1);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(1);
    assert.ok(task, 'Task should exist in in-memory database');
    assert.equal(task.id, 1);
    assert.equal(task.title, 'Finish SDP Lab Assignment');
    assert.equal(task.description, 'Complete local-first todo app with SQLite');
    assert.equal(task.dueDate, '2026-08-15');
    assert.equal(task.topic, 'University');
    assert.equal(task.status, 'Todo');
    assert.equal(task.archived, 0);
  });

  it('2. should update a task (title, description, dueDate, topic) while keeping status fixed', () => {
    // Initial insert
    db.prepare(`
      INSERT INTO tasks (title, description, dueDate, topic, status, archived)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run('Draft Report', 'Initial notes', '2026-08-12', 'Work', 'In-Progress');

    // Update task details (title, description, dueDate, topic)
    const updateStmt = db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, dueDate = ?, topic = ?, updatedAt = datetime('now')
      WHERE id = ?
    `);

    updateStmt.run('Final Report', 'Polished submission document', '2026-08-20', 'Work & Studies', 1);

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(1);
    assert.equal(updatedTask.title, 'Final Report');
    assert.equal(updatedTask.description, 'Polished submission document');
    assert.equal(updatedTask.dueDate, '2026-08-20');
    assert.equal(updatedTask.topic, 'Work & Studies');
    // Status must remain fixed at 'In-Progress'
    assert.equal(updatedTask.status, 'In-Progress');
  });

  it('3. should archive a task so it remains viewable with archived = 1', () => {
    db.prepare(`
      INSERT INTO tasks (title, description, dueDate, topic, status, archived)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run('Submit Project Proposal', 'Proposal document', '2026-08-10', 'Project', 'Complete');

    // Archive task
    db.prepare('UPDATE tasks SET archived = 1, updatedAt = datetime(' + "'now'" + ') WHERE id = ?').run(1);

    const archivedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(1);
    assert.ok(archivedTask, 'Task still exists in database and was not deleted');
    assert.equal(archivedTask.archived, 1, 'Task archived flag should be 1');

    // Query active tasks only (should be empty)
    const activeTasks = db.prepare('SELECT * FROM tasks WHERE archived = 0').all();
    assert.equal(activeTasks.length, 0);

    // Query archived tasks only (should contain the task)
    const archivedTasks = db.prepare('SELECT * FROM tasks WHERE archived = 1').all();
    assert.equal(archivedTasks.length, 1);
    assert.equal(archivedTasks[0].title, 'Submit Project Proposal');
  });

  it('4. should unarchive a task so it is restored to active tasks (archived = 0)', () => {
    // Insert an already archived task
    db.prepare(`
      INSERT INTO tasks (title, description, dueDate, topic, status, archived)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run('Archived Research Task', 'Archived notes', '2026-08-10', 'Research', 'Todo');

    let task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(1);
    assert.equal(task.archived, 1);

    // Unarchive task
    db.prepare('UPDATE tasks SET archived = 0, updatedAt = datetime(' + "'now'" + ') WHERE id = ?').run(1);

    task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(1);
    assert.equal(task.archived, 0, 'Task should now be unarchived (archived = 0)');

    // Active tasks query should now return the restored task
    const activeTasks = db.prepare('SELECT * FROM tasks WHERE archived = 0').all();
    assert.equal(activeTasks.length, 1);
    assert.equal(activeTasks[0].title, 'Archived Research Task');
  });

  it('5. should check overdue derivation at read-time without storing in database', () => {
    // Insert tasks with past due date, future due date, and past due date with Complete status
    const insertStmt = db.prepare(`
      INSERT INTO tasks (title, description, dueDate, topic, status, archived)
      VALUES (?, ?, ?, ?, ?, 0)
    `);

    insertStmt.run('Overdue Todo Task', 'Past due date and Todo status', '2026-08-01', 'Personal', 'Todo');
    insertStmt.run('Overdue In-Progress Task', 'Past due date and In-Progress status', '2026-08-05', 'Work', 'In-Progress');
    insertStmt.run('Completed Past Task', 'Past due date but Complete status', '2026-08-01', 'Work', 'Complete');
    insertStmt.run('Future Task', 'Future due date', '2026-08-30', 'Personal', 'Todo');

    const tasks = db.prepare('SELECT * FROM tasks').all();
    const referenceToday = '2026-08-11';

    // Verify database columns do NOT contain 'overdue'
    assert.equal(tasks[0].overdue, undefined, 'Database must not have an overdue column');

    // Check read-time derived overdue tag
    const task1Overdue = isTaskOverdue(tasks[0], referenceToday);
    const task2Overdue = isTaskOverdue(tasks[1], referenceToday);
    const task3Overdue = isTaskOverdue(tasks[2], referenceToday);
    const task4Overdue = isTaskOverdue(tasks[3], referenceToday);

    assert.equal(task1Overdue, true, 'Todo task with past due date must be tagged OVERDUE');
    assert.equal(task2Overdue, true, 'In-Progress task with past due date must be tagged OVERDUE');
    assert.equal(task3Overdue, false, 'Complete task with past due date must NOT be tagged overdue');
    assert.equal(task4Overdue, false, 'Future task must NOT be tagged overdue');
  });
});
