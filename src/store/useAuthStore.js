import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,
  
  signIn: async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User not found in database');
      }
      
      set({ user: { ...user, ...userDoc.data() }, error: null });
    } catch (error) {
      set({ error: error.message });
    }
  },
  
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({ user: null, error: null });
    } catch (error) {
      set({ error: error.message });
    }
  },
  
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}));

export default useAuthStore