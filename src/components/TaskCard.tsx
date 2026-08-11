'use client';

import { Task, TaskStatus, isTaskOverdue } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onArchive: (id: number) => void;
}

export default function TaskCard({ task, onEdit, onArchive }: TaskCardProps) {
  const overdue = isTaskOverdue(task);

  const getStatusBadgeClass = (status: TaskStatus) => {
    switch (status) {
      case 'Todo': return 'status-todo';
      case 'In-Progress': return 'status-progress';
      case 'Complete': return 'status-complete';
      default: return '';
    }
  };

  return (
    <div className={`task-card ${overdue ? 'is-overdue' : ''} ${task.archived ? 'is-archived' : ''}`}>
      <div className="task-header">
        <h3 className="task-title" style={{ textDecoration: task.status === 'Complete' ? 'line-through' : 'none', opacity: task.status === 'Complete' ? 0.7 : 1 }}>
          {task.title}
        </h3>
        
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {/* Fixed Status Badge (Status cannot be changed/updated) */}
          <span className={`badge ${getStatusBadgeClass(task.status)}`}>
            {task.status}
          </span>
        </div>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-meta">
        <div className="meta-badges">
          <span className="badge topic-badge">
            🏷️ {task.topic}
          </span>

          {/* Derived Overdue Indicator - NOT stored in DB */}
          {overdue && (
            <span className="badge overdue-badge" title="Derived at read-time: Due date has passed and task is not complete">
              ⚠️ OVERDUE
            </span>
          )}

          <span className="due-date-text">
            📅 Due: {task.dueDate}
          </span>
        </div>

        <div className="task-actions">
          {!task.archived && (
            <button className="btn-icon" onClick={() => onEdit(task)} title="Edit Task">
              ✏️ Edit
            </button>
          )}

          {!task.archived ? (
            <button className="btn-icon btn-archive" onClick={() => onArchive(task.id)} title="Archive Task (remains viewable)">
              📥 Archive
            </button>
          ) : (
            <span className="badge" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' }}>
              Archived
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
