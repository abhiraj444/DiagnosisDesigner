import Dexie, { type Table } from 'dexie';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { v4 as uuidv4 } from 'uuid';

export interface LocalCase {
  id: string;
  userId: string;
  type: 'diagnosis' | 'content-generator';
  title: string;
  createdAt: number;
  inputData: {
    patientData?: string | null;
    supportingDocuments?: string[]; // Local URLs or Base64
    structuredQuestion?: any;
    mode?: 'question' | 'topic';
    question?: string | null;
    images?: string[];
    topic?: string | null;
  };
  outputDataUrl?: string; // Local path to JSON
  outputData?: any; // Direct storage for simplicity in local mode
}

export interface LocalUser {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
}

class MediGenDatabase extends Dexie {
  cases!: Table<LocalCase>;
  users!: Table<LocalUser>;

  constructor() {
    super('MediGenDB');
    this.version(1).stores({
      cases: 'id, userId, type, createdAt',
      users: 'id, email'
    });
  }
}

export const db = new MediGenDatabase();

export const LocalDataService = {
  // Case Management
  async saveCase(caseData: Partial<LocalCase>) {
    const id = caseData.id || uuidv4();
    const data = {
      ...caseData,
      id,
      createdAt: caseData.createdAt || Date.now(),
    } as LocalCase;
    await db.cases.put(data);
    return id;
  },

  async getCase(id: string) {
    return await db.cases.get(id);
  },

  async getUserCases(userId: string) {
    return await db.cases
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt');
  },

  async deleteCase(id: string) {
    await db.cases.delete(id);
  },

  // File Management (Capacitor Filesystem)
  async saveFile(file: File, userId: string): Promise<string> {
    const fileName = `${uuidv4()}-${file.name}`;
    const path = `uploads/${userId}/${fileName}`;

    const base64Data = await this.fileToBase64(file);

    // On web platform, just return the data URI directly
    if (Capacitor.getPlatform() === 'web') {
      return base64Data;
    }

    // On mobile platforms, use Filesystem API
    try {
      await Filesystem.writeFile({
        path,
        data: base64Data,
        directory: Directory.Data,
        recursive: true
      });

      const result = await Filesystem.getUri({
        path,
        directory: Directory.Data
      });

      return result.uri;
    } catch (e) {
      console.error('Error saving file locally:', e);
      // Fallback to Data URI if Filesystem fails
      return base64Data;
    }
  },

  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // User Management
  async createUser(user: LocalUser) {
    await db.users.add(user);
    return user;
  },

  async getUserByEmail(email: string) {
    return await db.users.where('email').equals(email).first();
  }
};
