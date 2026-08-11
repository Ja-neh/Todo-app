export type TaskStatus = 'Todo' | 'In-Progress' | 'Complete';

export interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: string; // Stored as YYYY-MM-DD
  topic: string;
  status: TaskStatus;
  archived: boolean; // 0 or 1 in DB, converted to boolean
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate: string;
  topic: string;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: string;
  topic?: string;
}

/**
 * Derived read-time function to check if a task is overdue.
 * Overdue is NOT stored in the database.
 * A task is overdue if:
 * 1. It has a due date.
 * 2. Its status is NOT 'Complete'.
 * 3. Its due date is strictly before today's date (YYYY-MM-DD).
 */
export function isTaskOverdue(task: Task, referenceDate?: string): boolean {
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
