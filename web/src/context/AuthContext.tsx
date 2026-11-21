"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  getFirebaseAuth,
  googleProvider,
  isFirebaseConfigured,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "@/lib/firebase";
import type { AuthUser } from "@/lib/types";

const DEMO_USER_STORAGE_KEY = "knitx_demo_user_v1";

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isConfigured: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  signInWithGoogle: () => Promise<AuthUser>;
  signInWithEmail: (email: string, password: string) => Promise<AuthUser>;
  signUpWithEmail: (
    name: string,
    email: string,
    password: string
  ) => Promise<AuthUser>;
  signInDemo: (name?: string, email?: string) => AuthUser;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadDemoUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (parsed && parsed.uid && parsed.email) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const auth = getFirebaseAuth();

    if (!auth) {
      const demo = loadDemoUser();
      setUser(demo);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName:
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            "KNITX Member",
          photoURL: firebaseUser.photoURL || undefined,
          isDemo: false,
        });
      } else {
        const demo = loadDemoUser();
        setUser(demo);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInDemo = useCallback(
    (name?: string, email?: string): AuthUser => {
      const cleanName = name?.trim() || "Aarav Archive";
      const cleanEmail =
        email?.trim().toLowerCase() || "collector@knitx.in";
      const slug = cleanEmail.replace(/[^a-z0-9]/g, "").slice(0, 12) || "member";
      const demoUser: AuthUser = {
        uid: `demo_${slug}`,
        email: cleanEmail,
        displayName: cleanName,
        isDemo: true,
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          DEMO_USER_STORAGE_KEY,
          JSON.stringify(demoUser)
        );
      }
      setUser(demoUser);
      setAuthModalOpen(false);
      return demoUser;
    },
    []
  );

  const signInWithGoogle = useCallback(async (): Promise<AuthUser> => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error(
        "Google sign-in is not active in preview mode. Use Demo Pass below to continue."
      );
    }
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    const mapped: AuthUser = {
      uid: fbUser.uid,
      email: fbUser.email || "",
      displayName:
        fbUser.displayName || fbUser.email?.split("@")[0] || "KNITX Member",
      photoURL: fbUser.photoURL || undefined,
      isDemo: false,
    };
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    }
    setUser(mapped);
    setAuthModalOpen(false);
    return mapped;
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error(
          "Email sign-in is not active in preview mode. Use Demo Pass below to continue."
        );
      }
      const result = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = result.user;
      const mapped: AuthUser = {
        uid: fbUser.uid,
        email: fbUser.email || email,
        displayName:
          fbUser.displayName || email.split("@")[0] || "KNITX Member",
        photoURL: fbUser.photoURL || undefined,
        isDemo: false,
      };
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }
      setUser(mapped);
      setAuthModalOpen(false);
      return mapped;
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (
      name: string,
      email: string,
      password: string
    ): Promise<AuthUser> => {
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error(
          "Email sign-in is not active in preview mode. Use Demo Pass below to continue."
        );
      }
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (name.trim()) {
        await updateProfile(result.user, { displayName: name.trim() });
      }
      const mapped: AuthUser = {
        uid: result.user.uid,
        email: result.user.email || email,
        displayName: name.trim() || email.split("@")[0] || "KNITX Member",
        photoURL: result.user.photoURL || undefined,
        isDemo: false,
      };
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }
      setUser(mapped);
      setAuthModalOpen(false);
      return mapped;
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    }
    const auth = getFirebaseAuth();
    if (auth && auth.currentUser) {
      await signOut(auth);
    }
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isConfigured: isFirebaseConfigured,
      authModalOpen,
      setAuthModalOpen,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signInDemo,
      logout,
    }),
    [
      user,
      loading,
      authModalOpen,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signInDemo,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
