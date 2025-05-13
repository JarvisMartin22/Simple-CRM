
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define the Task types
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  relatedCompany?: string;
  relatedContact?: string;
  relatedDeal?: string;
}

interface TasksContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updatedTask: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getTask: (id: string) => Task | undefined;
}

export const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Follow up with client',
      description: 'Send email about new product features',
      status: 'pending',
      priority: 'high',
      dueDate: '2025-05-20',
      assignedTo: 'John Doe',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      relatedCompany: 'Acme Inc',
    },
    {
      id: '2',
      title: 'Prepare quarterly report',
      description: 'Compile sales data for Q2',
      status: 'in-progress',
      priority: 'medium',
      dueDate: '2025-05-25',
      assignedTo: 'Jane Smith',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Schedule demo call',
      description: 'Demo new features to potential client',
      status: 'pending',
      priority: 'medium',
      dueDate: '2025-06-01',
      assignedTo: 'John Doe',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      relatedCompany: 'XYZ Corp',
    }
  ]);

  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const updateTask = (id: string, updatedTask: Partial<Task>) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id
          ? { ...task, ...updatedTask, updatedAt: new Date().toISOString() }
          : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
  };

  const getTask = (id: string) => {
    return tasks.find((task) => task.id === id);
  };

  return (
    <TasksContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        getTask,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};
