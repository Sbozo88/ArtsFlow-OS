import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute, OnboardingRoute, PlatformRoute, FeatureRoute } from './components/layout/AuthRoutes';
import { LoginPage } from './features/auth/LoginPage';
import { AccessDisabledPage } from './features/auth/AccessDisabledPage';
import { FeatureAccessDeniedPage } from './features/platform/pages/FeatureAccessDeniedPage';
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
import { EntitlementProvider } from './contexts/EntitlementContext';
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

// Organisation Settings Pages (Phase 6B)
import { SettingsOverviewPage } from './features/settings/SettingsOverviewPage';
import { OrganisationProfilePage } from './features/settings/OrganisationProfilePage';
import { CalendarSettingsPage } from './features/settings/CalendarSettingsPage';
import { ProgrammeSettingsPage } from './features/settings/ProgrammeSettingsPage';
import { AttendanceSettingsPage } from './features/settings/AttendanceSettingsPage';
import { FinanceSettingsPage } from './features/settings/FinanceSettingsPage';
import { StaffSettingsPage } from './features/settings/StaffSettingsPage';
import { CommunicationSettingsPage } from './features/settings/CommunicationSettingsPage';
import { AutomationSettingsPage } from './features/settings/AutomationSettingsPage';
import { UsersAndRolesPage } from './features/settings/UsersAndRolesPage';
import { BrandingSettingsPage } from './features/settings/BrandingSettingsPage';
import { SystemSettingsPage } from './features/settings/SystemSettingsPage';
import { SettingsAuditPage } from './features/settings/SettingsAuditPage';
import { PortalSettingsPage } from './features/settings/PortalSettingsPage';

// Guardian Portal Pages & Components (Phase 7A)
import { GuardianProtectedRoute } from './features/portal/components/GuardianProtectedRoute';
import { GuardianPortalLayout } from './features/portal/components/GuardianPortalLayout';
import { GuardianLoginPage } from './features/portal/pages/GuardianLoginPage';
import { GuardianInvitationAcceptPage } from './features/portal/pages/GuardianInvitationAcceptPage';
import { GuardianDashboardPage } from './features/portal/pages/GuardianDashboardPage';
import { GuardianLearnersPage } from './features/portal/pages/GuardianLearnersPage';
import { GuardianLearnerDetailPage } from './features/portal/pages/GuardianLearnerDetailPage';
import { GuardianAttendancePage } from './features/portal/pages/GuardianAttendancePage';
import { GuardianEventsPage } from './features/portal/pages/GuardianEventsPage';
import { GuardianConsentPage } from './features/portal/pages/GuardianConsentPage';
import { GuardianConsentSubmitPage } from './features/portal/pages/GuardianConsentSubmitPage';
import { GuardianTransportPage } from './features/portal/pages/GuardianTransportPage';
import { GuardianFinancePage } from './features/portal/pages/GuardianFinancePage';
import { GuardianInvoiceViewPage } from './features/portal/pages/GuardianInvoiceViewPage';
import { GuardianReceiptViewPage } from './features/portal/pages/GuardianReceiptViewPage';
import { GuardianDocumentsPage } from './features/portal/pages/GuardianDocumentsPage';
import { GuardianMessagesPage } from './features/portal/pages/GuardianMessagesPage';
import { GuardianProfilePage } from './features/portal/pages/GuardianProfilePage';
import { LearnerPortalNoticePage } from './features/portal/pages/LearnerPortalNoticePage';
import { GuardianPortalUnavailablePage } from './features/portal/pages/GuardianPortalUnavailablePage';
import { releaseCapabilities } from './config/releaseCapabilities';
import { NotFoundPage } from './components/layout/NotFoundPage';

// Platform Super Admin Console Pages (SaaS 1B)
import { PlatformLayout } from './components/layout/PlatformLayout';
import { PlatformDashboardPage } from './features/platform/pages/PlatformDashboardPage';
import { PlatformOrganisationsPage } from './features/platform/pages/PlatformOrganisationsPage';
import { PlatformOrganisationDetailPage } from './features/platform/pages/PlatformOrganisationDetailPage';
import { PlatformUsersPage } from './features/platform/pages/PlatformUsersPage';
import { PlatformHealthPage } from './features/platform/pages/PlatformHealthPage';
import { PlatformAuditPage } from './features/platform/pages/PlatformAuditPage';
import { PlatformSettingsPage } from './features/platform/pages/PlatformSettingsPage';
import { PlatformPlansPage } from './features/platform/pages/PlatformPlansPage';
import { PlatformFeaturesPage } from './features/platform/pages/PlatformFeaturesPage';

