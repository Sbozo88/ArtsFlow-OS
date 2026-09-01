import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User, UserRole } from '../types';

export const staffService = {
  async createUser(
    organisationId: string, 
    userId: string, 
    data: Omit<User, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>
  ): Promise<User> {
    const userRef = doc(collection(db, 'users'), userId);
    
    // Don't overwrite if it exists
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as User;
    }

    const now = new Date().toISOString();
    const newUser: User = {
      id: userId,
      organisationId,
      ...data,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId
    };

    await setDoc(userRef, newUser);
    return newUser;
  },

  async getStaff(organisationId: string): Promise<User[]> {
    const q = query(
      collection(db, 'users'),
      where('organisationId', '==', organisationId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as User);
  },

  async updateStaffRole(userId: string, role: UserRole, updatedBy: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role,
      updatedAt: new Date().toISOString(),
      updatedBy
    });
  }
};
