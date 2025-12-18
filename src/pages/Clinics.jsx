import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User } from '@/entities/User';
import { Referral } from '@/entities/Referral';
import { PayoutRequest } from '@/entities/PayoutRequest';
import {
    Building2,
    Users,
    TrendingUp,
    DollarSign,
    Copy,
    CheckCircle,
    AlertCircle,
    Eye,
    Search,
    CreditCard,
    BarChart3,
    Trash2
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function ClinicsPageContent() {
    const [activeTab, setActiveTab] = useState('overview');
    const [clinics, setClinics] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedClinic, setSelectedClinic] = useState(null);

    useEffect(() => {
        loadClinicsData();
    }, []);

    const loadClinicsData = async () => {
        setLoading(true);
        try {
            // טעינת כל המרפאות מטבלת User
            const allClinics = await User.filter({ user_type: 'clinic' }, '-created_date');
            
            // עבור כל מרפאה - טעינת נתוני הפניות
            const clinicsWithData = await Promise.all(
                allClinics.map(async (clinic) => {
                    try {
                        // נתוני הפניות - מחפש לפי ID של המרפאה
                        const referrals = await Referral.filter({ clinic_id: clinic.id });
                        const completedReferrals = referrals.filter(r => r.status === 'completed');
                        const totalCommission = completedReferrals.reduce((sum, r) => sum + (r.commission || 0), 0);
                        
                        // נתוני תשלומים
                        const payouts = await PayoutRequest.filter({ clinic_id: clinic.id });
                        const totalPaid = payouts
                            .filter(p => p.status === 'הושלם')
                            .reduce((sum, p) => sum + p.amount_requested, 0);

                        return {
                            ...clinic,
                            name: clinic.clinic_name || clinic.full_name || 'ללא שם',
                            contact_person: clinic.contact_person || clinic.full_name,
                            total_referrals: referrals.length,
                            completed_referrals: completedReferrals.length,
                            total_commission: totalCommission,
                            total_paid: totalPaid,
                            pending_payment: totalCommission - totalPaid,
                            conversion_rate: referrals.length > 0 ? (completedReferrals.length / referrals.length * 100).toFixed(1) : 0,
                            this_month_referrals: referrals.filter(r => {
                                const refDate = new Date(r.created_date);
                                const now = new Date();
                                return refDate.getMonth() === now.getMonth() && refDate.getFullYear() === now.getFullYear();
                            }).length,
                            clicks: referrals.length // Using referrals as clicks for now
                        };
                    } catch (error) {
                        console.error(`Error loading data for clinic ${clinic.id}:`, error);
                        return {
                            ...clinic,
                            name: clinic.clinic_name || clinic.full_name || 'ללא שם',
                            contact_person: clinic.contact_person || clinic.full_name,
                            total_referrals: 0,
                            completed_referrals: 0,
                            total_commission: 0,
                            total_paid: 0,
                            pending_payment: 0,
                            conversion_rate: 0,
                            this_month_referrals: 0,
                            clicks: 0
                        };
                    }
                })
            );

            setClinics(clinicsWithData);

            // סטטיסטיקות כלליות
            const totalStats = {
                total_clinics: clinicsWithData.length,
                active_clinics: clinicsWithData.filter(c => c.status === 'active').length,
                pending_clinics: clinicsWithData.filter(c => c.status === 'pending').length,
                total_referrals: clinicsWithData.reduce((sum, c) => sum + c.total_referrals, 0),
                total_commission: clinicsWithData.reduce((sum, c) => sum + c.total_commission, 0),
                pending_payments: clinicsWithData.reduce((sum, c) => sum + c.pending_payment, 0),
                this_month_referrals: clinicsWithData.reduce((sum, c) => sum + c.this_month_referrals, 0)
            };

            setStats(totalStats);
        } catch (error) {
            console.error('Error loading clinics data:', error);
            alert('שגיאה בטעינת נתוני המרפאות');
        }
        setLoading(false);
    };

    const handleDeleteClinic = async (clinic) => {
        if (window.confirm(`האם אתה בטוח שברצונך למחוק את המרפאה "${clinic.name}"? הפעולה תמחק את המרפאה לצמיתות.`)) {
            try {
                await User.delete(clinic.id);
                alert('המרפאה נמחקה בהצלחה.');
                loadClinicsData();
            } catch (error) {
                console.error('Error deleting clinic:', error);
                alert('אירעה שגיאה במחיקת המרפאה: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const handleUpdateClinicStatus = async (clinicId, newStatus) => {
        try {
            await User.update(clinicId, { status: newStatus });
            loadClinicsData();
            alert(`סטטוס המרפאה עודכן בהצלחה ל-${newStatus}`);
        } catch (error) {
            console.error('Error updating clinic status:', error);
            alert('אירעה שגיאה בעדכון הסטטוס');
        }
    };
    
    const handlePayoutRequest = async (clinic) => {
        if (!clinic.pending_payment || clinic.pending_payment <= 0) {
            alert("אין יתרה זמינה למשיכה עבור מרפאה זו.");
            return;
        }
        
        if (!confirm(`האם ברצונך ליצור בקשת תשלום של ₪${clinic.pending_payment} עבור ${clinic.name}?`)) {
            return;
        }

        try {
            await PayoutRequest.create({
                clinic_id: clinic.id,
                clinic_name: clinic.name,
                amount_requested: clinic.pending_payment
            });
            
            alert("בקשת התשלום נוצרה בהצלחה.");
            loadClinicsData();
        } catch (error) {
            console.error("Error creating payout request:", error);
            alert("אירעה שגיאה ביצירת בקשת התשלום.");
        }
    };

    const copyReferralLink = (clinicId) => {
        const baseUrl = window.location.origin;
        const referralLink = `${baseUrl}/Welcome?ref=${clinicId}`;
        
        navigator.clipboard.writeText(referralLink).then(() => {
            alert('קישור ההפניה הועתק בהצלחה!');
        }).catch(err => {
            console.error('Failed to copy referral link:', err);
            alert('שגיאה בהעתקת הקישור');
        });
    };
    
    const getStatusBadge = (status) => {
        const statusStyles = {
            'active': { bg: 'bg-green-100', text: 'text-green-800', label: 'פעיל' },
            'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'ממתין לאישור' },
            'inactive': { bg: 'bg-red-100', text: 'text-red-800', label: 'לא פעיל' }
        };
        const style = statusStyles[status] || statusStyles['pending'];
        return (
            <Badge className={`${style.bg} ${style.text} font-bold text-xs px-2 py-1 border`}>
                {style.label}
            </Badge>
        );
    };

    const generateReferralLink = (clinicId) => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/Welcome?ref=${clinicId}`;
    };

    const filteredClinics = clinics.filter(clinic => {
        const matchesSearch = clinic.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             clinic.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             clinic.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || clinic.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const tabs = [
        { id: 'overview', label: 'סקירה כללית', icon: TrendingUp },
        { id: 'clinics', label: 'ניהול מרפאות', icon: Building2 },
        { id: 'analytics', label: 'דוחות וניתוחים', icon: BarChart3 }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5932EA] mx-auto mb-4"></div>
                    <p>טוען נתוני מרפאות...</p>
                </div>
            </div>
        );
    }

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-[0px_10px_60px_rgba(226,236,249,0.5)]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">מרפאות פעילות</p>
                                <p className="text-2xl font-bold text-[#5932EA]">{stats.active_clinics}</p>
                                <p className="text-sm text-gray-500">מתוך {stats.total_clinics}</p>
                            </div>
                            <Building2 className="w-8 h-8 text-[#5932EA]" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="border-none shadow-[0px_10px_60px_rgba(226,236,249,0.5)]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">הפניות החודש</p>
                                <p className="text-2xl font-bold text-green-600">{stats.this_month_referrals}</p>
                                <p className="text-sm text-gray-500">סה"כ {stats.total_referrals}</p>
                            </div>
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="border-none shadow-[0px_10px_60px_rgba(226,236,249,0.5)]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">עמלות ששולמו</p>
                                <p className="text-2xl font-bold text-blue-600">₪{stats.total_commission?.toLocaleString() || 0}</p>
                                <p className="text-sm text-gray-500">סה"כ כללי</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="border-none shadow-[0px_10px_60px_rgba(226,236,249,0.5)]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">ממתין לתשלום</p>
                                <p className="text-2xl font-bold text-orange-600">₪{stats.pending_payments?.toLocaleString() || 0}</p>
                                <p className="text-sm text-gray-500">לכל המרפאות</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Performing Clinics */}
            <Card className="border-none shadow-[0px_10px_60px_rgba(226,236,249,0.5)]">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">מרפאות מובילות החודש</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {clinics
                            .filter(c => c.status === 'active')
                            .sort((a, b) => b.this_month_referrals - a.this_month_referrals)
                            .slice(0, 5)
                            .map((clinic, index) => (
                            <div key={clinic.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                                    }`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{clinic.name}</p>
                                        <p className="text-sm text-gray-600">{clinic.contact_person}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <p className="font-bold text-green-600">{clinic.this_month_referrals}</p>
                                        <p className="text-xs text-gray-500">הפניות</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-blue-600">{clinic.conversion_rate}%</p>
                                        <p className="text-xs text-gray-500">המרה</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-orange-600">₪{clinic.pending_payment?.toLocaleString() || 0}</p>
                                        <p className="text-xs text-gray-500">ממתין</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {clinics.filter(c => c.status === 'active').length === 0 && (
                            <p className="text-gray-500 text-center py-4">אין מרפאות פעילות</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return renderOverview();
            case 'clinics':
                return renderClinicsManagement();
            case 'analytics':
                return renderAnalytics();
            default:
                return renderOverview();
        }
    };

    const renderClinicsManagement = () => (
        <div className="space-y-6">
            {/* Filter and Search Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-gray-500" />
                        <Input
                            placeholder="חפש מרפאה..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64"
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="סנן לפי סטטוס" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">כל הסטטוסים</SelectItem>
                            <SelectItem value="active">פעיל</SelectItem>
                            <SelectItem value="pending">ממתין לאישור</SelectItem>
                            <SelectItem value="inactive">לא פעיל</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Clinics Table */}
            <Card>
                <CardHeader>
                    <CardTitle>רשימת מרפאות ({filteredClinics.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">שם מרפאה</TableHead>
                                    <TableHead className="text-right">איש קשר</TableHead>
                                    <TableHead className="text-right">טלפון</TableHead>
                                    <TableHead className="text-right">אימייל</TableHead>
                                    <TableHead className="text-right">סטטוס</TableHead>
                                    <TableHead className="text-right">הפניות</TableHead>
                                    <TableHead className="text-right">עמלות</TableHead>
                                    <TableHead className="text-right">ממתין לתשלום</TableHead>
                                    <TableHead className="text-right">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClinics.map((clinic) => (
                                    <TableRow key={clinic.id}>
                                        <TableCell className="text-right font-medium">
                                            {clinic.name}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {clinic.contact_person}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {clinic.phone || 'לא צוין'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {clinic.email}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {getStatusBadge(clinic.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="text-center">
                                                <p className="font-bold text-green-600">{clinic.total_referrals}</p>
                                                <p className="text-xs text-gray-500">{clinic.conversion_rate}% המרה</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-bold text-blue-600">
                                                ₪{clinic.total_commission?.toLocaleString() || 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-bold text-orange-600">
                                                ₪{clinic.pending_payment?.toLocaleString() || 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedClinic(clinic)}
                                                >
                                                    <Eye className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => copyReferralLink(clinic.id)}
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </Button>
                                                {clinic.pending_payment > 0 && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                        onClick={() => handlePayoutRequest(clinic)}
                                                    >
                                                        <CreditCard className="w-3 h-3" />
                                                    </Button>
                                                )}
                                                <Select onValueChange={(value) => handleUpdateClinicStatus(clinic.id, value)}>
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue placeholder="שנה סטטוס" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">פעיל</SelectItem>
                                                        <SelectItem value="pending">ממתין</SelectItem>
                                                        <SelectItem value="inactive">לא פעיל</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDeleteClinic(clinic)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {filteredClinics.length === 0 && (
                            <div className="text-center py-8">
                                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-500">לא נמצאו מרפאות</h3>
                                <p className="text-gray-400">נסה לשנות את הפילטרים</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Clinic Details Modal */}
            {selectedClinic && (
                <Dialog open={!!selectedClinic} onOpenChange={() => setSelectedClinic(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{selectedClinic.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>איש קשר</Label>
                                    <p className="font-medium">{selectedClinic.contact_person}</p>
                                </div>
                                <div>
                                    <Label>אימייל</Label>
                                    <p className="font-medium">{selectedClinic.email}</p>
                                </div>
                                <div>
                                    <Label>טלפון</Label>
                                    <p className="font-medium">{selectedClinic.phone || 'לא צוין'}</p>
                                </div>
                                <div>
                                    <Label>כתובת</Label>
                                    <p className="font-medium">{selectedClinic.address || 'לא צוינה'}</p>
                                </div>
                            </div>

                            {/* Performance Stats */}
                            <div className="grid grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-blue-600">{selectedClinic.clicks}</p>
                                        <p className="text-sm text-gray-500">קליקים</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-green-600">{selectedClinic.total_referrals}</p>
                                        <p className="text-sm text-gray-500">הפניות</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-purple-600">{selectedClinic.conversion_rate}%</p>
                                        <p className="text-sm text-gray-500">המרה</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-orange-600">₪{selectedClinic.total_commission}</p>
                                        <p className="text-sm text-gray-500">עמלות</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Referral Link */}
                            <div>
                                <Label>קישור הפניה</Label>
                                <div className="flex gap-2 mt-2">
                                    <Input 
                                        value={generateReferralLink(selectedClinic.id)} 
                                        readOnly 
                                        className="font-mono text-sm"
                                    />
                                    <Button 
                                        onClick={() => copyReferralLink(selectedClinic.id)}
                                        variant="outline"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between pt-4">
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleUpdateClinicStatus(selectedClinic.id, 'active')}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle className="w-4 h-4 ml-2" />
                                        אשר מרפאה
                                    </Button>
                                    {selectedClinic.pending_payment > 0 && (
                                        <Button
                                            onClick={() => handlePayoutRequest(selectedClinic)}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            <CreditCard className="w-4 h-4 ml-2" />
                                            שלם ₪{selectedClinic.pending_payment}
                                        </Button>
                                    )}
                                </div>
                                <Button variant="outline" onClick={() => setSelectedClinic(null)}>
                                    סגור
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );

    const renderAnalytics = () => (
        <div className="space-y-6">
            {/* Monthly Performance Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>ביצועים חודשיים</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-semibold">הפניות לפי חודש</h4>
                            <div className="space-y-2">
                                {clinics.slice(0, 5).map((clinic, index) => (
                                    <div key={clinic.id} className="flex justify-between">
                                        <span className="text-sm">{clinic.name}</span>
                                        <span className="font-bold">{clinic.this_month_referrals}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <h4 className="font-semibold">עמלות שנצברו</h4>
                            <div className="space-y-2">
                                {clinics.slice(0, 5).map((clinic, index) => (
                                    <div key={clinic.id} className="flex justify-between">
                                        <span className="text-sm">{clinic.name}</span>
                                        <span className="font-bold">₪{clinic.total_commission}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <h4 className="font-semibold">שיעורי המרה</h4>
                            <div className="space-y-2">
                                {clinics.slice(0, 5).map((clinic, index) => (
                                    <div key={clinic.id} className="flex justify-between">
                                        <span className="text-sm">{clinic.name}</span>
                                        <span className="font-bold">{clinic.conversion_rate}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">סה"כ הכנסות מעמלות</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-600">₪{stats.total_commission?.toLocaleString() || 0}</p>
                        <p className="text-sm text-gray-500 mt-2">מכל המרפאות</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">ממתין לתשלום</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-orange-600">₪{stats.pending_payments?.toLocaleString() || 0}</p>
                        <p className="text-sm text-gray-500 mt-2">יש לשלם למרפאות</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">הפניות החודש</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-600">{stats.this_month_referrals || 0}</p>
                        <p className="text-sm text-gray-500 mt-2">הפניות חדשות</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">ניהול מרפאות</h1>
                    <p className="text-gray-600 mt-1">מערכת ניהול שותפים עסקיים</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-left">
                        <p className="text-sm text-gray-600">עדכון אחרון</p>
                        <p className="font-bold">{new Date().toLocaleTimeString('he-IL')}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === tab.id
                                ? 'bg-[#5932EA] text-white'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {renderTabContent()}
        </div>
    );
}

export default function Clinics() {
    return (
        <ProtectedRoute requiredRoles={['admin']}>
            <ClinicsPageContent />
        </ProtectedRoute>
    );
}