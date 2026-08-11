'use client';

import { useState, useTransition } from 'react';
import { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from '@/lib/types';
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
  
  // Filters & Sorting state
  const [viewTab, setViewTab] = useState<'active' | 'archived'>('active');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'dueDate' | 'topic' | 'status' | 'createdAt'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [, startTransition] = useTransition();

  // Handle Save (Create / Edit)
  const handleSaveTask = async (input: CreateTaskInput | UpdateTaskInput, isEdit: boolean) => {
    if (isEdit && editingTask) {
      const updated = await updateTaskAction(editingTask.id, input);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } else {
      const created = await createTaskAction(input as CreateTaskInput);
      setTasks((prev) => [created, ...prev]);
      if (!topics.includes(created.topic)) {
        setTopics((prev) => [...prev, created.topic].sort());
      }
    }
  };

  // Handle Quick Status Change
  const handleStatusChange = (id: number, newStatus: TaskStatus) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t))
    );
    startTransition(async () => {
      await updateTaskAction(id, { status: newStatus });
    });
  };

  // Handle Archive Action (Tasks are never deleted, only archived)
  const handleArchiveTask = (id: number) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, archived: true } : t))
    );
    startTransition(async () => {
      await archiveTaskAction(id);
    });
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    // Tab filter
    if (viewTab === 'active' && t.archived) return false;
    if (viewTab === 'archived' && !t.archived) return false;

    // Topic filter
    if (selectedTopic !== 'All' && t.topic !== selectedTopic) return false;

    // Status filter
    if (selectedStatus !== 'All' && t.status !== selectedStatus) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchTopic = t.topic.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchTopic) return false;
    }

    return true;
  });

  // Sort Tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'dueDate') {
      comparison = a.dueDate.localeCompare(b.dueDate);
    } else if (sortBy === 'topic') {
      comparison = a.topic.localeCompare(b.topic);
    } else if (sortBy === 'status') {
      const statusOrder: Record<TaskStatus, number> = { 'Todo': 1, 'In-Progress': 2, 'Complete': 3 };
      comparison = statusOrder[a.status] - statusOrder[b.status];
    } else if (sortBy === 'createdAt') {
      comparison = a.createdAt.localeCompare(b.createdAt);
    }

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

      {/* Control Bar: View Tabs, Filters, Sort */}
      <div className="controls-bar">
        <div className="filter-group">
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

          {/* Filter by Topic */}
          <div className="select-wrapper">
            <span>Topic:</span>
            <select
              className="custom-select"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="All">All Topics</option>
              {topics.map((tp) => (
                <option key={tp} value={tp}>{tp}</option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div className="select-wrapper">
            <span>Status:</span>
            <select
              className="custom-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Todo">Todo</option>
              <option value="In-Progress">In-Progress</option>
              <option value="Complete">Complete</option>
            </select>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="filter-group">
          <div className="select-wrapper">
            <span>Sort by:</span>
            <select
              className="custom-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="dueDate">Due Date</option>
              <option value="topic">Topic</option>
              <option value="status">Status</option>
              <option value="createdAt">Date Created</option>
            </select>

            <button
              className="btn-icon"
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              title={`Toggle sort direction (Current: ${sortOrder.toUpperCase()})`}
            >
              {sortOrder === 'asc' ? '⬆️ Asc' : '⬇️ Desc'}
            </button>
          </div>

          {/* Search input */}
          <input
            type="text"
            className="custom-input"
            placeholder="🔍 Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '180px' }}
          />
        </div>
      </div>

      {/* Task Cards List */}
      {sortedTasks.length > 0 ? (
        <div className="task-grid">
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={(t) => {
                setEditingTask(t);
                setIsModalOpen(true);
              }}
              onArchive={handleArchiveTask}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>No tasks found</h3>
          <p style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>
            {viewTab === 'archived'
              ? 'No archived tasks match your filters.'
              : 'You have no active tasks. Click "Create Task" above to add one!'}
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
