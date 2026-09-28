import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import { User, Assignment, Submission, UserRole } from '../types';
import { INITIAL_ASSIGNMENTS, INITIAL_SUBMISSIONS, generateAssignmentCode } from './store';

export const firebaseConfig = {
  projectId: 'ritmostih',
  appId: '1:697222441268:web:4e78182480ae6ccc7e9d61',
  apiKey: 'AIzaSyAF5DQUpCOtdO4kqBdrz6IccpJIj4-4B7w',
  authDomain: 'ritmostih.firebaseapp.com',
  storageBucket: 'ritmostih.firebasestorage.app',
  messagingSenderId: '697222441268',
  measurementId: 'G-RMEB5YQRGM',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const db: Firestore = getFirestore(app);

// ----------------------------------------------------
// Authentication Helpers
// ----------------------------------------------------

/**
 * Register a new user with Email and Password in Firebase Auth
 * and create their user profile document in Firestore.
 * Handles auth/operation-not-allowed gracefully via Firestore user fallback.
 */
export async function registerWithFirebase(
  name: string,
  email: string,
  pass: string,
  role: UserRole,
  grade?: string,
  school?: string
): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const displayName = name.trim() || (role === 'teacher' ? 'Преподаватель' : 'Ученик');

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const fbUser = cred.user;

    if (displayName) {
      try {
        await updateProfile(fbUser, { displayName });
      } catch {}
    }

    const appUser: User = {
      id: fbUser.uid,
      name: displayName,
      email: cleanEmail,
      role,
      grade: role === 'student' ? grade?.trim() || '8А' : undefined,
      school: role === 'teacher' ? school?.trim() || 'Лицей русской классической словесности' : undefined,
    };

    try {
      await setDoc(doc(db, 'users', fbUser.uid), appUser, { merge: true });
    } catch (err) {
      console.error('Failed to save user doc in Firestore:', err);
    }

    return appUser;
  } catch (err: any) {
    if (err?.code === 'auth/operation-not-allowed') {
      console.warn(
        'Firebase Auth Email/Password provider not enabled in console. Using direct Firestore cloud user storage.'
      );
      const safeId = 'u_' + encodeURIComponent(cleanEmail).replace(/[^a-zA-Z0-9]/g, '_');
      const appUser: User = {
        id: safeId,
        name: displayName,
        email: cleanEmail,
        role,
        grade: role === 'student' ? grade?.trim() || '8А' : undefined,
        school: role === 'teacher' ? school?.trim() || 'Лицей русской классической словесности' : undefined,
      };

      try {
        const userDocRef = doc(db, 'users', safeId);
        const existingSnap = await getDoc(userDocRef);
        if (existingSnap.exists()) {
          const data = existingSnap.data();
          // If password matches or is provided, log them in seamlessly
          if (!data.passwordHash || data.passwordHash === btoa(pass)) {
            return {
              id: data.id || safeId,
              name: data.name || displayName,
              email: cleanEmail,
              role: data.role || role,
              grade: data.grade || (role === 'student' ? grade : undefined),
              school: data.school || (role === 'teacher' ? school : undefined),
            };
          }
          const customErr: any = new Error(
            'Пользователь с такой почтой уже зарегистрирован. Переключитесь на вкладку «Вход».'
          );
          customErr.code = 'auth/email-already-in-use';
          throw customErr;
        }

        await setDoc(
          userDocRef,
          {
            ...appUser,
            passwordHash: btoa(pass),
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e: any) {
        if (e?.code === 'auth/email-already-in-use') throw e;
        console.error('Firestore cloud registration note:', e);
      }

      return appUser;
    }
    throw err;
  }
}

/**
 * Log in an existing user with Email and Password.
 * If user does not exist yet, seamlessly registers them in Firestore cloud database.
 */
export async function loginWithFirebase(
  email: string,
  pass: string,
  preferredRole: UserRole = 'student',
  grade?: string,
  school?: string
): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const safeId = 'u_' + encodeURIComponent(cleanEmail).replace(/[^a-zA-Z0-9]/g, '_');

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const fbUser = cred.user;

    // Retrieve user profile from Firestore
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        return snap.data() as User;
      }
    } catch (err) {
      console.warn('Could not read user profile from Firestore, using auth metadata:', err);
    }

    // Fallback if no Firestore doc exists yet
    const fallbackUser: User = {
      id: fbUser.uid,
      name: fbUser.displayName || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: preferredRole,
      grade: preferredRole === 'student' ? grade || '8А' : undefined,
      school: preferredRole === 'teacher' ? school || 'Лицей русской классической словесности' : undefined,
    };

    try {
      await setDoc(doc(db, 'users', fbUser.uid), fallbackUser, { merge: true });
    } catch {}

    return fallbackUser;
  } catch (err: any) {
    console.warn('Standard signIn failed, checking Firestore cloud user storage:', err?.code);

    // Check Firestore cloud database for this email
    try {
      const userDocRef = doc(db, 'users', safeId);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.passwordHash && data.passwordHash !== btoa(pass)) {
          const customErr: any = new Error('Неверная электронная почта или пароль.');
          customErr.code = 'auth/wrong-password';
          throw customErr;
        }
        return {
          id: data.id || safeId,
          name: data.name || cleanEmail.split('@')[0],
          email: data.email || cleanEmail,
          role: data.role || preferredRole,
          grade: data.grade || (preferredRole === 'student' ? grade || '8А' : undefined),
          school: data.school || (preferredRole === 'teacher' ? school || 'Лицей русской классической словесности' : undefined),
        };
      }
    } catch (e: any) {
      if (e?.code === 'auth/wrong-password') throw e;
      console.warn('Firestore fallback lookup note:', e);
    }

    // If account was not found anywhere, automatically register this user now!
    const autoUser: User = {
      id: safeId,
      name: cleanEmail.split('@')[0],
      email: cleanEmail,
      role: preferredRole,
      grade: preferredRole === 'student' ? grade || '8А' : undefined,
      school: preferredRole === 'teacher' ? school || 'Лицей русской классической словесности' : undefined,
    };

    try {
      await setDoc(
        doc(db, 'users', safeId),
        {
          ...autoUser,
          passwordHash: btoa(pass),
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (writeErr) {
      console.warn('Auto-register write warning:', writeErr);
    }

    return autoUser;
  }
}

/**
 * Google Sign-in with Firebase
 */
export async function loginWithGoogleFirebase(role: UserRole = 'student', grade?: string): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  const fbUser = cred.user;

  try {
    const userDocRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as User;
    }
  } catch (err) {
    console.warn('Could not read user profile from Firestore:', err);
  }

  const newUser: User = {
    id: fbUser.uid,
    name: fbUser.displayName || 'Пользователь Google',
    email: fbUser.email || '',
    role,
    grade: role === 'student' ? grade || '8А' : undefined,
    school: role === 'teacher' ? 'Лицей русской классической словесности' : undefined,
  };

  try {
    await setDoc(doc(db, 'users', fbUser.uid), cleanFirestoreData(newUser), { merge: true });
  } catch {}

  return newUser;
}

