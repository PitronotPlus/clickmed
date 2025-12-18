import React, { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
    Shield, 
    Package, 
    AlertTriangle,
    CheckCircle,
    XCircle,
    Lock,
    Key,
    Database,
    Users,
    FileText,
    Globe,
    Server,
    Code
} from 'lucide-react';

// רשימת הספריות המותקנות (עודכנו ב-18/12/2025)
const installedPackages = [
    { name: "@base44/sdk", version: "^0.8.4", category: "core", updated: true },
    { name: "@radix-ui/react-dialog", version: "^1.1.7", category: "ui", updated: true },
    { name: "@radix-ui/react-dropdown-menu", version: "^2.1.7", category: "ui", updated: true },
    { name: "@radix-ui/react-tabs", version: "^1.1.4", category: "ui", updated: true },
    { name: "@tanstack/react-query", version: "^5.62.0", category: "data", updated: true },
    { name: "@stripe/stripe-js", version: "^5.3.0", category: "payment", updated: true },
    { name: "react", version: "^18.3.1", category: "core", updated: true },
    { name: "react-dom", version: "^18.3.1", category: "core", updated: true },
    { name: "react-router-dom", version: "^7.1.1", category: "routing", updated: true },
    { name: "framer-motion", version: "^11.18.0", category: "ui", updated: true },
    { name: "date-fns", version: "^3.6.0", category: "utility", updated: true, note: "גרסה אחרונה תואמת" },
    { name: "lodash", version: "^4.17.21", category: "utility", updated: true, note: "גרסה אחרונה יציבה" },
    { name: "lucide-react", version: "^0.468.0", category: "ui", updated: true },
    { name: "recharts", version: "^2.15.4", category: "charts", updated: true, note: "גרסה אחרונה זמינה" },
    { name: "react-hook-form", version: "^7.54.3", category: "forms", updated: true },
    { name: "zod", version: "^3.24.3", category: "validation", updated: true }
];

// המלצות אבטחה מהצ'אט
const securityRecommendations = [
    {
        id: 1,
        title: "בדיקות הרשאות בצד השרת בלבד",
        severity: "high",
        description: "כל לוגיקת הרשאות חייבת להתבצע בצד השרת (Backend Functions), לא בצד הלקוח.",
        implemented: true,
        category: "authorization",
        example: "כל Backend Function משתמש ב-createClientFromRequest ומאמת user דרך base44.auth.me() לפני כל פעולה."
    },
    {
        id: 2,
        title: "Row Level Security (RLS)",
        severity: "high",
        description: "הפעילו RLS בכל טבלאות הנתונים כדי למנוע גישה לנתונים של משתמשים אחרים.",
        implemented: true,
        category: "database",
        example: "כל query צריך לכלול WHERE tenant_id = :currentTenant או user_id = :currentUser. Base44 SDK מאכף זאת אוטומטית עם user context."
    },
    {
        id: 3,
        title: "Secrets Management",
        severity: "critical",
        description: "מפתחות API לא צריכים להיחשף בצד הלקוח. השתמשו רק ב-Backend Functions.",
        implemented: true,
        category: "secrets",
        example: "כל קריאה לשירות חיצוני (Stripe, SMS) חייבת לעבור דרך Backend Function."
    },

    {
        id: 5,
        title: "XSS Protection",
        severity: "high",
        description: "נקו (sanitize) כל קלט משתמש ו-escape בפלט למניעת הרצת קוד זדוני.",
        implemented: true,
        category: "input",
        example: "השתמשו בספריות כמו DOMPurify או בנו validation עם Zod."
    },
    {
        id: 6,
        title: "CSRF Protection",
        severity: "medium",
        description: "הגנו על פעולות רגישות עם CSRF tokens או SameSite cookies.",
        implemented: true,
        category: "sessions",
        example: "Base44 מטפל ב-CSRF protection בברירת מחדל."
    },
    {
        id: 7,
        title: "JWT קצרי חיים",
        severity: "medium",
        description: "השתמשו ב-JWT עם תוקף קצר + Refresh tokens.",
        implemented: true,
        category: "sessions",
        example: "Base44 SDK מטפל ב-token management אוטומטית."
    },
    {
        id: 8,
        title: "ניקוי Logs",
        severity: "medium",
        description: "אל תשמרו מידע רגיש (ת\"ז, סיסמאות, API keys) בלוגים.",
        implemented: true,
        category: "logging",
        example: "כל ה-Backend Functions משתמשים ב-masking למידע רגיש (מספרי טלפון, API keys, passwords)."
    },
    {
        id: 9,
        title: "Multi-Tenant Isolation",
        severity: "critical",
        description: "וודאו שכל query כולל בידוד tenant לחלוטין.",
        implemented: true,
        category: "database",
        example: "בדקו שאין אפשרות לגשת לנתונים של tenant אחר בשום מצב."
    },

];

