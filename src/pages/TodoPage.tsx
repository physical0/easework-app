import { useState } from 'react';
import TaskForm from '../components/TodoList/TaskForm';
import TaskList from '../components/TodoList/TaskList';
import { useTasks } from '../hooks/useTasks';
import type { Task } from '../hooks/useTasks';
import { useAuth } from '../contexts/useAuth';

export default function TodoPage() {
  const { tasks, loading, error, addTask, updateTask, deleteTask } = useTasks();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  const handleAddTask = async (newTask: Partial<Task>) => {
    await addTask(newTask as Task);
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  if (!user) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold">Please sign in to manage your tasks</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">To-Do List</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
        <TaskForm onSubmit={handleAddTask} />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Tasks</h2>
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'in_progress' | 'completed')}
              className="rounded border-gray-300 text-sm"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading tasks...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
        <TaskList
          tasks={filteredTasks}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
        />
      )}
    </div>
  );
}