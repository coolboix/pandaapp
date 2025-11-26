export type UserID = 'userA' | 'userB';
export type Assignee = UserID | 'shared';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface UserProfile {
  id: UserID;
  name: string;
  themeColor: string; // Tailwind color prefix, e.g., 'teal'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO Date string
  status: TaskStatus;
  assignee: Assignee;
  color: string; // Hex or Tailwind class
  createdAt: number;
  isDeleted?: boolean;
  order: number; // For sorting
}

export interface MagicTaskResponse {
  title: string;
  description: string;
  status: TaskStatus;
  assignee: Assignee;
  dueDate: string | null;
  priorityColor: string;
}