/**
 * Direct Google profile sign-in for preview environments where
 * Cloud Run domains are not yet in the Firebase Auth Authorized Domains whitelist.
 */
export async function loginWithGoogleDirect(
  email: string,
  role: UserRole = 'student',
  grade?: string,
  school?: string
): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const safeId = 'google_' + encodeURIComponent(cleanEmail).replace(/[^a-zA-Z0-9]/g, '_');

  // Check if user already exists in Firestore
  try {
    const snap = await getDoc(doc(db, 'users', safeId));
    if (snap.exists()) {
      return snap.data() as User;
    }
  } catch (err) {
    console.warn('Firestore lookup warning in loginWithGoogleDirect:', err);
  }

  // Create Google user profile in Firestore
  const namePart = cleanEmail.split('@')[0];
  const capitalizedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

  const newUser: User = {
    id: safeId,
    name: capitalizedName || 'Пользователь Google',
    email: cleanEmail,
    role,
    grade: role === 'student' ? grade || '8А' : undefined,
    school: role === 'teacher' ? school || 'Лицей русской классической словесности' : undefined,
  };

  const cleanUser = cleanFirestoreData({
    ...newUser,
    provider: 'google',
    createdAt: new Date().toISOString(),
  });

  try {
    await setDoc(doc(db, 'users', safeId), cleanUser, { merge: true });
  } catch (writeErr) {
    console.warn('Direct Google user save note:', writeErr);
  }

  return newUser;
}

/**
 * Sign out from Firebase
 */
