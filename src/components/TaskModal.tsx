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
  const [customTopic, setCustomTopic] = useState('');
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
      // Default due date to today
      setDueDate(new Date().toISOString().split('T')[0]);
      setTopic(existingTopics.length > 0 ? existingTopics[0] : '');
      setStatus('Todo');
    }
    setCustomTopic('');
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

    const finalTopic = topic === '__new__' ? customTopic.trim() : topic.trim();
    if (!finalTopic) {
      setError('Please provide a topic.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        dueDate,
        topic: finalTopic,
        status,
      };

      await onSave(payload, Boolean(task));
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
            <div className="form-group">
              <label className="form-label">Topic / Category *</label>
              <select
                className="form-control"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              >
                {existingTopics.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
                <option value="__new__">+ Create New Topic</option>
              </select>
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

          {topic === '__new__' && (
            <div className="form-group">
              <label className="form-label">New Topic Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. University, Project, Personal"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              <option value="Todo">Todo</option>
              <option value="In-Progress">In-Progress</option>
              <option value="Complete">Complete</option>
            </select>
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
