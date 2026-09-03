import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute, OnboardingRoute, PlatformRoute, FeatureRoute } from './components/layout/AuthRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { ActiveOrganisationProvider } from './contexts/ActiveOrganisationContext';
import { EntitlementProvider } from './contexts/EntitlementContext';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { LoadingState } from './components/ui/LoadingState';
import { releaseCapabilities } from './config/releaseCapabilities';
import { NotFoundPage } from './components/layout/NotFoundPage';

// Critical core entry paths (eagerly loaded for instant first paint)
import { LoginPage } from './features/auth/LoginPage';
import { AccessDisabledPage } from './features/auth/AccessDisabledPage';
import { FeatureAccessDeniedPage } from './features/platform/pages/FeatureAccessDeniedPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { LearnersPage } from './features/learners/LearnersPage';
import { LearnerProfilePage } from './features/learners/LearnerProfilePage';
import { OrganisationSelectionPage } from './features/account/OrganisationSelectionPage';
import { LandingPage } from './features/landing/LandingPage';
import { PricingPage } from './features/landing/PricingPage';
import { SelfServiceSignupPage } from './features/auth/SelfServiceSignupPage';
import { VerifyEmailPage } from './features/auth/VerifyEmailPage';
import { TermsPage } from './features/legal/TermsPage';
import { PrivacyPage } from './features/legal/PrivacyPage';
import { useAuth } from './contexts/AuthContext';
import { useActiveOrganisation } from './contexts/ActiveOrganisationContext';

// Core layout shells
import { PlatformLayout } from './components/layout/PlatformLayout';
import { GuardianPortalLayout } from './features/portal/components/GuardianPortalLayout';
import { GuardianProtectedRoute } from './features/portal/components/GuardianProtectedRoute';
import { GuardianPortalUnavailablePage } from './features/portal/pages/GuardianPortalUnavailablePage';

// Operational pages (Code-split)
const GuardiansPage = lazy(() => import('./features/guardians/GuardiansPage').then(m => ({ default: m.GuardiansPage })));
const ProgrammesPage = lazy(() => import('./features/programmes/ProgrammesPage').then(m => ({ default: m.ProgrammesPage })));
const GroupsPage = lazy(() => import('./features/groups/GroupsPage').then(m => ({ default: m.GroupsPage })));
const GroupDetailPage = lazy(() => import('./features/groups/GroupDetailPage').then(m => ({ default: m.GroupDetailPage })));
const StaffPage = lazy(() => import('./features/staff/StaffPage').then(m => ({ default: m.StaffPage })));
const EnrolmentsPage = lazy(() => import('./features/enrolments/EnrolmentsPage').then(m => ({ default: m.EnrolmentsPage })));
const SessionsPage = lazy(() => import('./features/sessions/SessionsPage').then(m => ({ default: m.SessionsPage })));
const SessionDetailPage = lazy(() => import('./features/sessions/SessionDetailPage').then(m => ({ default: m.SessionDetailPage })));
const AttendancePage = lazy(() => import('./features/attendance/AttendancePage').then(m => ({ default: m.AttendancePage })));
const FollowUpsPage = lazy(() => import('./features/followUps/FollowUpsPage').then(m => ({ default: m.FollowUpsPage })));
const MyOrganisationsPage = lazy(() => import('./features/account/MyOrganisationsPage').then(m => ({ default: m.MyOrganisationsPage })));
const OrganisationOnboardingPage = lazy(() => import('./features/onboarding/pages/OrganisationOnboardingPage').then(m => ({ default: m.OrganisationOnboardingPage })));

// Music Module
const MusicDashboardPage = lazy(() => import('./features/music/MusicDashboardPage').then(m => ({ default: m.MusicDashboardPage })));
const InstrumentsPage = lazy(() => import('./features/music/InstrumentsPage').then(m => ({ default: m.InstrumentsPage })));
const EnsemblesPage = lazy(() => import('./features/music/EnsemblesPage').then(m => ({ default: m.EnsemblesPage })));
const RepertoirePage = lazy(() => import('./features/music/RepertoirePage').then(m => ({ default: m.RepertoirePage })));
const PracticeLogsPage = lazy(() => import('./features/music/PracticeLogsPage').then(m => ({ default: m.PracticeLogsPage })));
const MusicAssessmentsPage = lazy(() => import('./features/music/MusicAssessmentsPage').then(m => ({ default: m.MusicAssessmentsPage })));

