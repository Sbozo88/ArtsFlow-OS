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
import { DanceDashboardPage } from './features/dance/DanceDashboardPage';
import { DanceLevelsPage } from './features/dance/DanceLevelsPage';
import { DanceClassesPage } from './features/dance/DanceClassesPage';
import { ChoreographyPage } from './features/dance/ChoreographyPage';
import { CostumesPage } from './features/dance/CostumesPage';
import { DanceAssessmentsPage } from './features/dance/DanceAssessmentsPage';
import { DancePracticeLogsPage } from './features/dance/DancePracticeLogsPage';

// Event Pages
import { EventsDashboardPage } from './features/events/EventsDashboardPage';
import { EventListPage } from './features/events/EventListPage';
import { EventDetailPage } from './features/events/EventDetailPage';
import { EventParticipantsPage } from './features/events/EventParticipantsPage';
import { EventReportsPage } from './features/events/EventReportsPage';

// Consent Pages
import { ConsentRequestsPage } from './features/consent/ConsentRequestsPage';
import { ConsentTemplatesPage } from './features/consent/ConsentTemplatesPage';
import { GuardianConsentPublicPage } from './features/consent/GuardianConsentPublicPage';

// Transport Pages
import { TransportManagementPage } from './features/transport/TransportManagementPage';
import { TransportReportsPage } from './features/transport/TransportReportsPage';

// Finance Pages
import { FinanceOverviewPage } from './features/finance/FinanceOverviewPage';
import { InvoicesPage } from './features/finance/InvoicesPage';
import { PaymentsPage } from './features/finance/PaymentsPage';
import { ChargesPage } from './features/finance/ChargesPage';
import { OutstandingPage } from './features/finance/OutstandingPage';
import { FinanceReportsPage } from './features/finance/FinanceReportsPage';
import { ChargeTypesPage } from './features/finance/ChargeTypesPage';

// Communication Pages
import { CommunicationOverviewPage } from './features/communication/CommunicationOverviewPage';
import { ComposeMessagePage } from './features/communication/ComposeMessagePage';
import { CommunicationHistoryPage } from './features/communication/CommunicationHistoryPage';
import { CommunicationTemplatesPage } from './features/communication/CommunicationTemplatesPage';

// Document Pages
import { DocumentsOverviewPage } from './features/documents/DocumentsOverviewPage';
import { DocumentDetailPage } from './features/documents/DocumentDetailPage';
import { DocumentTemplatesPage } from './features/documents/DocumentTemplatesPage';
import { GeneratedDocumentsPage } from './features/documents/GeneratedDocumentsPage';

// Analytics Pages
import { AnalyticsOverviewPage } from './features/analytics/AnalyticsOverviewPage';
import { LearnerAnalyticsPage } from './features/analytics/LearnerAnalyticsPage';
import { ProgrammeAnalyticsPage } from './features/analytics/ProgrammeAnalyticsPage';
import { AttendanceAnalyticsPage } from './features/analytics/AttendanceAnalyticsPage';
import { EventAnalyticsPage } from './features/analytics/EventAnalyticsPage';
import { FinanceAnalyticsPage } from './features/analytics/FinanceAnalyticsPage';
import { ReportsPage } from './features/analytics/ReportsPage';

// Automation & Notification Pages
import { AutomationOverviewPage } from './features/automation/AutomationOverviewPage';
import { AutomationRulesPage } from './features/automation/AutomationRulesPage';
import { AutomationRuleDetailPage } from './features/automation/AutomationRuleDetailPage';
import { AutomationActivityPage } from './features/automation/AutomationActivityPage';
import { NotificationsPage } from './features/notifications/NotificationsPage';

