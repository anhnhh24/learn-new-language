import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LearnerLayout } from '../layouts/LearnerLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Auth Pages
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { OnboardingPage } from '../features/auth/pages/OnboardingPage';
import { PlacementPage } from '../features/auth/pages/PlacementPage';

// Learning Pages
import { TodayPage } from '../features/learning/pages/TodayPage';
import { RoadmapPage } from '../features/learning/pages/RoadmapPage';
import { LessonPage } from '../features/learning/pages/LessonPage';

// Practice Pages
import { PracticeListPage } from '../features/practice/pages/PracticeListPage';
import { ExamRoomPage } from '../features/practice/pages/ExamRoomPage';
import { ExamResultPage } from '../features/practice/pages/ExamResultPage';

// Review Pages
import { ErrorNotebookPage } from '../features/review/pages/ErrorNotebookPage';
import { FlashcardPage } from '../features/review/pages/FlashcardPage';

// Account & Dashboard Pages
import { DashboardPage } from '../features/account/pages/DashboardPage';
import { AccountPage } from '../features/account/pages/AccountPage';

// Admin Pages
import { QualityDashboardPage } from '../features/admin/pages/QualityDashboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/learn/today" replace />,
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: '', element: <Navigate to="/auth/login" replace /> },
    ],
  },
  {
    path: '/auth/placement',
    element: <PlacementPage />,
  },
  {
    path: '/learn',
    element: <LearnerLayout />,
    children: [
      { path: '', element: <Navigate to="/learn/today" replace /> },
      { path: 'today', element: <TodayPage /> },
      { path: 'roadmap', element: <RoadmapPage /> },
      { path: 'lesson/:id', element: <LessonPage /> },
      { path: 'practice', element: <PracticeListPage /> },
      { path: 'practice/:attemptId/result', element: <ExamResultPage /> },
      { path: 'errors', element: <ErrorNotebookPage /> },
      { path: 'flashcards', element: <FlashcardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'account', element: <AccountPage /> },
    ],
  },
  // Dedicated Exam Room layout without outer chrome
  {
    path: '/learn/practice/:attemptId',
    element: <ExamRoomPage />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { path: '', element: <Navigate to="/admin/quality" replace /> },
      { path: 'quality', element: <QualityDashboardPage /> },
      { path: 'jobs', element: <QualityDashboardPage /> },
      { path: 'quarantine', element: <QualityDashboardPage /> },
      { path: 'blueprints', element: <QualityDashboardPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/learn/today" replace />,
  },
]);