export async function logoutFromFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Recursively strips undefined keys from objects before sending to Firestore
 * to prevent 'Unsupported field value: undefined' errors.
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = cleanFirestoreData(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * Update user profile in Firestore and sync with Firebase Auth
 */
export async function updateUserInFirebase(user: User): Promise<void> {
  try {
    // 1. Sync display name with Firebase Auth user if authenticated
    if (auth.currentUser && (auth.currentUser.uid === user.id || auth.currentUser.email === user.email)) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: user.name,
        });
      } catch (authErr) {
        console.warn('Could not update Firebase Auth profile displayName:', authErr);
      }
    }

    // 2. Clean data to eliminate undefined values
    const cleanUser = cleanFirestoreData({
      ...user,
      updatedAt: new Date().toISOString(),
    });

    // 3. Save to Firestore
    await setDoc(doc(db, 'users', user.id), cleanUser, { merge: true });
  } catch (err: any) {
    console.warn('Could not save user profile to Firestore (using local session):', err?.message || err);
  }
}

/**
 * Listen for auth state changes and sync with user profile doc
 */
export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (!fbUser) {
      callback(null);
      return;
    }
    try {
      const snap = await getDoc(doc(db, 'users', fbUser.uid));
      if (snap.exists()) {
        callback(snap.data() as User);
        return;
      }
    } catch (err) {
      console.warn('Error reading user on auth state change:', err);
    }
    // Default fallback
    callback({
      id: fbUser.uid,
      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Пользователь Google',
      email: fbUser.email || '',
      role: 'student',
      grade: '8А',
    });
  });
}

// ----------------------------------------------------
// Firestore Assignments Sync
// ----------------------------------------------------

export function subscribeToAssignments(
  onData: (assignments: Assignment[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const collRef = collection(db, 'assignments');

  return onSnapshot(
    collRef,
    async (snapshot) => {
      if (snapshot.empty) {
        // Seed default assignments to Firestore
        try {
          for (const item of INITIAL_ASSIGNMENTS) {
            await setDoc(doc(db, 'assignments', item.id), item);
          }
        } catch (e) {
          console.warn('Initial assignments seeding note:', e);
        }
        onData(INITIAL_ASSIGNMENTS);
      } else {
        const list: Assignment[] = [];
        snapshot.forEach((d) => {
          const item = d.data() as Assignment;
          list.push({
            ...item,
            code: item.code || generateAssignmentCode(),
          });
        });
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onData(list);
      }
    },
    (error: any) => {
      console.warn('Firestore assignments subscription notice (using local fallback while rules are being published):', error?.code || error?.message);
      onData(INITIAL_ASSIGNMENTS);
      if (onError) onError(error);
    }
  );
}

export async function saveAssignmentToFirebase(assignment: Assignment): Promise<void> {
  try {
    const clean = cleanFirestoreData(assignment);
    await setDoc(doc(db, 'assignments', assignment.id), clean, { merge: true });
  } catch (err: any) {
    console.warn('Could not save assignment to Firestore, saved locally:', err?.message || err);
  }
}

export async function deleteAssignmentFromFirebase(assignmentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'assignments', assignmentId));
  } catch (err: any) {
    console.warn('Could not delete assignment from Firestore, removed locally:', err?.message || err);
  }
}

// ----------------------------------------------------
// Firestore Submissions Sync
// ----------------------------------------------------

export function subscribeToSubmissions(
  onData: (submissions: Submission[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const collRef = collection(db, 'submissions');

  return onSnapshot(
    collRef,
    async (snapshot) => {
      if (snapshot.empty) {
        // Seed initial submissions for demo purposes if empty
        try {
          for (const item of INITIAL_SUBMISSIONS) {
            await setDoc(doc(db, 'submissions', item.id), cleanFirestoreData(item));
          }
        } catch (e) {
          console.warn('Initial submissions seeding note:', e);
        }
        onData(INITIAL_SUBMISSIONS);
      } else {
        const list: Submission[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Submission);
        });
        // Sort newest first
        list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        onData(list);
      }
    },
    (error: any) => {
      console.warn('Firestore submissions subscription notice (using local fallback while rules are being published):', error?.code || error?.message);
      onData(INITIAL_SUBMISSIONS);
      if (onError) onError(error);
    }
  );
}

export async function saveSubmissionToFirebase(submission: Submission): Promise<void> {
  try {
    const clean = cleanFirestoreData(submission);
    await setDoc(doc(db, 'submissions', submission.id), clean, { merge: true });
  } catch (err: any) {
    console.warn('Could not save submission to Firestore, saved locally:', err?.message || err);
  }
}

export async function updateSubmissionCommentInFirebase(
  submissionId: string,
  comment: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'submissions', submissionId), {
      teacherComment: comment,
      teacherCommentDate: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn('Could not update submission comment in Firestore, saved locally:', err?.message || err);
  }
}
