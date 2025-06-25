import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts';

// Define the Task type to be used throughout the app
export type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | null;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
};

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTasks(data as Task[]);
    } catch (error) {
      console.error('Error fetching tasks:', error instanceof Error ? error.message : 'Unknown error');
      setError(error instanceof Error ? error.message : 'An error occurred while fetching tasks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    fetchTasks();
  }, [user, fetchTasks]);

  const addTask = async (newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...newTask, user_id: user?.id }])
        .select();

      if (error) throw error;

      setTasks(prev => [data[0] as Task, ...prev]);
      return data[0] as Task;
    } catch (error) {
      console.error('Error adding task:', error instanceof Error ? error.message : 'Unknown error');
      setError(error instanceof Error ? error.message : 'An error occurred while adding task');
      return null;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user?.id)
        .select();

      if (error) throw error;

      setTasks(prev => prev.map(task => (task.id === id ? { ...task, ...data[0] } : task)));
      return data[0] as Task;
    } catch (error) {
      console.error('Error updating task:', error instanceof Error ? error.message : 'Unknown error');
      setError(error instanceof Error ? error.message : 'An error occurred while updating task');
      return null;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting task:', error instanceof Error ? error.message : 'Unknown error');
      setError(error instanceof Error ? error.message : 'An error occurred while deleting task');
      return false;
    }
  };

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
  };
}