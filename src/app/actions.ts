'use server';

import { revalidatePath } from 'next/cache';
import { createTask, updateTask, archiveTask, getTasks, getAllTopics, TaskFilterOptions } from '@/lib/db';
import { CreateTaskInput, UpdateTaskInput, TaskStatus } from '@/lib/types';

export async function fetchTasksAction(options?: TaskFilterOptions) {
  return getTasks(options);
}

export async function fetchTopicsAction() {
  return getAllTopics();
}

export async function createTaskAction(input: CreateTaskInput) {
  if (!input.title || !input.title.trim()) {
    throw new Error('Task title is required.');
  }
  if (!input.dueDate) {
    throw new Error('Due date is required.');
  }
  if (!input.topic || !input.topic.trim()) {
    throw new Error('Topic is required.');
  }

  const newTask = createTask({
    title: input.title.trim(),
    description: input.description?.trim() || '',
    dueDate: input.dueDate,
    topic: input.topic.trim(),
    status: input.status || 'Todo',
  });

  revalidatePath('/');
  return newTask;
}

export async function updateTaskAction(id: number, input: UpdateTaskInput) {
  if (input.title !== undefined && !input.title.trim()) {
    throw new Error('Task title cannot be empty.');
  }
  if (input.topic !== undefined && !input.topic.trim()) {
    throw new Error('Topic cannot be empty.');
  }

  const updated = updateTask(id, {
    ...input,
    title: input.title?.trim(),
    description: input.description?.trim(),
    topic: input.topic?.trim(),
  });

  revalidatePath('/');
  return updated;
}

export async function archiveTaskAction(id: number) {
  archiveTask(id);
  revalidatePath('/');
}
