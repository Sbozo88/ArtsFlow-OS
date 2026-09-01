import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { LearnersPage } from './features/learners/LearnersPage';
import { LearnerProfilePage } from './features/learners/LearnerProfilePage';
import { GuardiansPage } from './features/guardians/GuardiansPage';
import { ProgrammesPage } from './features/programmes/ProgrammesPage';
import { GroupsPage } from './features/groups/GroupsPage';
import { AttendancePage } from './features/attendance/AttendancePage';
import { SessionsPage } from './features/sessions/SessionsPage';
import { StaffPage } from './features/staff/StaffPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="learners" element={<LearnersPage />} />
          <Route path="learners/:id" element={<LearnerProfilePage />} />
          <Route path="guardians" element={<GuardiansPage />} />
          <Route path="programmes/:type?" element={<ProgrammesPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="staff" element={<StaffPage />} />
          {/* Add more routes here as we build them */}
          <Route path="*" element={<div className="p-8 text-slate-500 text-center">Module coming soon.</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
