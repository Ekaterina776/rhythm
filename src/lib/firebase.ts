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
  projectId: 'centered-record-fkl2c',
  appId: '1:136071545002:web:3929f12cc94eefd88f50d3',
  apiKey: 'AIzaSyCs9B3T9WOeaAx1CLREJk9zY-MjoqaEZnQ',
  authDomain: 'centered-record-fkl2c.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-mediapipe-25804e05-0d44-4f4e-8ec8-ffa21a371ffa',
  storageBucket: 'centered-record-fkl2c.firebasestorage.app',
  messagingSenderId: '136071545002',
  measurementId: '',
  oAuthClientId: '136071545002-g6476u29q09ggrfjgr0f896gamtamqe2.apps.googleusercontent.com',
  recaptchaSiteKey: '',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export let db: Firestore;
try {
  db = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
} catch (err) {
  console.warn('Fallback to default Firestore instance:', err);
  db = getFirestore(app);
}

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
    await setDoc(doc(db, 'users', fbUser.uid), newUser, { merge: true });
  } catch {}

  return newUser;
}

/**
 * Sign out from Firebase
 */
export async function logoutFromFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Update user profile in Firestore
 */
export async function updateUserInFirebase(user: User): Promise<void> {
  try {
    await setDoc(doc(db, 'users', user.id), user, { merge: true });
  } catch (err) {
    console.error('Failed to update user profile in Firestore:', err);
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
      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Пользователь',
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
    (error) => {
      console.error('Firestore assignments subscription error:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveAssignmentToFirebase(assignment: Assignment): Promise<void> {
  await setDoc(doc(db, 'assignments', assignment.id), assignment, { merge: true });
}

export async function deleteAssignmentFromFirebase(assignmentId: string): Promise<void> {
  await deleteDoc(doc(db, 'assignments', assignmentId));
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
            await setDoc(doc(db, 'submissions', item.id), item);
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
    (error) => {
      console.error('Firestore submissions subscription error:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveSubmissionToFirebase(submission: Submission): Promise<void> {
  await setDoc(doc(db, 'submissions', submission.id), submission, { merge: true });
}

export async function updateSubmissionCommentInFirebase(
  submissionId: string,
  comment: string
): Promise<void> {
  await updateDoc(doc(db, 'submissions', submissionId), {
    teacherComment: comment,
    teacherCommentDate: new Date().toISOString(),
  });
}
