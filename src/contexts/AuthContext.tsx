import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { AuthUser } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  authUser: AuthUser | null;
  organisationId: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authUser: null,
  organisationId: null,
  loading: true,
  logout: async () => {},
  refreshAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDoc = async (uid: string, email: string | null, displayName: string | null) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setAuthUser({
          uid,
          email,
          displayName,
          role: data.role
        });
        setOrganisationId(data.organisationId || null);
      } else {
        setAuthUser({
          uid,
          email,
          displayName,
        });
        setOrganisationId(null);
      }
    } catch (e) {
      console.error('Error fetching user document:', e);
      setOrganisationId(null);
    }
  };

  const refreshAuth = async () => {
    if (user) {
      await fetchUserDoc(user.uid, user.email, user.displayName);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserDoc(currentUser.uid, currentUser.email, currentUser.displayName);
      } else {
        setAuthUser(null);
        setOrganisationId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, authUser, organisationId, loading, logout, refreshAuth }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
