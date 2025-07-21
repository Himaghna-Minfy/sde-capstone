import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle, 
  logout 
} from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(null);

  // Set up axios interceptor for auth tokens
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [tokens]);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get Firebase ID token
          const idToken = await firebaseUser.getIdToken();
          
          // Authenticate with our backend
          const response = await axios.post('/api/auth/firebase-login', {
            firebaseIdToken: idToken,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0]
          });

          if (response.data.user && response.data.tokens) {
            setUser(response.data.user);
            setTokens(response.data.tokens);
            
            // Store tokens for persistence
            localStorage.setItem('galaxydocs-tokens', JSON.stringify(response.data.tokens));
          }
        } else {
          setUser(null);
          setTokens(null);
          localStorage.removeItem('galaxydocs-tokens');
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Restore tokens on app load
  useEffect(() => {
    const savedTokens = localStorage.getItem('galaxydocs-tokens');
    if (savedTokens) {
      try {
        const parsedTokens = JSON.parse(savedTokens);
        setTokens(parsedTokens);
      } catch (error) {
        console.error('Error parsing saved tokens:', error);
        localStorage.removeItem('galaxydocs-tokens');
      }
    }
  }, []);

  const loginWithEmail = async (email, password) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmail(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Email login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email, password, name) => {
    try {
      setLoading(true);
      const userCredential = await signUpWithEmail(auth, email, password);
      
      // Update profile with name
      await updateProfile(userCredential.user, { displayName: name });
      
      return userCredential.user;
    } catch (error) {
      console.error('Email registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      return result.user;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      await logout();
      setUser(null);
      setTokens(null);
      localStorage.removeItem('galaxydocs-tokens');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    tokens,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout: logoutUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;