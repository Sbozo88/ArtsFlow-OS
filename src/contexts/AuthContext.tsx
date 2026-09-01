/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { organisationService } from '../services/organisationService';
import { staffService } from '../services/staffService';

interface AuthContextType {
  user: User | null;
  organizationId: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  organizationId: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // For this initial implementation, we'll map the user's UID to their personal organization ID.
  // In Phase 2, this will be fetched from a 'Users' or 'UserRoles' Firestore collection.
  const organizationId = user ? `org_${user.uid}` : null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const orgId = `org_${currentUser.uid}`;
        
        try {
          // Ensure Organisation and User records exist
          await organisationService.createOrganisation(orgId, `${currentUser.email || 'My'} Organisation`);
          await staffService.createUser(orgId, currentUser.uid, {
            firstName: currentUser.displayName?.split(' ')[0] || 'New',
            lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || 'User',
            email: currentUser.email || '',
            role: 'Super Admin'
          });
        } catch (error) {
          console.error("Error provisioning user records:", error);
        }
      }
      
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, organizationId, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
