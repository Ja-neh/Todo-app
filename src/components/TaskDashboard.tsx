'use client';

import { useState } from 'react';
import { Task, CreateTaskInput, UpdateTaskInput } from '@/lib/types';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { createTaskAction, updateTaskAction, archiveTaskAction } from '@/app/actions';

interface TaskDashboardProps {
  initialTasks: Task[];
  initialTopics: string[];
}

export default function TaskDashboard({ initialTasks, initialTopics }: TaskDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [topics, setTopics] = useState<string[]>(initialTopics);
  
  // View tab: Active vs Archived
  const [viewTab, setViewTab] = useState<'active' | 'archived'>('active');

  // Due Date filtering & sorting
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Handle Save (Create / Edit)
  const handleSaveTask = async (input: CreateTaskInput | UpdateTaskInput, isEdit: boolean) => {
    if (isEdit && editingTask) {
      const updated = await updateTaskAction(editingTask.id, input);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (updated.topic && !topics.includes(updated.topic)) {
        setTopics((prev) => [...prev, updated.topic].sort());
      }
    } else {
      const created = await createTaskAction(input as CreateTaskInput);
      setTasks((prev) => [created, ...prev]);
      if (!topics.includes(created.topic)) {
        setTopics((prev) => [...prev, created.topic].sort());
      }
    }
  };

  // Handle Archive Action (Tasks are never deleted, only archived)
  const handleArchiveTask = async (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, archived: true } : t))
    );
    await archiveTaskAction(id);
  };

  // Filter and Sort by Due Date
  const displayedTasks = tasks
    .filter((t) => {
      // Tab filter
      if (viewTab === 'active' && t.archived) return false;
      if (viewTab === 'archived' && !t.archived) return false;

      // Filter by specific selected date
      if (selectedDate && t.dueDate !== selectedDate) return false;

      return true;
    })
    .sort((a, b) => {
      const comparison = a.dueDate.localeCompare(b.dueDate);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const activeCount = tasks.filter((t) => !t.archived).length;
  const archivedCount = tasks.filter((t) => t.archived).length;

  return (
    <main className="container">
      {/* Top Header */}
      <header className="header">
        <div className="title-group">
          <div className="app-icon">
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
          </div>
          <div>
            <h1 className="app-title">Task Master</h1>
            <p className="subtitle">Local-first Todo & Workspace Manager</p>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
        >
          <span>＋</span> Create Task
        </button>
      </header>

      {/* Control Bar: View Tabs & Due Date Controls */}
      <div className="controls-bar">
        {/* Active vs Archived View Tabs */}
        <div className="tabs">
          <button
            className={`tab-btn ${viewTab === 'active' ? 'active' : ''}`}
            onClick={() => setViewTab('active')}
          >
            Active ({activeCount})
          </button>
          <button
            className={`tab-btn ${viewTab === 'archived' ? 'active' : ''}`}
            onClick={() => setViewTab('archived')}
          >
            Archived ({archivedCount})
          </button>
        </div>

        {/* Due Date Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {/* Specific Date Filter */}
          <div className="select-wrapper">
            <span>Date:</span>
            <input
              type="date"
              className="custom-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              title="Filter tasks by a specific date"
            />
            {selectedDate && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedDate('')}
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
              >
                Clear Date
              </button>
            )}
          </div>

          {/* Due Date Sorting Order */}
          <div className="select-wrapper">
            <span>Sort Due Date:</span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              title="Toggle Ascending / Descending order"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {sortOrder === 'asc' ? '⬆️ Earliest First' : '⬇️ Latest First'}
            </button>
          </div>
        </div>
      </div>

      {/* Task Cards List */}
      {displayedTasks.length > 0 ? (
        <div className="task-grid">
          {displayedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={(t) => {
                setEditingTask(t);
                setIsModalOpen(true);
              }}
              onArchive={handleArchiveTask}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No tasks found</h3>
          <p style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>
            {selectedDate
              ? `No ${viewTab} tasks found for ${selectedDate}.`
              : viewTab === 'archived'
              ? 'No archived tasks yet.'
              : 'No active tasks. Click "Create Task" above to add one!'}
          </p>
        </div>
      )}

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        existingTopics={topics}
      />
    </main>
  );
}
