'use client';

import { useState, useEffect } from 'react';
import { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from '@/lib/types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CreateTaskInput | UpdateTaskInput, isEdit: boolean) => Promise<void>;
  task?: Task | null;
  existingTopics: string[];
}

export default function TaskModal({ isOpen, onClose, onSave, task, existingTopics }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Todo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.dueDate);
      setTopic(task.topic);
      setStatus(task.status);
    } else {
      setTitle('');
      setDescription('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setTopic('');
      setStatus('Todo');
    }
    setError(null);
  }, [task, isOpen, existingTopics]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }
    if (!dueDate) {
      setError('Please choose a due date.');
      return;
    }

    const finalTopic = topic.trim();
    if (!finalTopic) {
      setError('Please provide a topic / category.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (task) {
        // Edit mode: status cannot be updated (UpdateTaskInput excludes status)
        const updatePayload: UpdateTaskInput = {
          title: title.trim(),
          description: description.trim(),
          dueDate,
          topic: finalTopic,
        };
        await onSave(updatePayload, true);
      } else {
        // Create mode: CreateTaskInput
        const createPayload: CreateTaskInput = {
          title: title.trim(),
          description: description.trim(),
          dueDate,
          topic: finalTopic,
          status,
        };
        await onSave(createPayload, false);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{task ? 'Edit Task' : 'Create New Task'}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.65rem 0.85rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Prepare SDP Lab Submission"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              placeholder="Add task notes or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-row">
            {/* Topic / Category Input with Suggestions */}
            <div className="form-group">
              <label className="form-label">Topic / Category *</label>
              <input
                type="text"
                list="modal-existing-topics"
                className="form-control"
                placeholder="Type new or pick existing..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <datalist id="modal-existing-topics">
                {existingTopics.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>

              {existingTopics.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                  {existingTopics.slice(0, 5).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      style={{
                        background: topic === t ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)',
                        color: topic === t ? '#fff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '0.15rem 0.55rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                className="form-control"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Status Field: Selectable on create, fixed/read-only on edit */}
          <div className="form-group">
            <label className="form-label">Status {task ? '(Fixed)' : ''}</label>
            {task ? (
              <input
                type="text"
                className="form-control"
                value={task.status}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            ) : (
              <select
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                <option value="Todo">Todo</option>
                <option value="In-Progress">In-Progress</option>
                <option value="Complete">Complete</option>
              </select>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
