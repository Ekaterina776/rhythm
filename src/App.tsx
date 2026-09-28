/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Assignment, Submission, StudentGestureLine } from './types';
import {
  getSavedUser,
  saveUser,
  getAssignments,
  saveAssignments,
  getSubmissions,
  saveSubmissions,
} from './lib/store';
import {
  subscribeToAuthChanges,
  subscribeToAssignments,
  subscribeToSubmissions,
  saveAssignmentToFirebase,
  deleteAssignmentFromFirebase,
  saveSubmissionToFirebase,
  updateUserInFirebase,
  logoutFromFirebase,
} from './lib/firebase';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { GestureTutorialModal } from './components/GestureTutorialModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { InteractiveRhythmRunner } from './components/InteractiveRhythmRunner';
import { FootScansionEditor } from './components/FootScansionEditor';
import { SubmissionResultView } from './components/SubmissionResultView';
import { compareLineScansion } from './lib/poetryEngine';

export default function App() {
  // Global App State (Starts from local cache, then updates from Firebase real-time)
  const [currentUser, setCurrentUser] = useState<User | null>(getSavedUser);
  const [assignments, setAssignments] = useState<Assignment[]>(getAssignments);
  const [submissions, setSubmissions] = useState<Submission[]>(getSubmissions);

  // Active View State: default to 'landing' so visitor sees the explanation and demo
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Active interactive exercise state
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [isTrainingMode, setIsTrainingMode] = useState<boolean>(false);
  const [currentGestureLines, setCurrentGestureLines] = useState<StudentGestureLine[]>([]);
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);

  // 1. Firebase Auth state listener
  useEffect(() => {
    const unsubAuth = subscribeToAuthChanges((fbUser) => {
      if (fbUser) {
        setCurrentUser(fbUser);
        saveUser(fbUser);
      }
    });
    return () => unsubAuth();
  }, []);

  // 2. Real-time Firebase Firestore Assignments sync
  useEffect(() => {
    const unsubAssignments = subscribeToAssignments((cloudAssignments) => {
      if (cloudAssignments && cloudAssignments.length > 0) {
        setAssignments(cloudAssignments);
        saveAssignments(cloudAssignments);
      }
    });
    return () => unsubAssignments();
  }, []);

  // 3. Real-time Firebase Firestore Submissions sync
  useEffect(() => {
    const unsubSubmissions = subscribeToSubmissions((cloudSubmissions) => {
      if (cloudSubmissions) {
        setSubmissions(cloudSubmissions);
        saveSubmissions(cloudSubmissions);
      }
    });
    return () => unsubSubmissions();
  }, []);

  // Synchronize state changes to local storage & navigation logic
  useEffect(() => {
    saveUser(currentUser);
    // When user logs in from landing or elsewhere, navigate to their dashboard
    if (currentUser) {
      if (currentUser.role === 'teacher') {
        if (currentTab === 'landing' || currentTab === 'student_available' || currentTab === 'student_completed') {
          setCurrentTab('teacher_assignments');
        }
      } else {
        if (
          currentTab === 'teacher_assignments' ||
          currentTab === 'create_assignment' ||
          currentTab === 'teacher_submissions'
        ) {
          setCurrentTab('student_available');
        }
      }
    }
  }, [currentUser]);

  useEffect(() => {
    saveAssignments(assignments);
  }, [assignments]);

  useEffect(() => {
    saveSubmissions(submissions);
  }, [submissions]);

  // Start an assignment
  const handleStartAssignment = (assignment: Assignment, isTraining: boolean) => {
    setActiveAssignment(assignment);
    setIsTrainingMode(isTraining);
    setCurrentGestureLines([]);
    setViewingSubmission(null);
    setCurrentTab('running_assignment');
  };

  // Immediate guest/interactive trial from landing page
  const handleTryInteractiveDemo = () => {
    const firstAssignment = assignments[0];
    if (firstAssignment) {
      handleStartAssignment(firstAssignment, true);
    }
  };

  // Finish interactive rhythm runner (phase 1)
  const handleFinishRunner = (gestureLines: StudentGestureLine[]) => {
    setCurrentGestureLines(gestureLines);
    setCurrentTab('scansion_editor');
  };

  // Submit foot scansion and meter (phase 2)
  const handleSubmitScansion = async (data: {
    dividedScheme: string;
    studentDividers: number[][];
    studentMeter: string;
    studentRhyme: string;
  }) => {
    if (!activeAssignment) return;

    const studentUser = currentUser || {
      id: 'guest_user',
      name: 'Гость (Демо-режим)',
      email: 'guest@ritmostikh.local',
      role: 'student' as const,
      grade: activeAssignment.grade || '8А',
    };

    // Check accuracy by comparing gesture lines with expected line scansion
    let totalSyllables = 0;
    let matchedSyllables = 0;

    activeAssignment.parsedLines.forEach((pLine, lIdx) => {
      const gLine = currentGestureLines[lIdx]?.gestures || [];
      const res = compareLineScansion(gLine, pLine.expectedStresses);
      totalSyllables += res.totalCount;
      matchedSyllables += res.matchesCount;
    });

    const accuracy = totalSyllables > 0 ? Math.round((matchedSyllables / totalSyllables) * 100) : 85;

    // Check meter and rhyme correctness
    const expectedMeterNorm = activeAssignment.meter.toLowerCase();
    const studentMeterNorm = data.studentMeter.toLowerCase();
    const meterCorrect =
      expectedMeterNorm.includes(studentMeterNorm) || studentMeterNorm.includes(expectedMeterNorm);

    const expectedRhymeNorm = activeAssignment.rhyme.toLowerCase();
    const studentRhymeNorm = data.studentRhyme.toLowerCase();
    const rhymeCorrect =
      expectedRhymeNorm.includes(studentRhymeNorm) || studentRhymeNorm.includes(expectedRhymeNorm);

    // Check if this student already has a previous submission
    const existingSubIndex = submissions.findIndex(
      s => s.assignmentId === activeAssignment.id && s.studentId === studentUser.id
    );

    let finalSubmission: Submission;

    if (existingSubIndex >= 0) {
      const prev = submissions[existingSubIndex];
      finalSubmission = {
        ...prev,
        isTraining: true,
        trainingCount: (prev.trainingCount || 0) + 1,
        gestureLines: currentGestureLines,
        recordedScheme: currentGestureLines
          .map(l => l.gestures.join(''))
          .filter(Boolean)
          .join('\n'),
        dividedFeetScheme: data.dividedScheme,
        studentDividers: data.studentDividers,
        studentMeter: data.studentMeter,
        studentRhyme: data.studentRhyme,
        accuracy: prev.accuracy,
        meterCorrect,
        rhymeCorrect,
      };

      const updatedSubmissions = [...submissions];
      updatedSubmissions[existingSubIndex] = finalSubmission;
      setSubmissions(updatedSubmissions);
    } else {
      finalSubmission = {
        id: `sub_${Date.now()}`,
        assignmentId: activeAssignment.id,
        studentId: studentUser.id,
        studentName: studentUser.name,
        studentEmail: studentUser.email,
        grade: studentUser.grade || '8А',
        submittedAt: new Date().toISOString(),
        isTraining: isTrainingMode,
        trainingCount: isTrainingMode ? 1 : 0,
        gestureLines: currentGestureLines,
        recordedScheme: currentGestureLines
          .map(l => l.gestures.join(''))
          .filter(Boolean)
          .join('\n'),
        dividedFeetScheme: data.dividedScheme,
        studentDividers: data.studentDividers,
        studentMeter: data.studentMeter,
        studentRhyme: data.studentRhyme,
        accuracy,
        meterCorrect,
        rhymeCorrect,
      };

      setSubmissions(prev => [finalSubmission, ...prev]);
    }

    // Persist to Firebase Firestore
    try {
      await saveSubmissionToFirebase(finalSubmission);
    } catch (err) {
      console.warn('Could not save submission to Firestore immediately:', err);
    }

    setViewingSubmission(finalSubmission);
    setCurrentTab('submission_result');
  };

  // View existing submission details
  const handleViewSubmission = (assignment: Assignment, submission: Submission) => {
    setActiveAssignment(assignment);
    setViewingSubmission(submission);
    setCurrentTab('submission_result');
  };

  // Save AI recommendations to submission
  const handleUpdateSubmissionAi = async (subId: string, aiText: string) => {
    setSubmissions(prev =>
      prev.map(s =>
        s.id === subId
          ? { ...s, aiRecommendations: aiText, aiAnalysisDate: new Date().toISOString() }
          : s
      )
    );
    if (viewingSubmission && viewingSubmission.id === subId) {
      setViewingSubmission(prev => (prev ? { ...prev, aiRecommendations: aiText } : null));
    }
    const targetSub = submissions.find(s => s.id === subId);
    if (targetSub) {
      try {
        await saveSubmissionToFirebase({
          ...targetSub,
          aiRecommendations: aiText,
          aiAnalysisDate: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Failed to update AI recommendations in Firebase:', err);
      }
    }
  };

  // Teacher comments saving
  const handleSaveTeacherComment = async (subId: string, comment: string) => {
    setSubmissions(prev =>
      prev.map(s =>
        s.id === subId
          ? { ...s, teacherComment: comment, teacherCommentDate: new Date().toISOString() }
          : s
      )
    );
    const targetSub = submissions.find(s => s.id === subId);
    if (targetSub) {
      try {
        await saveSubmissionToFirebase({
          ...targetSub,
          teacherComment: comment,
          teacherCommentDate: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Failed to save teacher comment in Firebase:', err);
      }
    }
  };

  // Create new assignment (Teacher)
  const handleCreateAssignment = async (newAssignment: Assignment) => {
    setAssignments(prev => [newAssignment, ...prev]);
    try {
      await saveAssignmentToFirebase(newAssignment);
    } catch (err) {
      console.error('Failed to save new assignment to Firebase:', err);
    }
  };

  // Update existing assignment (Teacher)
  const handleUpdateAssignment = async (updatedAssignment: Assignment) => {
    setAssignments(prev =>
      prev.map(a => (a.id === updatedAssignment.id ? updatedAssignment : a))
    );
    try {
      await saveAssignmentToFirebase(updatedAssignment);
    } catch (err) {
      console.error('Failed to update assignment in Firebase:', err);
    }
  };

  // Delete assignment (Teacher)
  const handleDeleteAssignment = async (assignmentId: string) => {
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    if (activeAssignment?.id === assignmentId) {
      setActiveAssignment(null);
    }
    try {
      await deleteAssignmentFromFirebase(assignmentId);
    } catch (err) {
      console.error('Failed to delete assignment from Firebase:', err);
    }
  };

  // Update user profile in Firebase & local state
  const handleUpdateUser = async (updatedUser: User) => {
    setCurrentUser(updatedUser);
    saveUser(updatedUser);

    // Synchronize student name and grade across their submissions
    setSubmissions(prev => {
      const updated = prev.map(s => {
        if (s.studentId === updatedUser.id || s.studentEmail === updatedUser.email) {
          const syncedSub = {
            ...s,
            studentName: updatedUser.name,
            grade: updatedUser.grade || s.grade,
          };
          saveSubmissionToFirebase(syncedSub).catch(e =>
            console.warn('Submission name sync note:', e)
          );
          return syncedSub;
        }
        return s;
      });
      saveSubmissions(updated);
      return updated;
    });

    // If teacher, synchronize author name across their created assignments
    if (updatedUser.role === 'teacher') {
      setAssignments(prev => {
        const updated = prev.map(a => {
          if (a.teacherId === updatedUser.id) {
            const syncedAsgn = {
              ...a,
              teacherName: updatedUser.name,
            };
            saveAssignmentToFirebase(syncedAsgn).catch(e =>
              console.warn('Assignment author sync note:', e)
            );
            return syncedAsgn;
          }
          return a;
        });
        saveAssignments(updated);
        return updated;
      });
    }

    try {
      await updateUserInFirebase(updatedUser);
    } catch (err) {
      console.error('Failed to update user profile in Firebase:', err);
      throw err;
    }
  };

  // User logout
  const handleLogout = async () => {
    try {
      await logoutFromFirebase();
    } catch (err) {
      console.warn('Logout warning:', err);
    }
    setCurrentUser(null);
    saveUser(null);
    setIsProfileOpen(false);
    setCurrentTab('landing');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Navbar Header */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        currentTab={currentTab}
        onSelectTab={tab => {
          setActiveAssignment(null);
          setViewingSubmission(null);
          setCurrentTab(tab);
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* 1. Main Landing Screen with explanation, video demo, and photo showcase */}
        {currentTab === 'landing' && (
          <LandingView
            onStartAsStudent={() => {
              if (currentUser?.role === 'student') {
                setCurrentTab('student_available');
              } else {
                setIsAuthOpen(true);
              }
            }}
            onStartAsTeacher={() => {
              if (currentUser?.role === 'teacher') {
                setCurrentTab('teacher_assignments');
              } else {
                setIsAuthOpen(true);
              }
            }}
            onTryInteractiveDemo={handleTryInteractiveDemo}
            onOpenTutorial={() => setIsTutorialOpen(true)}
          />
        )}

        {/* 2. Interactive Rhythm Runner (Camera & Flowing Syllables) */}
        {currentTab === 'running_assignment' && activeAssignment && (
          <InteractiveRhythmRunner
            assignment={activeAssignment}
            isTraining={isTrainingMode}
            onFinishExercise={handleFinishRunner}
            onOpenTutorial={() => setIsTutorialOpen(true)}
            onCancel={() => {
              setActiveAssignment(null);
              setCurrentTab(currentUser ? (currentUser.role === 'teacher' ? 'teacher_assignments' : 'student_available') : 'landing');
            }}
          />
        )}

        {/* 3. Foot Division and Scheme Form */}
        {currentTab === 'scansion_editor' && activeAssignment && (
          <FootScansionEditor
            assignment={activeAssignment}
            isTraining={isTrainingMode}
            gestureLines={currentGestureLines}
            onSubmit={handleSubmitScansion}
            onOpenTutorial={() => setIsTutorialOpen(true)}
          />
        )}

        {/* 4. Submission Results & Feedback */}
        {currentTab === 'submission_result' && activeAssignment && viewingSubmission && (
          <SubmissionResultView
            assignment={activeAssignment}
            submission={viewingSubmission}
            onRestartAsTraining={() => handleStartAssignment(activeAssignment, true)}
            onBackToList={() => {
              setActiveAssignment(null);
              setViewingSubmission(null);
              setCurrentTab(currentUser?.role === 'teacher' ? 'teacher_assignments' : currentUser ? 'student_available' : 'landing');
            }}
            onUpdateSubmissionAi={handleUpdateSubmissionAi}
          />
        )}

        {/* 5. Teacher Dashboard */}
        {currentUser?.role === 'teacher' &&
          (currentTab === 'teacher_assignments' ||
            currentTab === 'create_assignment' ||
            currentTab === 'teacher_submissions') && (
            <TeacherDashboard
              assignments={assignments}
              submissions={submissions}
              activeTab={currentTab as any}
              onSelectTab={setCurrentTab}
              onCreateAssignment={handleCreateAssignment}
              onUpdateAssignment={handleUpdateAssignment}
              onDeleteAssignment={handleDeleteAssignment}
              onSaveTeacherComment={handleSaveTeacherComment}
              teacherName={currentUser.name}
              teacherId={currentUser.id}
            />
          )}

        {/* 6. Student Dashboard */}
        {currentUser?.role === 'student' &&
          (currentTab === 'student_available' || currentTab === 'student_completed') && (
            <StudentDashboard
              currentUser={currentUser}
              assignments={assignments}
              submissions={submissions}
              activeTab={currentTab as any}
              onStartAssignment={handleStartAssignment}
              onViewSubmission={handleViewSubmission}
              onOpenTutorial={() => setIsTutorialOpen(true)}
            />
          )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>РитмоСтих © 2026 • Интерактивный тренажер стихосложения с MediaPipe & Firebase</span>
          <div className="flex items-center space-x-3 text-slate-400">
            <button
              onClick={() => setCurrentTab('landing')}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              Главная
            </button>
            <span>•</span>
            <button
              onClick={() => setIsTutorialOpen(true)}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              Инструкция по жестам
            </button>
            <span>•</span>
            <button
              onClick={() => {
                if (currentUser) {
                  setIsProfileOpen(true);
                } else {
                  setIsAuthOpen(true);
                }
              }}
              className="text-amber-400 hover:text-amber-300 transition-colors font-medium cursor-pointer"
            >
              {currentUser ? `Профиль: ${currentUser.name}` : 'Вход для учителей и учащихся'}
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GestureTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogin={user => {
          setCurrentUser(user);
          if (user.role === 'teacher') {
            setCurrentTab('teacher_assignments');
          } else {
            setCurrentTab('student_available');
          }
        }}
      />

      {currentUser && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
          assignmentsCount={
            currentUser.role === 'teacher'
              ? assignments.length
              : submissions.filter(
                  s => s.studentId === currentUser.id || s.studentEmail === currentUser.email
                ).length
          }
          submissionsCount={
            currentUser.role === 'teacher'
              ? submissions.length
              : submissions
                  .filter(s => s.studentId === currentUser.id || s.studentEmail === currentUser.email)
                  .reduce((acc, s) => acc + (s.trainingCount || 0), 0)
          }
          onNavigateToDashboard={() => {
            setIsProfileOpen(false);
            if (currentUser.role === 'teacher') {
              setCurrentTab('teacher_assignments');
            } else {
              setCurrentTab('student_available');
            }
          }}
        />
      )}
    </div>
  );
}
