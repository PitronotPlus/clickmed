
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User } from '@/entities/User';
import { Referral } from '@/entities/Referral';
import { PayoutRequest } from '@/entities/PayoutRequest';
import {
    Building2,
    Users,
    MapPin,
    Phone,
    Mail,
    Calendar,
    TrendingUp,
    DollarSign,
    Copy,
    CheckCircle,
    AlertCircle,
    Edit,
    Save,
    X,
    Banknote,
    Wallet,
    History
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const statusStyles = {
    'ממתין': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    'בטיפול': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'הושלם': { bg: 'bg-green-100', text: 'text-green-700' },
    'נדחה': { bg: 'bg-red-100', text: 'text-red-700' },
};

export default function PartnersPage() {
    const [user, setUser] = useState(null); // This holds the clinic's user object
    const [referrals, setReferrals] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [stats, setStats] = useState({
        totalClicks: 0,
        totalRegistrations: 0,
        totalCommission: 0,
        totalPaid: 0,
        availableForPayout: 0,
        conversionRate: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingBank, setIsEditingBank] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [bankForm, setBankForm] = useState({});
    const [copySuccess, setCopySuccess] = useState(false);
    const [isAdminView, setIsAdminView] = useState(false); // New state for admin view

    useEffect(() => {
        loadPageData(); // Renamed function
    }, []);

    const loadPageData = async () => {
        setIsLoading(true);
        setError(''); // Clear previous errors
        try {
            const currentUser = await User.me();

            if (currentUser.permissions?.includes('admin')) { // Check for admin access
                setIsAdminView(true);
                // Admin can view this page. Load the first active clinic as an example.
                const clinics = await User.filter({ user_type: 'clinic', status: 'active' }, '-created_date', 1);
                if (clinics.length > 0) {
                    await loadDataForClinic(clinics[0]); // Load data for the first active clinic
                } else {
                    setError('לא נמצאו מרפאות פעילות להצגה.');
                    setUser(null); // Explicitly set user to null if no clinics
                }
            } else if (currentUser.user_type === 'clinic') { // Original clinic logic
                setIsAdminView(false); // Ensure this is false for clinic users
                await loadDataForClinic(currentUser);
            } else { // Neither admin nor clinic user
                setError('אין לך הרשאה לגשת לדף זה או שהחשבון שלך לא מוגדר כמרפאה.');
                setUser(null);
            }
        } catch (error) {
            console.error('Error loading page data:', error);
            setError('שגיאה בטעינת נתוני המרפאה. אנא נסה להתחבר מחדש.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // New function to load data for a specific clinic user (used by both clinics and admins)
    const loadDataForClinic = async (clinicUser) => {
        setUser(clinicUser);
        setEditForm({
            clinic_name: clinicUser.clinic_name || '',
            contact_person: clinicUser.contact_person || '',
            phone: clinicUser.phone || '',
            address: clinicUser.address || '',
            specialties: clinicUser.specialties?.join(', ') || '',
            description: clinicUser.description || ''
        });
        setBankForm({
            bank_name: clinicUser.bank_name || '',
            branch_number: clinicUser.branch_number || '',
            account_number: clinicUser.account_number || '',
            account_holder_name: clinicUser.account_holder_name || ''
        });

        const clinicReferrals = await Referral.filter({ clinic_id: clinicUser.id });
        const clinicPayouts = await PayoutRequest.filter({ clinic_id: clinicUser.id }, '-created_date');
        
        setReferrals(clinicReferrals);
        setPayouts(clinicPayouts);

        const totalCommission = clinicReferrals
            .filter(r => r.status === 'completed')
            .reduce((sum, r) => sum + (r.commission || 0), 0);
        
        const totalPaid = clinicPayouts
            .filter(p => p.status === 'הושלם')
            .reduce((sum, p) => sum + p.amount_requested, 0);

        const completedReferrals = clinicReferrals.filter(r => r.status === 'completed').length;
        // As per outline, totalClicks is now based on referrals length
        const totalClicks = clinicReferrals.length; 
        const conversionRate = totalClicks > 0 ? (completedReferrals / totalClicks * 100) : 0;
        
        setStats({
            totalClicks: totalClicks,
            totalRegistrations: completedReferrals,
            totalCommission: totalCommission,
            totalPaid: totalPaid,
            availableForPayout: totalCommission - totalPaid,
            conversionRate: conversionRate
        });
    }

    const handleSaveProfile = async () => {
        if (isAdminView) { // Disable editing in admin view
            setError("עריכה אינה זמינה בתצוגת מנהל.");
            return;
        }
        try {
            const updateData = {
                ...editForm,
                specialties: editForm.specialties.split(',').map(s => s.trim())
            };
            await User.updateMyUserData(updateData);
            setUser(prev => ({ ...prev, ...updateData, specialties: updateData.specialties }));
            setIsEditingProfile(false);
            setError(''); // Clear any previous error
        } catch (error) {
            console.error('Error updating clinic profile:', error);
            setError('שגיאה בעדכון הפרופיל');
        }
    };

    const handleSaveBankDetails = async () => {
        if (isAdminView) { // Disable editing in admin view
            setError("עריכה אינה זמינה בתצוגת מנהל.");
            return;
        }
        try {
            await User.updateMyUserData(bankForm);
            setUser(prev => ({ ...prev, ...bankForm }));
            setIsEditingBank(false);
            setError(''); // Clear any previous error
        } catch (error) {
            console.error('Error updating bank details:', error);
            setError('שגיאה בעדכון פרטי הבנק');
        }
    };

    const handleRequestPayout = async () => {
        if (isAdminView) { // Disable request payout in admin view
            alert("לא ניתן לבקש תשלום בתצוגת מנהל.");
            return;
        }
        if (stats.availableForPayout <= 0) {
            alert("אין יתרה זמינה למשיכה.");
            return;
        }
        if (!user.bank_name || !user.account_number) {
            alert("יש לעדכן פרטי חשבון בנק מלאים לפני בקשת תשלום.");
            return;
        }
        if (!confirm(`האם ברצונך לבקש משיכה של ₪${stats.availableForPayout}?`)) return;

        try {
            await PayoutRequest.create({
                clinic_id: user.id,
                clinic_name: user.clinic_name || user.full_name,
                amount_requested: stats.availableForPayout
            });
            alert("בקשת המשיכה נשלחה בהצלחה. היא תטופל בימים הקרובים.");
            loadPageData(); // Refresh data
        } catch (error) {
            console.error("Error requesting payout:", error);
            alert("אירעה שגיאה בשליחת בקשת המשיכה.");
        }
    };
    
    const generateReferralLink = () => {
        if (!user?.id) return '';
        // Use the actual working application URL
        const currentUrl = window.location.origin;
        return `${currentUrl}/Welcome?ref=${user.id}`;
    };

    const copyReferralLink = async () => {
        try {
            await navigator.clipboard.writeText(generateReferralLink());
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 3000);
        } catch (error) {
            console.error('Failed to copy link:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64" dir="rtl">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5932EA] mx-auto mb-4"></div>
                    <p>טוען נתוני מרפאה...</p>
                </div>
            </div>
        );
    }

    // Handles errors after loading, or if no user/clinic data could be loaded
    if (!user && !isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-6" dir="rtl">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>שגיאה</AlertTitle>
                    <AlertDescription>{error || 'לא נמצא משתמש מרפאה להצגה.'}</AlertDescription>
                </Alert>
            </div>
        );
    }
    
    // Safety net for cases where user might be null without an explicit error message
    if (!user) { 
        return null;
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">פאנל שותפים</h1>
                <Badge className="bg-green-100 text-green-800">
                    {user?.status === 'active' ? 'פעיל' : 'ממתין לאישור'}
                </Badge>
            </div>
            
            {isAdminView && (
                 <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>תצוגת מנהל</AlertTitle>
                    <AlertDescription>
                        אתה צופה בפאנל השותפים של: <strong>{user.clinic_name || user.full_name}</strong>.
                    </AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="overview" className="w-full" dir="rtl">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
                    <TabsTrigger value="billing">תשלומים וחיובים</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6 mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Building2 className="w-6 h-6 text-[#5932EA]" />
                                <CardTitle>פרופיל מרפאה</CardTitle>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => isEditingProfile ? setIsEditingProfile(false) : setIsEditingProfile(true)}
                                className="flex items-center gap-2"
                                disabled={isAdminView}
                            >
                                {isEditingProfile ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                                {isEditingProfile ? 'ביטול' : 'עריכה'}
                            </Button>
                        </CardHeader>
                        <CardContent className="text-right">
                            {!isEditingProfile ? (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-gray-500" />
                                            <span className="font-semibold">שם המרפאה:</span>
                                            <span className="mr-auto">{user?.clinic_name || 'לא הוגדר'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-500" />
                                            <span className="font-semibold">איש קשר:</span>
                                            <span className="mr-auto">{user?.contact_person || 'לא הוגדר'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-500" />
                                            <span className="font-semibold">טלפון:</span>
                                            <span className="mr-auto">{user?.phone || 'לא הוגדר'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-500" />
                                            <span className="font-semibold">אימייל:</span>
                                            <span className="mr-auto">{user?.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-500" />
                                            <span className="font-semibold">כתובת:</span>
                                            <span className="mr-auto">{user?.address || 'לא הוגדר'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span className="font-semibold">תאריך הצטרפות:</span>
                                            <span className="mr-auto">{user?.created_date ? format(new Date(user.created_date), 'dd/MM/yyyy', { locale: he }) : 'לא זמין'}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="clinic_name">שם המרפאה</Label>
                                            <Input 
                                                id="clinic_name" 
                                                value={editForm.clinic_name} 
                                                onChange={(e) => setEditForm({...editForm, clinic_name: e.target.value})}
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="contact_person">איש קשר</Label>
                                            <Input 
                                                id="contact_person" 
                                                value={editForm.contact_person} 
                                                onChange={(e) => setEditForm({...editForm, contact_person: e.target.value})}
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="phone">טלפון</Label>
                                            <Input 
                                                id="phone" 
                                                value={editForm.phone} 
                                                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="address">כתובת</Label>
                                            <Input 
                                                id="address" 
                                                value={editForm.address} 
                                                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                                                className="text-right"
                                            />
                                        </div>
                                    </div>
                                    <Button onClick={handleSaveProfile} className="flex items-center gap-2">
                                        <Save className="w-4 h-4" />
                                        שמור שינויים
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-600">סך לחיצות</p>
                                        <p className="text-2xl font-bold">{stats.totalClicks}</p>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-blue-600" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-600">הרשמות</p>
                                        <p className="text-2xl font-bold">{stats.totalRegistrations}</p>
                                    </div>
                                    <Users className="w-8 h-8 text-green-600" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-600">סך עמלות</p>
                                        <p className="text-2xl font-bold">₪{stats.totalCommission}</p>
                                    </div>
                                    <DollarSign className="w-8 h-8 text-yellow-600" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-600">שיעור המרה</p>
                                        <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-purple-600" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-right">קישור הפנייה</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Button onClick={copyReferralLink} variant="outline" className="flex items-center gap-2">
                                    {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copySuccess ? 'הועתק!' : 'העתק'}
                                </Button>
                                <Input value={generateReferralLink()} readOnly className="flex-1 text-left" dir="ltr"/>
                            </div>
                            <p className="text-sm text-gray-600 mt-2 text-right">שתף את הקישור הזה כדי להפנות מטופלים למערכת ולקבל עמלה על כל הרשמה מוצלחת</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="billing" className="space-y-6 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="w-5 h-5"/>
                                סיכום כספים
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">סך הכל עמלות</p>
                                <p className="text-2xl font-bold text-gray-800">₪{stats.totalCommission}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">סכום ששולם</p>
                                <p className="text-2xl font-bold text-green-600">₪{stats.totalPaid}</p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">זמין למשיכה</p>
                                <p className="text-2xl font-bold text-blue-600">₪{stats.availableForPayout}</p>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                             <div className="flex items-center gap-3">
                                <Banknote className="w-6 h-6 text-[#5932EA]" />
                                <CardTitle>פרטי חשבון בנק לתשלום</CardTitle>
                            </div>
                            <Button 
                                variant="outline" 
                                onClick={() => setIsEditingBank(!isEditingBank)} 
                                className="flex items-center gap-2" 
                                disabled={isAdminView}
                            >
                                {isEditingBank ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                                {isEditingBank ? 'ביטול' : 'עריכה'}
                            </Button>
                        </CardHeader>
                        <CardContent className="text-right">
                            {!isEditingBank ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex justify-between">
                                        <span className="font-semibold">שם בנק:</span>
                                        <span>{user?.bank_name || 'לא הוגדר'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">מספר סניף:</span>
                                        <span>{user?.branch_number || 'לא הוגדר'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">מספר חשבון:</span>
                                        <span>{user?.account_number || 'לא הוגדר'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">שם בעל החשבון:</span>
                                        <span>{user?.account_holder_name || 'לא הוגדר'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="bank_name">שם הבנק</Label>
                                            <Input 
                                                id="bank_name" 
                                                value={bankForm.bank_name} 
                                                onChange={(e) => setBankForm({...bankForm, bank_name: e.target.value})}
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="branch_number">מספר סניף</Label>
                                            <Input 
                                                id="branch_number" 
                                                value={bankForm.branch_number} 
                                                onChange={(e) => setBankForm({...bankForm, branch_number: e.target.value})}
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="account_number">מספר חשבון</Label>
                                            <Input 
                                                id="account_number" 
                                                value={bankForm.account_number} 
                                                onChange={(e) => setBankForm({...bankForm, account_number: e.target.value})}
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="account_holder_name">שם בעל החשבון</Label>
                                            <Input 
                                                id="account_holder_name" 
                                                value={bankForm.account_holder_name} 
                                                onChange={(e) => setBankForm({...bankForm, account_holder_name: e.target.value})}
                                                className="text-right"
                                            />
                                        </div>
                                    </div>
                                    <Button onClick={handleSaveBankDetails} className="flex items-center gap-2">
                                        <Save className="w-4 h-4"/>
                                        שמור פרטי בנק
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <History className="w-6 h-6 text-[#5932EA]" />
                                <CardTitle>היסטוריית משיכות</CardTitle>
                            </div>
                            <Button 
                                onClick={handleRequestPayout} 
                                disabled={stats.availableForPayout <= 0 || isAdminView}
                            >
                                בקש תשלום (₪{stats.availableForPayout})
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">תאריך בקשה</TableHead>
                                            <TableHead className="text-right">סכום</TableHead>
                                            <TableHead className="text-right">סטטוס</TableHead>
                                            <TableHead className="text-right">תאריך טיפול</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payouts.length > 0 ? payouts.map(payout => (
                                            <TableRow key={payout.id}>
                                                <TableCell className="text-right">{format(new Date(payout.created_date), 'dd/MM/yyyy', { locale: he })}</TableCell>
                                                <TableCell className="text-right">₪{payout.amount_requested}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge className={`${statusStyles[payout.status]?.bg} ${statusStyles[payout.status]?.text}`}>
                                                        {payout.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{payout.processed_date ? format(new Date(payout.processed_date), 'dd/MM/yyyy', { locale: he }) : '-'}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan="4" className="text-center">לא נמצאו בקשות משיכה.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
