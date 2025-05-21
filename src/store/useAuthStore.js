import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,
  onlineUsers: [],
  
  signIn: async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      let userData = userDoc.data();
      
      if (!userDoc.exists()) {        
        userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.email.split('@')[0],
          photoURL: null,
          status: 'online',
          contacts: [],
          lastSeen: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', user.uid), userData);
      }
      
      await updateDoc(doc(db, 'users', user.uid), {
        status: 'online',
        lastSeen: new Date().toISOString()
      });

      set({ user: { ...user, ...userData }, error: null });
    } catch (error) {
      set({ error: error.message });
    }
  },
  
  signOut: async () => {
    try {
      const { user } = useAuthStore.getState();
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          status: 'offline',
          lastSeen: new Date().toISOString()
        });
      }
      await firebaseSignOut(auth);
      set({ user: null, error: null });
    } catch (error) {
      set({ error: error.message });
    }
  },
  
  updateUserStatus: async (status) => {
    try {
      const { user } = useAuthStore.getState();
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          status,
          lastSeen: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  },

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setOnlineUsers: (users) => set({ onlineUsers: users })
}));

export default useAuthStore