// Dance Module
const DanceDashboardPage = lazy(() => import('./features/dance/DanceDashboardPage').then(m => ({ default: m.DanceDashboardPage })));
const DanceLevelsPage = lazy(() => import('./features/dance/DanceLevelsPage').then(m => ({ default: m.DanceLevelsPage })));
const DanceClassesPage = lazy(() => import('./features/dance/DanceClassesPage').then(m => ({ default: m.DanceClassesPage })));
const ChoreographyPage = lazy(() => import('./features/dance/ChoreographyPage').then(m => ({ default: m.ChoreographyPage })));
const CostumesPage = lazy(() => import('./features/dance/CostumesPage').then(m => ({ default: m.CostumesPage })));
const DanceAssessmentsPage = lazy(() => import('./features/dance/DanceAssessmentsPage').then(m => ({ default: m.DanceAssessmentsPage })));
const DancePracticeLogsPage = lazy(() => import('./features/dance/DancePracticeLogsPage').then(m => ({ default: m.DancePracticeLogsPage })));

// Event Pages
const EventsDashboardPage = lazy(() => import('./features/events/EventsDashboardPage').then(m => ({ default: m.EventsDashboardPage })));
const EventListPage = lazy(() => import('./features/events/EventListPage').then(m => ({ default: m.EventListPage })));
const EventDetailPage = lazy(() => import('./features/events/EventDetailPage').then(m => ({ default: m.EventDetailPage })));
const EventParticipantsPage = lazy(() => import('./features/events/EventParticipantsPage').then(m => ({ default: m.EventParticipantsPage })));
const EventReportsPage = lazy(() => import('./features/events/EventReportsPage').then(m => ({ default: m.EventReportsPage })));

// Consent Pages
const ConsentRequestsPage = lazy(() => import('./features/consent/ConsentRequestsPage').then(m => ({ default: m.ConsentRequestsPage })));
const ConsentTemplatesPage = lazy(() => import('./features/consent/ConsentTemplatesPage').then(m => ({ default: m.ConsentTemplatesPage })));
const GuardianConsentPublicPage = lazy(() => import('./features/consent/GuardianConsentPublicPage').then(m => ({ default: m.GuardianConsentPublicPage })));

// Transport Pages
const TransportManagementPage = lazy(() => import('./features/transport/TransportManagementPage').then(m => ({ default: m.TransportManagementPage })));
const TransportReportsPage = lazy(() => import('./features/transport/TransportReportsPage').then(m => ({ default: m.TransportReportsPage })));

