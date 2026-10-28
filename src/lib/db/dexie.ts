import Dexie, { type EntityTable } from 'dexie';

export interface LocalTransaction {
  id: string;
  user_id: string | null;
  amount: number;
  category_id: string;
  note: string;
  date: string;
  created_at: string;
}

export interface LocalCategory {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
}

export interface LocalBudget {
  id: string;
  user_id: string | null;
  category_id: string | null;
  limit_amount: number;
  period: string;
}

const db = new Dexie('KantonginDB') as Dexie & {
  transactions: EntityTable<LocalTransaction, 'id'>;
  categories: EntityTable<LocalCategory, 'id'>;
  budgets: EntityTable<LocalBudget, 'id'>;
};

// Schema declaration — strictly backward-compatible
db.version(1).stores({
  transactions: 'id, date, category_id',
  categories: 'id, is_default',
});

db.version(2).stores({
  transactions: 'id, date, category_id',
  categories: 'id, is_default',
  budgets: 'id, period',
});

export { db };
export default db;

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

