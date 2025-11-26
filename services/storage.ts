import { Task, UserProfile } from '../types';
// Fix: Use namespace import to resolve "no exported member 'initializeApp'" error
import * as firebaseApp from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyD6rM8F35-FE53DLajGhmRvzrgEPIdEDHQ",
  authDomain: "task-app-shared.firebaseapp.com",
  projectId: "task-app-shared",
  storageBucket: "task-app-shared.firebasestorage.app",
  messagingSenderId: "556773367238",
  appId: "1:556773367238:web:f7dd5072d4e3b7187e66c7",
  measurementId: "G-2L13FV9KRM"
};

// Initialize Firebase
const app = firebaseApp.initializeApp(firebaseConfig);
const db = getFirestore(app);

const TASKS_COLLECTION = 'tasks';
const CONFIG_COLLECTION = 'config';
const USERS_DOC = 'users';

const DEFAULT_USERS: Record<string, UserProfile> = {
  userA: { id: 'userA', name: 'User A', themeColor: 'teal' },
  userB: { id: 'userB', name: 'User B', themeColor: 'rose' },
};

// --- ID GENERATOR ---
// Simple client-side ID generator (sufficient for this use case)
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// --- TASKS API ---

export const subscribeToTasks = (onUpdate: (tasks: Task[]) => void) => {
    const q = collection(db, TASKS_COLLECTION);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasks: Task[] = [];
        querySnapshot.forEach((doc) => {
            tasks.push(doc.data() as Task);
        });
        onUpdate(tasks);
    });
    return unsubscribe;
};

export const addTask = async (task: Task) => {
    try {
        // We use setDoc with a specific ID so we can manage optimistic updates easily in the UI if needed
        await setDoc(doc(db, TASKS_COLLECTION, task.id), task);
    } catch (e) {
        console.error("Error adding task: ", e);
    }
};

export const updateTask = async (task: Task) => {
    try {
        const taskRef = doc(db, TASKS_COLLECTION, task.id);
        // We cast to any to allow partial updates if needed, though here we pass the full object
        await updateDoc(taskRef, task as any);
    } catch (e) {
        console.error("Error updating task: ", e);
    }
};

export const updateTasks = async (tasksToUpdate: Task[]) => {
    try {
        const batch = writeBatch(db);
        tasksToUpdate.forEach((task) => {
            const taskRef = doc(db, TASKS_COLLECTION, task.id);
            batch.update(taskRef, task as any);
        });
        await batch.commit();
    } catch (e) {
        console.error("Error batch updating tasks: ", e);
    }
};

export const deleteTask = async (id: string) => {
    try {
        await deleteDoc(doc(db, TASKS_COLLECTION, id));
    } catch (e) {
        console.error("Error deleting task: ", e);
    }
};

// --- USERS API ---

export const subscribeToUsers = (onUpdate: (users: Record<string, UserProfile>) => void) => {
    const userDocRef = doc(db, CONFIG_COLLECTION, USERS_DOC);
    
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            onUpdate(docSnap.data() as Record<string, UserProfile>);
        } else {
            // If doc doesn't exist, create it with defaults
            setDoc(userDocRef, DEFAULT_USERS);
            onUpdate(DEFAULT_USERS);
        }
    });
    return unsubscribe;
};

export const updateUser = async (user: UserProfile) => {
    try {
        const userDocRef = doc(db, CONFIG_COLLECTION, USERS_DOC);
        // We use merge: true or dot notation update to only update specific user
        await updateDoc(userDocRef, {
            [user.id]: user
        });
    } catch (e) {
        console.error("Error updating user: ", e);
    }
};