// Staff Operations Pages (Phase 6A)
import { StaffOperationsOverviewPage } from './features/staffOperations/StaffOperationsOverviewPage';
import { StaffAssignmentsPage } from './features/staffOperations/StaffAssignmentsPage';
import { StaffWorkRecordsPage } from './features/staffOperations/StaffWorkRecordsPage';
import { StaffTimesheetsPage } from './features/staffOperations/StaffTimesheetsPage';
import { StaffTimesheetDetailPage } from './features/staffOperations/StaffTimesheetDetailPage';
import { StaffVerificationPage } from './features/staffOperations/StaffVerificationPage';
import { StaffAvailabilityPage } from './features/staffOperations/StaffAvailabilityPage';
import { StaffWorkloadPage } from './features/staffOperations/StaffWorkloadPage';
import { StaffReportsPage } from './features/staffOperations/StaffReportsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/consent/submit/:requestId" element={<GuardianConsentPublicPage />} />

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
              <Route path="dance" element={<DanceDashboardPage />} />
              <Route path="dance/levels" element={<DanceLevelsPage />} />
              <Route path="dance/classes" element={<DanceClassesPage />} />
              <Route path="dance/choreography" element={<ChoreographyPage />} />
              <Route path="dance/costumes" element={<CostumesPage />} />
              <Route path="dance/practice" element={<DancePracticeLogsPage />} />
              <Route path="dance/assessments" element={<DanceAssessmentsPage />} />
              
              {/* Events Module */}
              <Route path="events" element={<EventsDashboardPage />} />
              <Route path="events/calendar" element={<EventListPage />} />
              <Route path="events/participants" element={<EventParticipantsPage />} />
              <Route path="events/reports" element={<EventReportsPage />} />
              <Route path="events/:id" element={<EventDetailPage />} />

              {/* Consent Module */}
              <Route path="consent" element={<ConsentRequestsPage />} />
              <Route path="consent/templates" element={<ConsentTemplatesPage />} />

              {/* Transport Module */}
              <Route path="transport" element={<TransportManagementPage />} />
              <Route path="transport/reports" element={<TransportReportsPage />} />

              {/* Finance Module */}
              <Route path="finance" element={<FinanceOverviewPage />} />
              <Route path="finance/invoices" element={<InvoicesPage />} />
              <Route path="finance/payments" element={<PaymentsPage />} />
              <Route path="finance/charges" element={<ChargesPage />} />
              <Route path="finance/outstanding" element={<OutstandingPage />} />
              <Route path="finance/reports" element={<FinanceReportsPage />} />
              <Route path="finance/charge-types" element={<ChargeTypesPage />} />

              {/* Communication Module */}
              <Route path="communication" element={<CommunicationOverviewPage />} />
              <Route path="communication/compose" element={<ComposeMessagePage />} />
              <Route path="communication/history" element={<CommunicationHistoryPage />} />
              <Route path="communication/templates" element={<CommunicationTemplatesPage />} />

              {/* Documents Module */}
              <Route path="documents" element={<DocumentsOverviewPage />} />
              <Route path="documents/generated" element={<GeneratedDocumentsPage />} />
              <Route path="documents/templates" element={<DocumentTemplatesPage />} />
              <Route path="documents/:id" element={<DocumentDetailPage />} />

              {/* Analytics Module */}
              <Route path="analytics" element={<AnalyticsOverviewPage />} />
              <Route path="analytics/learners" element={<LearnerAnalyticsPage />} />
              <Route path="analytics/programmes" element={<ProgrammeAnalyticsPage />} />
              <Route path="analytics/attendance" element={<AttendanceAnalyticsPage />} />
              <Route path="analytics/events" element={<EventAnalyticsPage />} />
              <Route path="analytics/finance" element={<FinanceAnalyticsPage />} />
              <Route path="analytics/reports" element={<ReportsPage />} />

              {/* Automation Module */}
              <Route path="automation" element={<AutomationOverviewPage />} />
              <Route path="automation/rules" element={<AutomationRulesPage />} />
              <Route path="automation/rules/:id" element={<AutomationRuleDetailPage />} />
              <Route path="automation/activity" element={<AutomationActivityPage />} />
              <Route path="notifications" element={<NotificationsPage />} />

              {/* Staff Operations Module (Phase 6A) */}
              <Route path="staff-operations" element={<StaffOperationsOverviewPage />} />
              <Route path="staff-operations/assignments" element={<StaffAssignmentsPage />} />
              <Route path="staff-operations/work-records" element={<StaffWorkRecordsPage />} />
              <Route path="staff-operations/timesheets" element={<StaffTimesheetsPage />} />
              <Route path="staff-operations/timesheets/:id" element={<StaffTimesheetDetailPage />} />
              <Route path="staff-operations/verification" element={<StaffVerificationPage />} />
              <Route path="staff-operations/availability" element={<StaffAvailabilityPage />} />
              <Route path="staff-operations/workload" element={<StaffWorkloadPage />} />
              <Route path="staff-operations/reports" element={<StaffReportsPage />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