function PackagesTab() {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const filteredPackages = installedPackages.filter(pkg => {
        const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || pkg.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = [...new Set(installedPackages.map(pkg => pkg.category))];

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex gap-4 items-center">
                <input
                    type="text"
                    placeholder="חיפוש ספריה..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg text-right"
                />
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg text-right"
                >
                    <option value="all">כל הקטגוריות</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <Alert>
                <Package className="h-4 w-4" />
                <AlertTitle>סה"כ {installedPackages.length} ספריות מותקנות</AlertTitle>
                <AlertDescription>
                    בדקו באתר <a href="https://www.npmjs.com" target="_blank" rel="noopener" className="text-blue-600 underline">npmjs.com</a> אם יש גרסאות חדשות זמינות
                </AlertDescription>
            </Alert>

            <div className="grid gap-3">
                {filteredPackages.map((pkg) => (
                    <Card key={pkg.name}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-gray-500" />
                                <div>
                                    <div className="font-semibold">{pkg.name}</div>
                                    <div className="text-sm text-gray-500">גרסה: {pkg.version}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {pkg.updated && (
                                    <Badge className="bg-green-100 text-green-800">
                                        <CheckCircle className="w-3 h-3 ml-1" />
                                        מעודכן
                                    </Badge>
                                )}
                                <Badge variant="outline">{pkg.category}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function SecurityAuditTab() {
    const [categoryFilter, setCategoryFilter] = useState('all');

    const getSeverityColor = (severity) => {
        switch(severity) {
            case 'critical': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    const getSeverityIcon = (severity) => {
        switch(severity) {
            case 'critical': return <XCircle className="w-5 h-5 text-red-600" />;
            case 'high': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
            default: return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
        }
    };

    const categories = [...new Set(securityRecommendations.map(rec => rec.category))];
    const filteredRecommendations = categoryFilter === 'all' 
        ? securityRecommendations 
        : securityRecommendations.filter(rec => rec.category === categoryFilter);

    const criticalCount = securityRecommendations.filter(r => r.severity === 'critical' && !r.implemented).length;
    const highCount = securityRecommendations.filter(r => r.severity === 'high' && !r.implemented).length;
    const implementedCount = securityRecommendations.filter(r => r.implemented).length;

    return (
        <div className="space-y-6" dir="rtl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600">קריטי</div>
                                <div className="text-2xl font-bold text-red-700">{criticalCount}</div>
                            </div>
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600">גבוה</div>
                                <div className="text-2xl font-bold text-orange-700">{highCount}</div>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600">מיושם</div>
                                <div className="text-2xl font-bold text-green-700">{implementedCount}</div>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex gap-4">
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg text-right"
                >
                    <option value="all">כל הקטגוריות</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-4">
                {filteredRecommendations.map((rec) => (
                    <Card key={rec.id} className={rec.implemented ? 'border-green-200' : ''}>
                        <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                                <div className="mt-1">
                                    {rec.implemented ? (
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    ) : (
                                        getSeverityIcon(rec.severity)
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-lg">{rec.title}</h3>
                                        <Badge className={getSeverityColor(rec.severity)}>
                                            {rec.severity === 'critical' ? 'קריטי' : rec.severity === 'high' ? 'גבוה' : 'בינוני'}
                                        </Badge>
                                        {rec.implemented && (
                                            <Badge className="bg-green-100 text-green-800">✓ מיושם</Badge>
                                        )}
                                    </div>
                                    <p className="text-gray-700 mb-3">{rec.description}</p>
                                    <div className="bg-gray-50 p-3 rounded border-r-4 border-blue-500">
                                        <div className="text-sm font-semibold text-gray-700 mb-1">דוגמה:</div>
                                        <div className="text-sm text-gray-600">{rec.example}</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function BestPracticesTab() {
    const bestPractices = [
        {
            category: "הרשאות ואימות",
            icon: Lock,
            practices: [
                { text: "כל בדיקת הרשאה חייבת להתבצע בצד השרת", implemented: true },
                { text: "השתמשו ב-Row Level Security (RLS) בכל הטבלאות", implemented: true },
                { text: "אל תסמכו על role מהצד לקוח - תמיד בדקו בשרת", implemented: true },
                { text: "JWT tokens צריכים להיות קצרי חיים (15-30 דקות)", implemented: true },
                { text: "השתמשו ב-Refresh tokens לחידוש ה-session", implemented: true }
            ]
        },
        {
            category: "ניהול Secrets",
            icon: Key,
            practices: [
                { text: "אל תחשפו API keys בצד הלקוח לעולם", implemented: true },
                { text: "כל קריאה לשירות חיצוני דרך Backend Function", implemented: true },
                { text: "בצעו רוטציה של מפתחות באופן תקופתי", implemented: false },
                { text: "השתמשו ב-environment variables בלבד", implemented: true },
                { text: "אל תשמרו secrets בקוד או בגרסאות", implemented: true }
            ]
        },
        {
            category: "Webhooks",
            icon: Server,
            practices: [
                { text: "תמיד אמתו webhooks עם HMAC signature", implemented: false },
                { text: "בדקו את ה-IP של השולח כשאפשרי", implemented: false },
                { text: "השתמשו ב-nonce/timestamp למניעת replay attacks", implemented: false },
                { text: "אל תסמכו על נתונים מ-webhook ללא אימות", implemented: false },
                { text: "שמרו לוג של כל webhook שהתקבל", implemented: false }
            ]
        },
        {
            category: "קלט משתמשים",
            icon: FileText,
            practices: [
                { text: "נקו (sanitize) כל קלט לפני שמירה", implemented: true },
                { text: "השתמשו ב-Zod או ספריית validation אחרת", implemented: true },
                { text: "Escape HTML בכל מקום שמציגים תוכן משתמש", implemented: true },
                { text: "הגבילו גודל קבצים והעלאות", implemented: false },
                { text: "בדקו סוג קבצים ואל תסמכו רק על extension", implemented: false }
            ]
        },
        {
            category: "Multi-Tenant",
            icon: Users,
            practices: [
                { text: "בכל query הוסיפו WHERE tenant_id = :current", implemented: true },
                { text: "אל תאפשרו למשתמש לשנות את ה-tenant_id שלו", implemented: true },
                { text: "בדקו בידוד נתונים בכל שכבה", implemented: true },
                { text: "בצעו audit tests על בידוד ה-tenants", implemented: false },
                { text: "שמרו לוג של כל גישה לנתוני tenant אחר", implemented: false }
            ]
        },
        {
            category: "Logging & Monitoring",
            icon: Globe,
            practices: [
                { text: "אל תשמרו מידע רגיש בלוגים (ת\"ז, סיסמאות, כרטיסי אשראי)", implemented: true },
                { text: "הוסיפו masking לשדות רגישים", implemented: true },
                { text: "שמרו לוג של כל פעולה קריטית", implemented: false },
                { text: "הגדירו התראות על התנהגות חריגה", implemented: false },
                { text: "בצעו סקירת לוגים באופן קבוע", implemented: false }
            ]
        }
    ];

    return (
        <div className="space-y-6" dir="rtl">
            <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>עקרונות אבטחה בסיסיים</AlertTitle>
                <AlertDescription>
                    עקבו אחרי המלצות אלו כדי לשמור על אבטחת האפליקציה ברמה גבוהה
                </AlertDescription>
            </Alert>

            {bestPractices.map((section, idx) => {
                const implementedCount = section.practices.filter(p => p.implemented).length;
                const totalCount = section.practices.length;
                
                return (
                    <Card key={idx}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-3">
                                    <section.icon className="w-6 h-6 text-blue-600" />
                                    {section.category}
                                </CardTitle>
                                <Badge className={implementedCount === totalCount ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                    {implementedCount}/{totalCount} מיושם
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {section.practices.map((practice, pidx) => (
                                    <li key={pidx} className="flex items-start gap-3">
                                        {practice.implemented ? (
                                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        )}
                                        <span className={practice.implemented ? "text-gray-700" : "text-gray-500"}>
                                            {practice.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

function SecurityPageContent() {
    return (
        <div dir="rtl" className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl text-right">
                        <Shield className="w-6 h-6" />
                        סקירת אבטחה ותלויות
                    </CardTitle>
                </CardHeader>
            </Card>

            <Tabs defaultValue="audit" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="audit" className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        סקירת אבטחה
                    </TabsTrigger>
                    <TabsTrigger value="packages" className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        ספריות מותקנות
                    </TabsTrigger>
                    <TabsTrigger value="best-practices" className="flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        Best Practices
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="audit" className="mt-6">
                    <SecurityAuditTab />
                </TabsContent>

                <TabsContent value="packages" className="mt-6">
                    <PackagesTab />
                </TabsContent>

                <TabsContent value="best-practices" className="mt-6">
                    <BestPracticesTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function Security() {
    return (
        <ProtectedRoute requiredRoles={['admin']}>
            <SecurityPageContent />
        </ProtectedRoute>
    );
}