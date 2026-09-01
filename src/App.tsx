import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute, OnboardingRoute } from './components/layout/AuthRoutes';
import { LoginPage } from './features/auth/LoginPage';
import { OnboardingPage } from './features/onboarding/OnboardingPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { LearnersPage } from './features/learners/LearnersPage';
import { LearnerProfilePage } from './features/learners/LearnerProfilePage';
import { GuardiansPage } from './features/guardians/GuardiansPage';
import { ProgrammesPage } from './features/programmes/ProgrammesPage';
import { GroupsPage } from './features/groups/GroupsPage';
import { GroupDetailPage } from './features/groups/GroupDetailPage';
import { StaffPage } from './features/staff/StaffPage';
import { EnrolmentsPage } from './features/enrolments/EnrolmentsPage';
import { SessionsPage } from './features/sessions/SessionsPage';
import { SessionDetailPage } from './features/sessions/SessionDetailPage';
import { AttendancePage } from './features/attendance/AttendancePage';
import { FollowUpsPage } from './features/followUps/FollowUpsPage';
import { AuthProvider } from './contexts/AuthContext';
import { MusicDashboardPage } from './features/music/MusicDashboardPage';
import { InstrumentsPage } from './features/music/InstrumentsPage';
import { EnsemblesPage } from './features/music/EnsemblesPage';
import { RepertoirePage } from './features/music/RepertoirePage';
import { PracticeLogsPage } from './features/music/PracticeLogsPage';
import { MusicAssessmentsPage } from './features/music/MusicAssessmentsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Onboarding Route */}
          <Route element={<OnboardingRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="learners" element={<LearnersPage />} />
              <Route path="learners/:id" element={<LearnerProfilePage />} />
              <Route path="guardians" element={<GuardiansPage />} />
              <Route path="programmes" element={<ProgrammesPage />} />
              <Route path="groups" element={<GroupsPage />} />
              <Route path="groups/:id" element={<GroupDetailPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="enrolments" element={<EnrolmentsPage />} />
              <Route path="sessions" element={<SessionsPage />} />
              <Route path="sessions/:id" element={<SessionDetailPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="follow-ups" element={<FollowUpsPage />} />
              <Route path="music" element={<MusicDashboardPage />} />
              <Route path="music/instruments" element={<InstrumentsPage />} />
              <Route path="music/ensembles" element={<EnsemblesPage />} />
              <Route path="music/repertoire" element={<RepertoirePage />} />
              <Route path="music/practice" element={<PracticeLogsPage />} />
              <Route path="music/assessments" element={<MusicAssessmentsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
