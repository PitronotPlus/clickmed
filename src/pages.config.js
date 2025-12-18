import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Users from './pages/Users';
import Reports from './pages/Reports';
import HealthProducts from './pages/HealthProducts';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Welcome from './pages/Welcome';
import ScheduleAppointment from './pages/ScheduleAppointment';
import AdminPanel from './pages/AdminPanel';
import DoctorRequests from './pages/DoctorRequests';
import DoctorProfile from './pages/DoctorProfile';
import Partners from './pages/Partners';
import Clinics from './pages/Clinics';
import MedicalRecord from './pages/MedicalRecord';
import DoctorAdminPanel from './pages/DoctorAdminPanel';
import TicketDetails from './pages/TicketDetails';
import AdminTickets from './pages/AdminTickets';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import QuestionnaireBuilder from './pages/QuestionnaireBuilder';
import Office from './pages/Office';
import Backups from './pages/Backups';
import DoctorAppointments from './pages/DoctorAppointments';
import DoctorPatients from './pages/DoctorPatients';
import Credits from './pages/Credits';
import MyRequests from './pages/MyRequests';
import PricingPlans from './pages/PricingPlans';
import LandingPage from './pages/LandingPage';
import Tasks from './pages/Tasks';
import ConsultationRequest from './pages/ConsultationRequest';
import PatientMedicalRecord from './pages/PatientMedicalRecord';
import AppointmentPayment from './pages/AppointmentPayment';
import Home from './pages/Home';
import Security from './pages/Security';
import SecurityLogs from './pages/SecurityLogs';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Profile": Profile,
    "Users": Users,
    "Reports": Reports,
    "HealthProducts": HealthProducts,
    "Settings": Settings,
    "Help": Help,
    "Welcome": Welcome,
    "ScheduleAppointment": ScheduleAppointment,
    "AdminPanel": AdminPanel,
    "DoctorRequests": DoctorRequests,
    "DoctorProfile": DoctorProfile,
    "Partners": Partners,
    "Clinics": Clinics,
    "MedicalRecord": MedicalRecord,
    "DoctorAdminPanel": DoctorAdminPanel,
    "TicketDetails": TicketDetails,
    "AdminTickets": AdminTickets,
    "Messages": Messages,
    "Notifications": Notifications,
    "QuestionnaireBuilder": QuestionnaireBuilder,
    "Office": Office,
    "Backups": Backups,
    "DoctorAppointments": DoctorAppointments,
    "DoctorPatients": DoctorPatients,
    "Credits": Credits,
    "MyRequests": MyRequests,
    "PricingPlans": PricingPlans,
    "LandingPage": LandingPage,
    "Tasks": Tasks,
    "ConsultationRequest": ConsultationRequest,
    "PatientMedicalRecord": PatientMedicalRecord,
    "AppointmentPayment": AppointmentPayment,
    "Home": Home,
    "Security": Security,
    "SecurityLogs": SecurityLogs,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};