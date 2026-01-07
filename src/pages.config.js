import AdminPanel from './pages/AdminPanel';
import AdminTickets from './pages/AdminTickets';
import AppointmentPayment from './pages/AppointmentPayment';
import Backups from './pages/Backups';
import Clinics from './pages/Clinics';
import ConsultationRequest from './pages/ConsultationRequest';
import Credits from './pages/Credits';
import Dashboard from './pages/Dashboard';
import DoctorAdminPanel from './pages/DoctorAdminPanel';
import DoctorAppointments from './pages/DoctorAppointments';
import DoctorPatients from './pages/DoctorPatients';
import DoctorProfile from './pages/DoctorProfile';
import DoctorRequests from './pages/DoctorRequests';
import DoctorTemplates from './pages/DoctorTemplates';
import HealthProducts from './pages/HealthProducts';
import Help from './pages/Help';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import MedicalRecord from './pages/MedicalRecord';
import Messages from './pages/Messages';
import MyRequests from './pages/MyRequests';
import Notifications from './pages/Notifications';
import Office from './pages/Office';
import Partners from './pages/Partners';
import PatientMedicalRecord from './pages/PatientMedicalRecord';
import PricingPlans from './pages/PricingPlans';
import Profile from './pages/Profile';
import QuestionnaireBuilder from './pages/QuestionnaireBuilder';
import Register from './pages/Register';
import Reports from './pages/Reports';
import ScheduleAppointment from './pages/ScheduleAppointment';
import Security from './pages/Security';
import SecurityLogs from './pages/SecurityLogs';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import TicketDetails from './pages/TicketDetails';
import Users from './pages/Users';
import FillQuestionnaire from './pages/FillQuestionnaire';
import UploadDocuments from './pages/UploadDocuments';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminPanel": AdminPanel,
    "AdminTickets": AdminTickets,
    "AppointmentPayment": AppointmentPayment,
    "Backups": Backups,
    "Clinics": Clinics,
    "ConsultationRequest": ConsultationRequest,
    "Credits": Credits,
    "Dashboard": Dashboard,
    "DoctorAdminPanel": DoctorAdminPanel,
    "DoctorAppointments": DoctorAppointments,
    "DoctorPatients": DoctorPatients,
    "DoctorProfile": DoctorProfile,
    "DoctorRequests": DoctorRequests,
    "DoctorTemplates": DoctorTemplates,
    "HealthProducts": HealthProducts,
    "Help": Help,
    "Home": Home,
    "LandingPage": LandingPage,
    "MedicalRecord": MedicalRecord,
    "Messages": Messages,
    "MyRequests": MyRequests,
    "Notifications": Notifications,
    "Office": Office,
    "Partners": Partners,
    "PatientMedicalRecord": PatientMedicalRecord,
    "PricingPlans": PricingPlans,
    "Profile": Profile,
    "QuestionnaireBuilder": QuestionnaireBuilder,
    "Register": Register,
    "Reports": Reports,
    "ScheduleAppointment": ScheduleAppointment,
    "Security": Security,
    "SecurityLogs": SecurityLogs,
    "Settings": Settings,
    "Tasks": Tasks,
    "TicketDetails": TicketDetails,
    "Users": Users,
    "FillQuestionnaire": FillQuestionnaire,
    "UploadDocuments": UploadDocuments,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};