// Finance Pages
const FinanceOverviewPage = lazy(() => import('./features/finance/FinanceOverviewPage').then(m => ({ default: m.FinanceOverviewPage })));
const InvoicesPage = lazy(() => import('./features/finance/InvoicesPage').then(m => ({ default: m.InvoicesPage })));
const PaymentsPage = lazy(() => import('./features/finance/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const ChargesPage = lazy(() => import('./features/finance/ChargesPage').then(m => ({ default: m.ChargesPage })));
const OutstandingPage = lazy(() => import('./features/finance/OutstandingPage').then(m => ({ default: m.OutstandingPage })));
const FinanceReportsPage = lazy(() => import('./features/finance/FinanceReportsPage').then(m => ({ default: m.FinanceReportsPage })));
const ChargeTypesPage = lazy(() => import('./features/finance/ChargeTypesPage').then(m => ({ default: m.ChargeTypesPage })));

// Communication Pages
const CommunicationOverviewPage = lazy(() => import('./features/communication/CommunicationOverviewPage').then(m => ({ default: m.CommunicationOverviewPage })));
const ComposeMessagePage = lazy(() => import('./features/communication/ComposeMessagePage').then(m => ({ default: m.ComposeMessagePage })));
const CommunicationHistoryPage = lazy(() => import('./features/communication/CommunicationHistoryPage').then(m => ({ default: m.CommunicationHistoryPage })));
const CommunicationTemplatesPage = lazy(() => import('./features/communication/CommunicationTemplatesPage').then(m => ({ default: m.CommunicationTemplatesPage })));

// Document Pages
const DocumentsOverviewPage = lazy(() => import('./features/documents/DocumentsOverviewPage').then(m => ({ default: m.DocumentsOverviewPage })));
const DocumentDetailPage = lazy(() => import('./features/documents/DocumentDetailPage').then(m => ({ default: m.DocumentDetailPage })));
const DocumentTemplatesPage = lazy(() => import('./features/documents/DocumentTemplatesPage').then(m => ({ default: m.DocumentTemplatesPage })));
const GeneratedDocumentsPage = lazy(() => import('./features/documents/GeneratedDocumentsPage').then(m => ({ default: m.GeneratedDocumentsPage })));

// Analytics Pages
const AnalyticsOverviewPage = lazy(() => import('./features/analytics/AnalyticsOverviewPage').then(m => ({ default: m.AnalyticsOverviewPage })));
const LearnerAnalyticsPage = lazy(() => import('./features/analytics/LearnerAnalyticsPage').then(m => ({ default: m.LearnerAnalyticsPage })));
const ProgrammeAnalyticsPage = lazy(() => import('./features/analytics/ProgrammeAnalyticsPage').then(m => ({ default: m.ProgrammeAnalyticsPage })));
const AttendanceAnalyticsPage = lazy(() => import('./features/analytics/AttendanceAnalyticsPage').then(m => ({ default: m.AttendanceAnalyticsPage })));
const EventAnalyticsPage = lazy(() => import('./features/analytics/EventAnalyticsPage').then(m => ({ default: m.EventAnalyticsPage })));
const FinanceAnalyticsPage = lazy(() => import('./features/analytics/FinanceAnalyticsPage').then(m => ({ default: m.FinanceAnalyticsPage })));
const ReportsPage = lazy(() => import('./features/analytics/ReportsPage').then(m => ({ default: m.ReportsPage })));

// Automation & Notification Pages
const AutomationOverviewPage = lazy(() => import('./features/automation/AutomationOverviewPage').then(m => ({ default: m.AutomationOverviewPage })));
const AutomationRulesPage = lazy(() => import('./features/automation/AutomationRulesPage').then(m => ({ default: m.AutomationRulesPage })));
const AutomationRuleDetailPage = lazy(() => import('./features/automation/AutomationRuleDetailPage').then(m => ({ default: m.AutomationRuleDetailPage })));
const AutomationActivityPage = lazy(() => import('./features/automation/AutomationActivityPage').then(m => ({ default: m.AutomationActivityPage })));
const NotificationsPage = lazy(() => import('./features/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })));

// Staff Operations Pages (Phase 6A)
const StaffOperationsOverviewPage = lazy(() => import('./features/staffOperations/StaffOperationsOverviewPage').then(m => ({ default: m.StaffOperationsOverviewPage })));
const StaffAssignmentsPage = lazy(() => import('./features/staffOperations/StaffAssignmentsPage').then(m => ({ default: m.StaffAssignmentsPage })));
const StaffWorkRecordsPage = lazy(() => import('./features/staffOperations/StaffWorkRecordsPage').then(m => ({ default: m.StaffWorkRecordsPage })));
const StaffTimesheetsPage = lazy(() => import('./features/staffOperations/StaffTimesheetsPage').then(m => ({ default: m.StaffTimesheetsPage })));
const StaffTimesheetDetailPage = lazy(() => import('./features/staffOperations/StaffTimesheetDetailPage').then(m => ({ default: m.StaffTimesheetDetailPage })));
const StaffVerificationPage = lazy(() => import('./features/staffOperations/StaffVerificationPage').then(m => ({ default: m.StaffVerificationPage })));
const StaffAvailabilityPage = lazy(() => import('./features/staffOperations/StaffAvailabilityPage').then(m => ({ default: m.StaffAvailabilityPage })));
const StaffWorkloadPage = lazy(() => import('./features/staffOperations/StaffWorkloadPage').then(m => ({ default: m.StaffWorkloadPage })));
const StaffReportsPage = lazy(() => import('./features/staffOperations/StaffReportsPage').then(m => ({ default: m.StaffReportsPage })));

// Organisation Settings Pages (Phase 6B)
const SettingsOverviewPage = lazy(() => import('./features/settings/SettingsOverviewPage').then(m => ({ default: m.SettingsOverviewPage })));
const OrganisationProfilePage = lazy(() => import('./features/settings/OrganisationProfilePage').then(m => ({ default: m.OrganisationProfilePage })));
const CalendarSettingsPage = lazy(() => import('./features/settings/CalendarSettingsPage').then(m => ({ default: m.CalendarSettingsPage })));
const ProgrammeSettingsPage = lazy(() => import('./features/settings/ProgrammeSettingsPage').then(m => ({ default: m.ProgrammeSettingsPage })));
const AttendanceSettingsPage = lazy(() => import('./features/settings/AttendanceSettingsPage').then(m => ({ default: m.AttendanceSettingsPage })));
const FinanceSettingsPage = lazy(() => import('./features/settings/FinanceSettingsPage').then(m => ({ default: m.FinanceSettingsPage })));
const OrganisationBillingPage = lazy(() => import('./features/billing/pages/OrganisationBillingPage').then(m => ({ default: m.OrganisationBillingPage })));
const BillingCheckoutReturnPage = lazy(() => import('./features/billing/pages/BillingCheckoutReturnPage').then(m => ({ default: m.BillingCheckoutReturnPage })));
const PortalSettingsPage = lazy(() => import('./features/settings/PortalSettingsPage').then(m => ({ default: m.PortalSettingsPage })));
const StaffSettingsPage = lazy(() => import('./features/settings/StaffSettingsPage').then(m => ({ default: m.StaffSettingsPage })));
const CommunicationSettingsPage = lazy(() => import('./features/settings/CommunicationSettingsPage').then(m => ({ default: m.CommunicationSettingsPage })));
const AutomationSettingsPage = lazy(() => import('./features/settings/AutomationSettingsPage').then(m => ({ default: m.AutomationSettingsPage })));
const UsersAndRolesPage = lazy(() => import('./features/settings/UsersAndRolesPage').then(m => ({ default: m.UsersAndRolesPage })));
const BrandingSettingsPage = lazy(() => import('./features/settings/BrandingSettingsPage').then(m => ({ default: m.BrandingSettingsPage })));
const SystemSettingsPage = lazy(() => import('./features/settings/SystemSettingsPage').then(m => ({ default: m.SystemSettingsPage })));
const SettingsAuditPage = lazy(() => import('./features/settings/SettingsAuditPage').then(m => ({ default: m.SettingsAuditPage })));

// Guardian Portal Pages (Phase 7A)
const GuardianLoginPage = lazy(() => import('./features/portal/pages/GuardianLoginPage').then(m => ({ default: m.GuardianLoginPage })));
const GuardianInvitationAcceptPage = lazy(() => import('./features/portal/pages/GuardianInvitationAcceptPage').then(m => ({ default: m.GuardianInvitationAcceptPage })));
const GuardianDashboardPage = lazy(() => import('./features/portal/pages/GuardianDashboardPage').then(m => ({ default: m.GuardianDashboardPage })));
const GuardianLearnersPage = lazy(() => import('./features/portal/pages/GuardianLearnersPage').then(m => ({ default: m.GuardianLearnersPage })));
const GuardianLearnerDetailPage = lazy(() => import('./features/portal/pages/GuardianLearnerDetailPage').then(m => ({ default: m.GuardianLearnerDetailPage })));
const GuardianAttendancePage = lazy(() => import('./features/portal/pages/GuardianAttendancePage').then(m => ({ default: m.GuardianAttendancePage })));
const GuardianEventsPage = lazy(() => import('./features/portal/pages/GuardianEventsPage').then(m => ({ default: m.GuardianEventsPage })));
const GuardianConsentPage = lazy(() => import('./features/portal/pages/GuardianConsentPage').then(m => ({ default: m.GuardianConsentPage })));
const GuardianConsentSubmitPage = lazy(() => import('./features/portal/pages/GuardianConsentSubmitPage').then(m => ({ default: m.GuardianConsentSubmitPage })));
const GuardianTransportPage = lazy(() => import('./features/portal/pages/GuardianTransportPage').then(m => ({ default: m.GuardianTransportPage })));
const GuardianFinancePage = lazy(() => import('./features/portal/pages/GuardianFinancePage').then(m => ({ default: m.GuardianFinancePage })));
const GuardianInvoiceViewPage = lazy(() => import('./features/portal/pages/GuardianInvoiceViewPage').then(m => ({ default: m.GuardianInvoiceViewPage })));
const GuardianReceiptViewPage = lazy(() => import('./features/portal/pages/GuardianReceiptViewPage').then(m => ({ default: m.GuardianReceiptViewPage })));
const GuardianDocumentsPage = lazy(() => import('./features/portal/pages/GuardianDocumentsPage').then(m => ({ default: m.GuardianDocumentsPage })));
const GuardianMessagesPage = lazy(() => import('./features/portal/pages/GuardianMessagesPage').then(m => ({ default: m.GuardianMessagesPage })));
const GuardianProfilePage = lazy(() => import('./features/portal/pages/GuardianProfilePage').then(m => ({ default: m.GuardianProfilePage })));
const LearnerPortalNoticePage = lazy(() => import('./features/portal/pages/LearnerPortalNoticePage').then(m => ({ default: m.LearnerPortalNoticePage })));

// Platform Super Admin Console Pages (SaaS 1B)
const PlatformDashboardPage = lazy(() => import('./features/platform/pages/PlatformDashboardPage').then(m => ({ default: m.PlatformDashboardPage })));
const PlatformOrganisationsPage = lazy(() => import('./features/platform/pages/PlatformOrganisationsPage').then(m => ({ default: m.PlatformOrganisationsPage })));
const PlatformOrganisationDetailPage = lazy(() => import('./features/platform/pages/PlatformOrganisationDetailPage').then(m => ({ default: m.PlatformOrganisationDetailPage })));
const PlatformUsersPage = lazy(() => import('./features/platform/pages/PlatformUsersPage').then(m => ({ default: m.PlatformUsersPage })));
const PlatformHealthPage = lazy(() => import('./features/platform/pages/PlatformHealthPage').then(m => ({ default: m.PlatformHealthPage })));
const PlatformAuditPage = lazy(() => import('./features/platform/pages/PlatformAuditPage').then(m => ({ default: m.PlatformAuditPage })));
const PlatformSettingsPage = lazy(() => import('./features/platform/pages/PlatformSettingsPage').then(m => ({ default: m.PlatformSettingsPage })));
const PlatformPlansPage = lazy(() => import('./features/platform/pages/PlatformPlansPage').then(m => ({ default: m.PlatformPlansPage })));
const PlatformFeaturesPage = lazy(() => import('./features/platform/pages/PlatformFeaturesPage').then(m => ({ default: m.PlatformFeaturesPage })));
const PlatformSubscriptionsPage = lazy(() => import('./features/platform/pages/PlatformSubscriptionsPage').then(m => ({ default: m.PlatformSubscriptionsPage })));
const PlatformAnalyticsPage = lazy(() => import('./features/platform/pages/PlatformAnalyticsPage').then(m => ({ default: m.PlatformAnalyticsPage })));
const PlatformFeedbackPage = lazy(() => import('./features/platform/pages/PlatformFeedbackPage').then(m => ({ default: m.PlatformFeedbackPage })));

const PageFallback = () => (
  <div className="flex min-h-[360px] w-full items-center justify-center py-12" role="status" aria-live="polite">
    <LoadingState message="Loading module…" size="md" />
  </div>
);

function LandingOrDashboardGate() {
  const { user, authUser, loading } = useAuth();
  const { activeOrganisationId: organisationId, isResolvingOrganisation } = useActiveOrganisation();

  if (loading || isResolvingOrganisation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" role="status" aria-live="polite">
        <LoadingState message="Loading ArtsFlow OS…" size="md" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  if (authUser?.accountStatus === 'disabled') {
    return <Navigate to="/access-disabled" replace />;
  }

  if (authUser?.platformRole === 'super_admin') {
    return <Navigate to="/platform" replace />;
  }

  if (authUser?.role === 'guardian') {
    return <Navigate to="/portal" replace />;
  }

  if (authUser?.role === 'learner') {
    return <Navigate to="/learner-portal" replace />;
  }

  if (!organisationId) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ActiveOrganisationProvider>
          <EntitlementProvider>
            <Router>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  {/* Public Marketing & Acquisition Routes */}
                  <Route path="/" element={<LandingOrDashboardGate />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/start-trial" element={<SelfServiceSignupPage />} />
                  <Route path="/signup" element={<SelfServiceSignupPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />

                  {/* Public Operational Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/access-disabled" element={<AccessDisabledPage />} />
                  <Route path="/access-denied" element={<FeatureAccessDeniedPage />} />
                  <Route path="/consent/submit/:requestId" element={<GuardianConsentPublicPage />} />
                  <Route path="/portal/login" element={releaseCapabilities.guardianPortal ? <GuardianLoginPage /> : <GuardianPortalUnavailablePage />} />
                  <Route path="/portal/invite/:token" element={releaseCapabilities.guardianPortal ? <GuardianInvitationAcceptPage /> : <GuardianPortalUnavailablePage />} />
                  <Route path="/learner-portal" element={<LearnerPortalNoticePage />} />
                  <Route path="/select-organisation" element={<OrganisationSelectionPage />} />

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

                  {/* SaaS 1B: Platform Super Admin Console Routes */}
                  <Route element={<PlatformRoute />}>
                    <Route path="/platform" element={<PlatformLayout />}>
                      <Route index element={<PlatformDashboardPage />} />
                      <Route path="organisations" element={<PlatformOrganisationsPage />} />
                      <Route path="organisations/:organisationId" element={<PlatformOrganisationDetailPage />} />
                      <Route path="feedback" element={<PlatformFeedbackPage />} />
                      <Route path="plans" element={<PlatformPlansPage />} />
                      <Route path="subscriptions" element={<PlatformSubscriptionsPage />} />
                      <Route path="analytics" element={<PlatformAnalyticsPage />} />
                      <Route path="features" element={<PlatformFeaturesPage />} />
                      <Route path="users" element={<PlatformUsersPage />} />
                      <Route path="health" element={<PlatformHealthPage />} />
                      <Route path="audit" element={<PlatformAuditPage />} />
                      <Route path="settings" element={<PlatformSettingsPage />} />
                    </Route>
                  </Route>

                  {/* SaaS 3A: Customer Guided Onboarding */}
                  <Route element={<OnboardingRoute />}>
                    <Route path="/onboarding" element={<OrganisationOnboardingPage />} />
                    <Route path="/setup" element={<Navigate to="/onboarding" replace />} />
                  </Route>

                  {/* Protected Application Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<Layout />}>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="account/organisations" element={<MyOrganisationsPage />} />
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
                      <Route path="billing" element={<Navigate to="/settings/billing" replace />} />
                      <Route path="settings/billing" element={<OrganisationBillingPage />} />
                      <Route path="settings/billing/success" element={<BillingCheckoutReturnPage />} />
                      <Route path="settings/billing/cancelled" element={<BillingCheckoutReturnPage />} />
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
              </Suspense>
            </Router>
          </EntitlementProvider>
        </ActiveOrganisationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
