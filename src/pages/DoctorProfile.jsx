
import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User as UserIcon, Mail, Phone, Award, Briefcase, Edit, Shield, FileText, Globe, MessageSquare, MapPin, Camera, Clock, Youtube } from 'lucide-react';
import EditDoctorProfileModal from '@/components/doctors/EditDoctorProfileModal';
import EditContactInfoModal from '@/components/doctors/EditContactInfoModal';
import EditProfessionalInfoModal from '@/components/doctors/EditProfessionalInfoModal';
import EditSocialLinksModal from '@/components/doctors/EditSocialLinksModal';
import EditCertificatesModal from '@/components/doctors/EditCertificatesModal';
import EditAvatarModal from '@/components/doctors/EditAvatarModal';
import EditAvailabilityModal from '@/components/doctors/EditAvailabilityModal';
import { DoctorAvailability } from '@/entities/DoctorAvailability';
import { DoctorException } from '@/entities/DoctorException';

export default function DoctorProfilePage() {
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAdminView, setIsAdminView] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [availability, setAvailability] = useState([]);
    const [exceptions, setExceptions] = useState([]);

    // State for modals - preserved existing individual modal states
    const [isMainModalOpen, setIsMainModalOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isProfessionalModalOpen, setIsProfessionalModalOpen] = useState(false);
    const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
    const [isCertificatesModalOpen, setIsCertificatesModalOpen] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            let displayedDoctor = null;
            let currentIsAdminView = false; // Initialize here

            try {
                const loggedInUser = await User.me();
                const impersonatedUserId = sessionStorage.getItem('impersonatedUserId');
                const isAdminLoggedIn = loggedInUser.role === 'admin' || loggedInUser.permissions?.includes('admin');

                // CRITICAL FIX: Admin view is ONLY when admin is NOT impersonating.
                currentIsAdminView = isAdminLoggedIn && !impersonatedUserId;

                if (impersonatedUserId) {
                    // Case 1: Admin is impersonating another user. The view should be as the user sees it.
                    console.log(`[DoctorProfile] Impersonation mode. Fetching user ID: ${impersonatedUserId}`);
                    displayedDoctor = await User.get(impersonatedUserId);
                    // When impersonating, the editor is the impersonated user, so not admin view in terms of UI controls
                } else if (loggedInUser && loggedInUser.user_type === 'doctor') {
                    // Case 2: Doctor viewing their own profile
                    displayedDoctor = loggedInUser;
                } else if (isAdminLoggedIn) {
                    // Case 3: Admin logged in, not impersonating, viewing a sample doctor
                    // currentIsAdminView is already true due to the line above this block.
                    const doctors = await User.filter({ user_type: 'doctor', status: 'active' }, '-created_date', 1);
                    if (doctors.length > 0) {
                        displayedDoctor = doctors[0];
                    } else {
                        setError('לא נמצאו רופאים פעילים במערכת להצגת פרופיל לדוגמה.');
                    }
                } else {
                    // Case 4: Not authorized
                    setError('לא נמצא פרופיל רופא או שאין לך הרשאה מתאימה.');
                }

                setDoctor(displayedDoctor);
                setIsAdminView(currentIsAdminView); // Set the corrected view status

                if (displayedDoctor && displayedDoctor.id) {
                    const [avail, except] = await Promise.all([
                        DoctorAvailability.filter({ doctor_id: displayedDoctor.id }),
                        DoctorException.filter({ doctor_id: displayedDoctor.id })
                    ]);
                    setAvailability(avail);
                    setExceptions(except);
                } else {
                    setAvailability([]);
                    setExceptions([]);
                }

            } catch (err) {
                console.error("Error fetching doctor data:", err);
                setError("אירעה שגיאה בטעינת הפרופיל.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    
    const handleProfileUpdate = async () => {
        // Close all modals FIRST
        setIsMainModalOpen(false);
        setIsContactModalOpen(false);
        setIsProfessionalModalOpen(false);
        setIsSocialModalOpen(false);
        setIsCertificatesModalOpen(false);
        setIsAvatarModalOpen(false);
        setIsAvailabilityModalOpen(false);
        
        // CRITICAL FIX: Force a full page reload.
        // This is the simplest and most reliable way to ensure that ALL components
        // (including the main Layout and its banner) re-fetch the latest user data.
        window.location.reload();
    };

    // Helper function to get day name in Hebrew
    const getDayName = (dayNumber) => {
        const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        return days[dayNumber] || '';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64" dir="rtl">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#5932EA] mx-auto mb-4" />
                    <p>טוען פרופיל רופא...</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center p-8 text-red-500 bg-red-50 rounded-lg">{error}</div>;
    }

    if (!doctor) {
        return <div className="text-center p-8 text-gray-500">לא נמצא מידע להצגה.</div>;
    }

    return (
        <>
            <div className="max-w-6xl mx-auto p-6 space-y-8" dir="rtl">
                {isAdminView && (
                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader>
                            <CardTitle className="text-blue-800 flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                תצוגת מנהל
                            </CardTitle>
                            <CardDescription className="text-blue-700 pt-1">
                                אתה צופה בפרופיל של <strong>{doctor?.display_name || doctor?.full_name}</strong>.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
                
                {/* Header Card */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 p-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="relative">
                                <img 
                                    src={doctor.avatar || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/03e9ff525_6d1f028bc30367a84e0b1efd8a8742d7e99fd62a.png"}
                                    alt={doctor.display_name || doctor.full_name}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                                />
                                {!isAdminView && (
                                    <Button 
                                        size="icon" 
                                        variant="outline" 
                                        className="absolute bottom-1 right-1 bg-white/80 backdrop-blur-sm rounded-full w-10 h-10 hover:bg-white"
                                        onClick={() => setIsAvatarModalOpen(true)}
                                    >
                                        <Camera className="w-5 h-5 text-gray-600" />
                                    </Button>
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-right">
                                <h1 className="text-3xl font-bold text-gray-800">{doctor.display_name || doctor.full_name}</h1>
                                <p className="text-lg text-gray-600 mt-1">{doctor.specialties?.[0] || 'רופא'}</p>
                                <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                                    {doctor.specialties?.map(s => <Badge key={s} variant="secondary" className="text-sm">{s}</Badge>)}
                                </div>
                            </div>
                            {!isAdminView && (
                                <Button onClick={() => setIsMainModalOpen(true)} className="bg-[#5932EA] hover:bg-[#4d2ac7]">
                                    <Edit className="ml-2 w-4 h-4" />
                                    ערוך פרופיל ראשי
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                </Card>

                {/* CRITICAL: Price validation warning MOVED TO TOP */}
                {(!doctor.consultation_fee || doctor.consultation_fee < 10) && !isAdminView && (
                    <Card className="mt-6 border-red-200 bg-red-50">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <span className="text-red-600 text-2xl">🚫</span>
                                </div>
                                <div>
                                    <h3 className="text-red-800 font-bold text-lg">חסר מחיר ייעוץ!</h3>
                                    <p className="text-red-700 text-sm">לא ניתן לקבל תורים ללא הגדרת מחיר</p>
                                </div>
                            </div>
                            <div className="bg-white border border-red-200 rounded-lg p-4 mb-4">
                                <h4 className="font-semibold text-red-800 mb-2">מה עליך לעשות:</h4>
                                <ul className="text-red-700 text-sm space-y-1 list-disc list-inside">
                                    <li>הגדר מחיר ייעוץ (מינימום 10 ש"ח)</li>
                                    <li>המחיר יוצג למטופלים בעת קביעת תור</li>
                                    <li>לאחר הגדרת המחיר תוכל לקבל ולאשר תורים</li>
                                </ul>
                            </div>
                            <Button 
                                onClick={() => setIsProfessionalModalOpen(true)}
                                className="bg-red-600 hover:bg-red-700 text-white w-full"
                            >
                                <Edit className="w-4 h-4 ml-2" />
                                הגדר מחיר ייעוץ עכשיו
                            </Button>
                        </CardContent>
                    </Card>
                )}
                
                {/* Success message when price is set */}
                {doctor.consultation_fee && doctor.consultation_fee >= 10 && !isAdminView && (
                    <Card className="mt-6 border-green-200 bg-green-50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-green-600 text-lg">✅</span>
                            </div>
                            <div>
                                <p className="text-green-800 font-semibold">מוכן לקבל תורים!</p>
                                <p className="text-green-700 text-sm">מחיר הייעוץ שלך: ₪{doctor.consultation_fee}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
                    <TabsList className="grid w-full grid-cols-1 md:grid-cols-6">
                        <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
                        <TabsTrigger value="contact">פרטי קשר</TabsTrigger>
                        <TabsTrigger value="professional">מידע מקצועי</TabsTrigger>
                        <TabsTrigger value="certificates">תעודות</TabsTrigger>
                        <TabsTrigger value="social">קישורים חברתיים</TabsTrigger>
                        <TabsTrigger value="availability">זמינות</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6" dir="rtl">
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-6"> {/* Changed to 1 column grid */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserIcon className="w-5 h-5" />
                                        מידע אישי
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">שם מלא:</span>
                                        <span className="font-medium">{doctor.full_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">שם תצוגה:</span>
                                        <span className="font-medium">{doctor.display_name || 'לא הוגדר'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">אימייל:</span>
                                        <span className="font-medium">{doctor.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">טלפון:</span>
                                        <span className="font-medium">{doctor.phone || 'לא הוזן'}</span>
                                    </div>
                                </CardContent>
                            </Card>
                            {/* Removed the "פרטים מקצועיים" card from overview tab */}
                        </div>
                        
                        {doctor.bio && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>אודות</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700">{doctor.bio}</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="contact" className="mt-6" dir="rtl">
                        <Card>
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle className="flex items-center gap-2">
                                    <Phone className="w-5 h-5" />
                                    פרטי קשר ומיקום
                                </CardTitle>
                                {!isAdminView && <Button variant="outline" size="sm" onClick={() => setIsContactModalOpen(true)}><Edit className="w-3 h-3 ml-1"/> ערוך</Button>}
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-gray-500" />
                                        <div>
                                            <p className="font-medium">אימייל</p>
                                            <p className="text-gray-600">{doctor.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-5 h-5 text-gray-500" />
                                        <div>
                                            <p className="font-medium">טלפון</p>
                                            <p className="text-gray-600">{doctor.phone || 'לא הוזן'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-gray-500" />
                                        <div>
                                            <p className="font-medium">כתובת</p>
                                            <p className="text-gray-600">{doctor.address || 'לא הוזן'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium mb-3">מקומות עבודה</p>
                                    {doctor.working_locations && doctor.working_locations.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {doctor.working_locations.map((location, index) => (
                                                <Badge key={index} variant="outline">{location}</Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-600">לא הוגדרו מקומות עבודה</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="professional" className="mt-6" dir="rtl">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="w-5 h-5" />
                                        התמחויות
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {doctor.specialties && doctor.specialties.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {doctor.specialties.map((specialty, index) => (
                                                <Badge key={index} className="bg-blue-100 text-blue-800">
                                                    {specialty}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-600">לא הוגדרו התמחויות</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row justify-between items-center">
                                    <CardTitle className="flex items-center gap-2">
                                        <Briefcase className="w-5 h-5" />
                                        מידע מקצועי
                                    </CardTitle>
                                    {!isAdminView && (
                                        <Button variant="outline" size="sm" onClick={() => setIsProfessionalModalOpen(true)}>
                                            <Edit className="w-3 h-3 ml-1"/> ערוך
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">רישיון:</span>
                                        <span className="font-medium">{doctor.license_number || 'לא הוזן'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">שנות ניסיון:</span>
                                        <span className="font-medium">{doctor.years_of_experience || 'לא צוין'} שנים</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">עלות ייעוץ:</span>
                                        <span className={`font-semibold ${doctor.consultation_fee && doctor.consultation_fee >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                                            {doctor.consultation_fee && doctor.consultation_fee >= 10 ? `₪${doctor.consultation_fee}` : 'לא הוגדרה - חובה!'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">מקבל ביטוח:</span>
                                        <span className="font-medium">{doctor.accepts_insurance ? 'כן' : 'לא'}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">השכלה:</p>
                                        <p className="text-gray-700 mt-1">{doctor.education || 'לא הוזן מידע על השכלה'}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">שפות:</p>
                                        {doctor.languages && doctor.languages.length > 0 ? (
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {doctor.languages.map((lang, index) => (
                                                    <Badge key={index} variant="outline">
                                                        {lang}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-600 mt-1">לא הוגדרו שפות</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="certificates" className="mt-6" dir="rtl">
                        <Card>
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    תעודות והסמכות
                                </CardTitle>
                                {!isAdminView && <Button variant="outline" size="sm" onClick={() => setIsCertificatesModalOpen(true)}><Edit className="w-3 h-3 ml-1"/> ערוך</Button>}
                            </CardHeader>
                            <CardContent>
                                {doctor.certificates && doctor.certificates.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {doctor.certificates.map((cert, index) => (
                                            <div key={index} className="border rounded-lg p-4 flex flex-col items-start gap-4">
                                                {cert.url && (
                                                    <a href={cert.url} target="_blank" rel="noopener noreferrer">
                                                        <img src={cert.url} alt={cert.name} className="w-full h-40 object-cover rounded-md mb-2 cursor-pointer transition-transform hover:scale-105" />
                                                    </a>
                                                )}
                                                <div className="flex-1">
                                                    <h4 className="font-semibold">{cert.name}</h4>
                                                    {cert.description && (
                                                        <p className="text-sm text-gray-600 mt-1">{cert.description}</p>
                                                    )}
                                                    {cert.date && (
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            תאריך: {new Date(cert.date).toLocaleDateString('he-IL')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-600">לא הועלו תעודות</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="social" className="mt-6" dir="rtl">
                        <Card>
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="w-5 h-5" />
                                    קישורים חברתיים ואתרים
                                </CardTitle>
                                {!isAdminView && <Button variant="outline" size="sm" onClick={() => setIsSocialModalOpen(true)}><Edit className="w-3 h-3 ml-1"/> ערוך</Button>}
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div className="space-y-4">
                                    {doctor.website && (
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-5 h-5 text-gray-500" />
                                            <div>
                                                <p className="font-medium">אתר אישי</p>
                                                <a 
                                                    href={doctor.website} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline break-all"
                                                >
                                                    {doctor.website}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {doctor.youtube && (
                                        <div className="flex items-center gap-3">
                                            <Youtube className="w-5 h-5 text-red-500" />
                                            <div>
                                                <p className="font-medium">YouTube</p>
                                                <a 
                                                    href={doctor.youtube} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-red-600 hover:underline"
                                                >
                                                    צפה בערוץ
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {doctor.whatsapp && (
                                        <div className="flex items-center gap-3">
                                            <MessageSquare className="w-5 h-5 text-green-500" />
                                            <div>
                                                <p className="font-medium">WhatsApp</p>
                                                <a 
                                                    href={doctor.whatsapp} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-green-600 hover:underline"
                                                >
                                                    שלח הודעה
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {doctor.telegram && (
                                        <div className="flex items-center gap-3">
                                            <MessageSquare className="w-5 h-5 text-blue-500" />
                                            <div>
                                                <p className="font-medium">Telegram</p>
                                                <a 
                                                    href={doctor.telegram} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    פתח ב-Telegram
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="availability" className="mt-6" dir="rtl">
                        <Card>
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    זמינות שבועית
                                </CardTitle>
                                {!isAdminView && (
                                    <Button variant="outline" size="sm" onClick={() => setIsAvailabilityModalOpen(true)}>
                                        <Edit className="w-3 h-3 ml-1"/> ערוך זמינות
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                {availability.length > 0 ? (
                                    <div className="space-y-4">
                                        {availability
                                            .sort((a, b) => a.day_of_week - b.day_of_week)
                                            .map((item) => (
                                                <div key={item.day_of_week} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-20 font-semibold text-gray-700">
                                                            {getDayName(item.day_of_week)}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Clock className="w-4 h-4" />
                                                            <span>{item.start_time} - {item.end_time}</span>
                                                        </div>
                                                        {item.break_start && item.break_end && (
                                                            <div className="text-xs text-gray-500">
                                                                (הפסקה: {item.break_start} - {item.break_end})
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                            {item.appointment_duration} דק' לתור
                                                        </span>
                                                        {item.location && (
                                                            <span className="text-gray-600">
                                                                📍 {item.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-8">
                                        <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                        <p className="text-lg mb-2">לא הוגדרה זמינות</p>
                                        <p className="text-sm">קבע את ימי העבודה ושעות הזמינות שלך</p>
                                        {!isAdminView && (
                                            <Button 
                                                onClick={() => setIsAvailabilityModalOpen(true)} 
                                                className="mt-4 bg-[#5932EA] hover:bg-[#4d2ac7]"
                                            >
                                                הגדר זמינות
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* All modals */}
            {isMainModalOpen && (
                <EditDoctorProfileModal
                    user={doctor}
                    isOpen={isMainModalOpen}
                    onClose={() => setIsMainModalOpen(false)}
                    onProfileUpdate={handleProfileUpdate}
                />
            )}
            {isContactModalOpen && (
                <EditContactInfoModal
                    user={doctor}
                    isOpen={isContactModalOpen}
                    onClose={() => setIsContactModalOpen(false)}
                    onProfileUpdate={handleProfileUpdate}
                />
            )}
            {isProfessionalModalOpen && (
                <EditProfessionalInfoModal
                    user={doctor}
                    isOpen={isProfessionalModalOpen}
                    onClose={() => setIsProfessionalModalOpen(false)}
                    onProfileUpdate={handleProfileUpdate}
                />
            )}
            {isSocialModalOpen && (
                <EditSocialLinksModal
                    user={doctor}
                    isOpen={isSocialModalOpen}
                    onClose={() => setIsSocialModalOpen(false)}
                    onProfileUpdate={handleProfileUpdate}
                />
            )}
            {isCertificatesModalOpen && (
                <EditCertificatesModal
                    user={doctor}
                    isOpen={isCertificatesModalOpen}
                    onClose={() => setIsCertificatesModalOpen(false)}
                    onProfileUpdate={handleProfileUpdate}
                />
            )}
            {isAvatarModalOpen && (
                <EditAvatarModal
                    user={doctor}
                    isOpen={isAvatarModalOpen}
                    onClose={() => setIsAvatarModalOpen(false)}
                    onProfileUpdate={handleProfileUpdate}
                />
            )}
            {isAvailabilityModalOpen && (
                <EditAvailabilityModal
                    user={doctor}
                    isOpen={isAvailabilityModalOpen}
                    onClose={() => setIsAvailabilityModalOpen(false)}
                    onAvailabilityUpdate={handleProfileUpdate}
                />
            )}
        </>
    );
}
