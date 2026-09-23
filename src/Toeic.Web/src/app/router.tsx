import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LearnerLayout } from '../layouts/LearnerLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Auth Pages
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { OnboardingPage } from '../features/auth/pages/OnboardingPage';
import { PlacementPage } from '../features/auth/pages/PlacementPage';
import { VerifyEmailPage } from '../features/auth/pages/VerifyEmailPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';

// Learning Pages
import { TodayPage } from '../features/learning/pages/TodayPage';
import { RoadmapPage } from '../features/learning/pages/RoadmapPage';
import { LessonPage } from '../features/learning/pages/LessonPage';
import { CourseCatalogPage } from '../features/learning/pages/CourseCatalogPage';
import { CourseDetailPage } from '../features/learning/pages/CourseDetailPage';

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

// Support Pages
import { SupportPage } from '../features/support/pages/SupportPage';

// Admin Pages
import { QualityDashboardPage } from '../features/admin/pages/QualityDashboardPage';
import { JobMonitorPage } from '../features/admin/pages/JobMonitorPage';
import { QuarantineListPage } from '../features/admin/pages/QuarantineListPage';
import { BlueprintsPage } from '../features/admin/pages/BlueprintsPage';

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
      { path: 'verify-email', element: <VerifyEmailPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
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
      { path: 'courses', element: <CourseCatalogPage /> },
      { path: 'courses/:courseId', element: <CourseDetailPage /> },
      { path: 'roadmap', element: <RoadmapPage /> },
      { path: 'lesson/:id', element: <LessonPage /> },
      { path: 'practice', element: <PracticeListPage /> },
      { path: 'practice/:attemptId/result', element: <ExamResultPage /> },
      { path: 'errors', element: <ErrorNotebookPage /> },
      { path: 'flashcards', element: <FlashcardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'account', element: <AccountPage /> },
      { path: 'support', element: <SupportPage /> },
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
      { path: 'jobs', element: <JobMonitorPage /> },
      { path: 'quarantine', element: <QuarantineListPage /> },
      { path: 'blueprints', element: <BlueprintsPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/learn/today" replace />,
  },
]);
