
import {
    Home, ShieldCheck, Headset, Briefcase, Building2, Users, LayoutGrid,
    FileText, User, CalendarCheck, BarChart2, FlaskConical, Settings, HelpCircle, Archive, CreditCard,
    LayoutDashboard,
    Calendar,
    Stethoscope,
    Building,
    MessageSquare,
    Bell,
    FilePlus,
    Database,
    HandCoins,
    HeartPulse
} from "lucide-react";

export const navItems = [
    { title: "דשבורד", icon: Home, url: "Dashboard", description: "דף הבית הראשי למטופלים", permissions: ["patient"] },
    { title: "בקשות וזימון תורים", icon: CalendarCheck, url: "MyRequests", description: "צפייה וניהול של כל הבקשות והתורים", permissions: ["patient"] },
    { title: "התיק הרפואי שלי", icon: FileText, url: "MedicalRecord", description: "צפייה וניהול תיק רפואי (מטופל)", permissions: ["patient"] },
    { title: "פרופיל אישי", icon: User, url: "Profile", description: "ניהול פרטים אישיים (מטופל)", permissions: ["patient"] },
    { title: "מוצרים בריאותיים", icon: FlaskConical, url: "HealthProducts", description: "קטלוג מוצרים ושירותים", permissions: ["patient"] },
    { title: "עזרה", icon: HelpCircle, url: "Help", description: "מרכז עזרה ותמיכה", permissions: ["all"] },
    
    // Doctor pages
    { title: "פרופיל אישי (רופאים)", icon: User, url: "DoctorProfile", description: "ניהול פרטים אישיים (רופא)", permissions: ["doctor", "admin"] },
    { title: "בקשות וזימון תורים (רופאים)", icon: CalendarCheck, url: "DoctorRequests", description: "ניהול בקשות ותורים (רופא)", permissions: ["doctor", "admin"] },
    { title: "פאנל ניהול (רופאים)", icon: LayoutGrid, url: "DoctorAdminPanel", description: "דשבורד ניהולי לרופאים", permissions: ["doctor", "admin"] },
    
    // Admin & Office pages
    { title: "פאנל ניהול", icon: ShieldCheck, url: "AdminPanel", description: "ניהול כללי למנהלי מערכת", permissions: ["admin"] },
    { title: "פניות תמיכה", icon: Headset, url: "AdminTickets", description: "מעקב וטיפול בפניות תמיכה", permissions: ["admin", "office"] },
    { title: "משרד", icon: Briefcase, url: "Office", description: "כלים תפעוליים לצוות המשרד", permissions: ["admin", "office"] },
    { title: "מרפאות (אדמין)", icon: Building2, url: "Clinics", description: "ניהול מרפאות שותפות (אדמין)", permissions: ["admin"] },
    { title: "שותפים (מרפאה)", icon: Users, url: "Partners", description: "פאנל ניהול למרפאות שותפות", permissions: ["clinic", "admin"] },
    { title: "משתמשים", icon: Users, url: "Users", description: "ניהול משתמשי המערכת", permissions: ["admin"] },
    { title: "דוחות ובקרה", icon: BarChart2, url: "Reports", description: "צפייה בדוחות וניתוח נתונים", permissions: ["admin", "office"] },
    { title: "גיבויים", icon: Archive, url: "Backups", description: "גיבוי נתונים וקבצי המערכת", permissions: ["admin"] },
    {
        title: 'קרדיטים ותקשורת',
        url: 'Credits',
        icon: HandCoins, // Changed icon from CreditCard to HandCoins
        description: 'נהל את יתרות הקרדיט שלך לתקשורת', // Updated description
        permissions: ['admin']
    },
    { title: "הגדרות", icon: Settings, url: "Settings", description: "הגדרות מערכת (אדמין)", permissions: ["admin"] },
    { title: "לוג אבטחה", icon: ShieldCheck, url: "SecurityLogs", description: "מעקב אחר פעילות קריטית", permissions: ["admin"] }
];
