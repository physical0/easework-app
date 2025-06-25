import { useState } from 'react';
import type { Task } from '../../hooks/useTasks';
import TaskForm from './TaskForm';

type TaskListProps = {
  tasks: Task[];
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<Task | null>;
  onDeleteTask: (id: string) => Promise<boolean>;
};

export default function TaskList({ tasks, onUpdateTask, onDeleteTask }: TaskListProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const handleUpdateTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingTaskId) return;
    await onUpdateTask(editingTaskId, task);
    setEditingTaskId(null);
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  if (tasks.length === 0) {
    return <div className="text-center py-8 text-gray-500">No tasks yet. Add your first task!</div>;
  }

  return (
    <div className="space-y-4">
      {editingTaskId && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Edit Task</h3>
          <TaskForm
            onSubmit={handleUpdateTask}
            initialData={tasks.find(task => task.id === editingTaskId)}
            isEditing={true}
          />
          <button
            onClick={() => setEditingTaskId(null)}
            className="mt-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-4 bg-white rounded-lg shadow-sm border-l-4 ${task.status === 'completed' ? 'border-green-500 opacity-75' : 'border-blue-500'}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className={`text-lg font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="mt-1 text-gray-600">{task.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {task.due_date && (
                    <span className="text-sm text-gray-500">
                      Due: {formatDate(task.due_date)}
                    </span>
                  )}
                  {task.priority && (
                    <span className={`text-sm ${getPriorityColor(task.priority)}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(task.status)}`}>
                    {task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingTaskId(task.id)}
                  className="text-blue-600 hover:text-blue-800"
                  aria-label="Edit task"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="text-red-600 hover:text-red-800"
                  aria-label="Delete task"
                >
                  Delete
                </button>
              </div>
            </div>
            {task.status !== 'completed' && (
              <button
                onClick={async () => {
                  try {
                    await onUpdateTask(task.id, { status: 'completed' });
                  } catch (error) {
                    console.error('Failed to mark task as completed:', error);
                  }
                }}
                className="mt-2 text-sm text-green-600 hover:text-green-800"
              >
                Mark as Completed
              </button>
            )}
            {task.status === 'completed' && (
              <button
                onClick={async () => {
                  try {
                    await onUpdateTask(task.id, { status: 'pending' });
                  } catch (error) {
                    console.error('Failed to mark task as pending:', error);
                  }
                }}
                className="mt-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Mark as Pending
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}