import { QuestionDraftListPage, QuestionDraftEditorPage } from '../features/admin/QuestionDrafts';
import { Part7DraftListPage, Part7DraftEditorPage } from '../features/admin/Part7Drafts';
import { AdminExamListPage, AdminExamCreatePage, AdminExamDetailPage } from '../features/admin/AdminExams';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LearnerLayout } from '../layouts/LearnerLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Auth Pages
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { OnboardingPage } from '../features/auth/pages/OnboardingPage';
import { PlacementPage } from '../features/auth/pages/PlacementPage';
import { ResetPasswordPage } from '../features/auth/pages/AccountActionPage';
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
import { QuizRunnerPage } from '../features/practice/pages/QuizRunnerPage';

// Review Pages
import { ErrorNotebookPage } from '../features/review/pages/ErrorNotebookPage';
import { FlashcardPage } from '../features/review/pages/FlashcardPage';

// Account & Dashboard Pages
import { DashboardPage } from '../features/account/pages/DashboardPage';
import { AccountPage } from '../features/account/pages/AccountPage';

// Support Pages
import { SupportPage } from '../features/support/pages/SupportPage';

// Billing Pages
import { CheckoutPage } from '../features/billing/pages/CheckoutPage';
import { PaymentStatusPage } from '../features/billing/pages/PaymentStatusPage';
import { BillingHistoryPage } from '../features/billing/pages/BillingHistoryPage';

// Admin Pages
import { AdminLoginPage, AdminOverviewPage, AdminListPage, AdminImportPage } from '../features/admin/AdminWorkspace';
// Landing Page (TOTC Inspired)
import { LandingPage } from '../features/landing/pages/LandingPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
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
      { path: 'reset-password', element: <ResetPasswordPage /> },
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
      { path: 'quiz/:quizId', element: <QuizRunnerPage /> },
      { path: 'errors', element: <ErrorNotebookPage /> },
      { path: 'flashcards', element: <FlashcardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'account', element: <AccountPage /> },
      { path: 'support', element: <SupportPage /> },
      { path: 'billing/checkout/:courseId', element: <CheckoutPage /> },
      { path: 'billing/orders/:orderId', element: <PaymentStatusPage /> },
      { path: 'billing/history', element: <BillingHistoryPage /> },
    ],
  },
  // Dedicated Exam Room layout without outer chrome
  {
    path: '/learn/practice/:attemptId',
    element: <ExamRoomPage />,
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { path: '', element: <Navigate to="/admin/overview" replace /> },
      { path: 'overview', element: <AdminOverviewPage /> },
      { path: 'quality', element: <Navigate to="/admin/overview" replace /> },
      { path: 'support', element: <AdminListPage key="support" kind="support" /> },
      { path: 'jobs', element: <AdminListPage key="jobs" kind="jobs" /> },
      { path: 'quarantine', element: <AdminListPage key="quarantine" kind="quarantine" /> },
      { path: 'blueprints', element: <AdminListPage key="blueprints" kind="blueprints" /> },
      { path: 'curriculum', element: <AdminListPage key="curriculum" kind="curriculum" /> },
      { path: 'items', element: <AdminListPage key="items" kind="items" /> },
      { path: 'question-drafts', element: <QuestionDraftListPage /> },
      { path: 'question-drafts/:draftId', element: <QuestionDraftEditorPage /> },
      { path: 'part7-drafts', element: <Part7DraftListPage /> },
      { path: 'part7-drafts/:draftId', element: <Part7DraftEditorPage /> },
      { path: 'exams', element: <AdminExamListPage /> },
      { path: 'exams/new', element: <AdminExamCreatePage /> },
      { path: 'exams/:examId', element: <AdminExamDetailPage /> },
      { path: 'import', element: <AdminImportPage /> },
      { path: 'users', element: <AdminListPage key="users" kind="users" /> },
      { path: 'audit', element: <AdminListPage key="audit" kind="audit" /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/learn/today" replace />,
  },
]);