function App() {
  return (
    <AuthProvider>
      <EntitlementProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/access-disabled" element={<AccessDisabledPage />} />
            <Route path="/access-denied" element={<FeatureAccessDeniedPage />} />
            <Route path="/consent/submit/:requestId" element={<GuardianConsentPublicPage />} />
            <Route path="/portal/login" element={releaseCapabilities.guardianPortal ? <GuardianLoginPage /> : <GuardianPortalUnavailablePage />} />
            <Route path="/portal/invite/:token" element={releaseCapabilities.guardianPortal ? <GuardianInvitationAcceptPage /> : <GuardianPortalUnavailablePage />} />
            <Route path="/learner-portal" element={<LearnerPortalNoticePage />} />

            {/* Guardian Portal Protected Routes (Phase 7A) */}
            <Route element={<FeatureRoute feature="guardian_portal" />}>
              <Route element={<GuardianProtectedRoute />}>
                <Route path="/portal" element={<GuardianPortalLayout />}>
                  <Route index element={<GuardianDashboardPage />} />
                  <Route path="learners" element={<GuardianLearnersPage />} />
                  <Route path="learners/:learnerId" element={<GuardianLearnerDetailPage />} />
                  <Route path="attendance" element={<GuardianAttendancePage />} />
                  <Route path="events" element={<GuardianEventsPage />} />
                  <Route path="consent" element={<GuardianConsentPage />} />
                  <Route path="consent/:requestId" element={<GuardianConsentSubmitPage />} />
                  <Route path="transport" element={<GuardianTransportPage />} />
                  <Route path="finance" element={<GuardianFinancePage />} />
                  <Route path="finance/invoices/:invoiceId" element={<GuardianInvoiceViewPage />} />
                  <Route path="finance/receipts/:receiptId" element={<GuardianReceiptViewPage />} />
                  <Route path="documents" element={<GuardianDocumentsPage />} />
                  <Route path="messages" element={<GuardianMessagesPage />} />
                  <Route path="profile" element={<GuardianProfilePage />} />
                </Route>
              </Route>
            </Route>

            {/* Onboarding Route */}
            <Route element={<OnboardingRoute />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
            </Route>

            {/* SaaS 1B: Platform Super Admin Console Routes */}
            <Route element={<PlatformRoute />}>
              <Route path="/platform" element={<PlatformLayout />}>
                <Route index element={<PlatformDashboardPage />} />
                <Route path="organisations" element={<PlatformOrganisationsPage />} />
                <Route path="organisations/:organisationId" element={<PlatformOrganisationDetailPage />} />
                <Route path="plans" element={<PlatformPlansPage />} />
                <Route path="features" element={<PlatformFeaturesPage />} />
                <Route path="users" element={<PlatformUsersPage />} />
                <Route path="health" element={<PlatformHealthPage />} />
                <Route path="audit" element={<PlatformAuditPage />} />
                <Route path="settings" element={<PlatformSettingsPage />} />
              </Route>
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

                {/* Music Module */}
                <Route element={<FeatureRoute feature="music.core" />}>
                  <Route path="music" element={<MusicDashboardPage />} />
                  <Route path="music/instruments" element={<InstrumentsPage />} />
                  <Route path="music/ensembles" element={<EnsemblesPage />} />
                  <Route path="music/repertoire" element={<RepertoirePage />} />
                  <Route path="music/practice" element={<PracticeLogsPage />} />
                  <Route path="music/assessments" element={<MusicAssessmentsPage />} />
                </Route>

                {/* Dance Module */}
                <Route element={<FeatureRoute feature="dance.core" />}>
                  <Route path="dance" element={<DanceDashboardPage />} />
                  <Route path="dance/levels" element={<DanceLevelsPage />} />
                  <Route path="dance/classes" element={<DanceClassesPage />} />
                  <Route path="dance/choreography" element={<ChoreographyPage />} />
                  <Route path="dance/costumes" element={<CostumesPage />} />
                  <Route path="dance/practice" element={<DancePracticeLogsPage />} />
                  <Route path="dance/assessments" element={<DanceAssessmentsPage />} />
                </Route>
                
                {/* Events Module */}
                <Route element={<FeatureRoute feature="events.core" />}>
                  <Route path="events" element={<EventsDashboardPage />} />
                  <Route path="events/calendar" element={<EventListPage />} />
                  <Route path="events/participants" element={<EventParticipantsPage />} />
                  <Route path="events/reports" element={<EventReportsPage />} />
                  <Route path="events/:id" element={<EventDetailPage />} />
                </Route>

                {/* Consent Module */}
                <Route element={<FeatureRoute feature="events.consent" />}>
                  <Route path="consent" element={<ConsentRequestsPage />} />
                  <Route path="consent/templates" element={<ConsentTemplatesPage />} />
                </Route>

                {/* Transport Module */}
                <Route element={<FeatureRoute feature="events.transport" />}>
                  <Route path="transport" element={<TransportManagementPage />} />
                  <Route path="transport/reports" element={<TransportReportsPage />} />
                </Route>

                {/* Finance Module */}
                <Route element={<FeatureRoute feature="finance.core" />}>
                  <Route path="finance" element={<FinanceOverviewPage />} />
                  <Route path="finance/invoices" element={<InvoicesPage />} />
                  <Route path="finance/payments" element={<PaymentsPage />} />
                  <Route path="finance/charges" element={<ChargesPage />} />
                  <Route path="finance/outstanding" element={<OutstandingPage />} />
                  <Route path="finance/reports" element={<FinanceReportsPage />} />
                  <Route path="finance/charge-types" element={<ChargeTypesPage />} />
                </Route>

                {/* Communication Module */}
                <Route element={<FeatureRoute feature="communication.core" />}>
                  <Route path="communication" element={<CommunicationOverviewPage />} />
                  <Route path="communication/compose" element={<ComposeMessagePage />} />
                  <Route path="communication/history" element={<CommunicationHistoryPage />} />
                  <Route path="communication/templates" element={<CommunicationTemplatesPage />} />
                </Route>

                {/* Documents Module */}
                <Route element={<FeatureRoute feature="documents.core" />}>
                  <Route path="documents" element={<DocumentsOverviewPage />} />
                  <Route path="documents/generated" element={<GeneratedDocumentsPage />} />
                  <Route path="documents/templates" element={<DocumentTemplatesPage />} />
                  <Route path="documents/:id" element={<DocumentDetailPage />} />
                </Route>

                {/* Analytics Module */}
                <Route element={<FeatureRoute feature="analytics.core" />}>
                  <Route path="analytics" element={<AnalyticsOverviewPage />} />
                  <Route path="analytics/learners" element={<LearnerAnalyticsPage />} />
                  <Route path="analytics/programmes" element={<ProgrammeAnalyticsPage />} />
                  <Route path="analytics/attendance" element={<AttendanceAnalyticsPage />} />
                  <Route path="analytics/events" element={<EventAnalyticsPage />} />
                  <Route path="analytics/finance" element={<FinanceAnalyticsPage />} />
                  <Route path="analytics/reports" element={<ReportsPage />} />
                </Route>

                {/* Automation Module */}
                <Route element={<FeatureRoute feature="automation.core" />}>
                  <Route path="automation" element={<AutomationOverviewPage />} />
                  <Route path="automation/rules" element={<AutomationRulesPage />} />
                  <Route path="automation/rules/:id" element={<AutomationRuleDetailPage />} />
                  <Route path="automation/activity" element={<AutomationActivityPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                </Route>

                {/* Staff Operations Module (Phase 6A) */}
                <Route element={<FeatureRoute feature="staff_operations.core" />}>
                  <Route path="staff-operations" element={<StaffOperationsOverviewPage />} />
                  <Route path="staff-operations/assignments" element={<StaffAssignmentsPage />} />
                  <Route path="staff-operations/work-records" element={<StaffWorkRecordsPage />} />
                  <Route path="staff-operations/timesheets" element={<StaffTimesheetsPage />} />
                  <Route path="staff-operations/timesheets/:id" element={<StaffTimesheetDetailPage />} />
                  <Route path="staff-operations/verification" element={<StaffVerificationPage />} />
                  <Route path="staff-operations/availability" element={<StaffAvailabilityPage />} />
                  <Route path="staff-operations/workload" element={<StaffWorkloadPage />} />
                  <Route path="staff-operations/reports" element={<StaffReportsPage />} />
                </Route>

                {/* Organisation Settings Module (Phase 6B) */}
                <Route path="settings" element={<SettingsOverviewPage />} />
                <Route path="settings/organisation" element={<OrganisationProfilePage />} />
                <Route path="settings/calendar" element={<CalendarSettingsPage />} />
                <Route path="settings/programmes" element={<ProgrammeSettingsPage />} />
                <Route path="settings/attendance" element={<AttendanceSettingsPage />} />
                <Route path="settings/finance" element={<FinanceSettingsPage />} />
                <Route path="settings/portal" element={<PortalSettingsPage />} />
                <Route path="settings/staff" element={<StaffSettingsPage />} />
                <Route path="settings/communication" element={<CommunicationSettingsPage />} />
                <Route path="settings/automation" element={<AutomationSettingsPage />} />
                <Route path="settings/users" element={<UsersAndRolesPage />} />
                <Route path="settings/branding" element={<BrandingSettingsPage />} />
                <Route path="settings/system" element={<SystemSettingsPage />} />
                <Route path="settings/audit" element={<SettingsAuditPage />} />

                {/* In-app 404 Catch-all */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>

            {/* Global 404 Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </EntitlementProvider>
    </AuthProvider>
  );
}

export default App;
