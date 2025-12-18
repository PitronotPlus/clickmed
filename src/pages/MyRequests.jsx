
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User } from '@/entities/User';
import { Request } from '@/entities/Request';
import { Appointment } from '@/entities/Appointment';
import RequestDetailsModal from '@/components/requests/RequestDetailsModal';
import AppointmentDetailsModal from '@/components/appointments/AppointmentDetailsModal'; // Import new modal
import ChatModal from '@/components/requests/ChatModal';
import { format } from 'date-fns';
import { he } from 'date-fns/locale'; // Import Hebrew locale
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, CreditCard, Loader2, Calendar, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const requestStatusStyles = {
    'בקשה בבדיקה': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    'ממתין לתשלום': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    'מאושר': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    'מאושר עבור עליה': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    'טופל': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    'בקשה נדחתה': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    'ממתין לזימון תור': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    'בוטל': { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
    'מחפש רופא': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' }
};

const appointmentStatusStyles = {
    'ממתין לאישור': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    'ממתין לתשלום': { bg: 'bg-orange-100', text: 'text-orange-700' },
    'מאושר': { bg: 'bg-green-100', text: 'text-green-700' },
    'טופל': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'בוטל': { bg: 'bg-gray-100', text: 'text-gray-500' }
};


export default function MyRequestsPage() {
    const [activeRequests, setActiveRequests] = useState([]);
    const [archivedRequests, setArchivedRequests] = useState([]);
    const [activeAppointments, setActiveAppointments] = useState([]); // New state for active appointments
    const [archivedAppointments, setArchivedAppointments] = useState([]); // New state for archived appointments
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // New state for error handling
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null); // New state for selected appointment
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false); // New state for modal
    const [paymentLoading, setPaymentLoading] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Skip the cancelExpiredAppointments call for now to avoid issues
            // await cancelExpiredAppointments();

            const impersonatedUserId = sessionStorage.getItem('impersonatedUserId');
            let user;
            if (impersonatedUserId) {
                user = await User.get(impersonatedUserId);
                console.log(`🎭 Impersonation mode: Viewing as user ${user.id} (${user.full_name})`);
            } else {
                user = await User.me();
                console.log(`👤 Normal mode: Current user ${user.id} (${user.full_name})`);
            }
            setCurrentUser(user);

            // Fetch requests
            console.log(`📋 Fetching requests for user_id: ${user.id}`);
            const userRequests = await Request.filter({ user_id: user.id }, '-created_date');
            console.log(`📋 Found ${userRequests.length} requests:`, userRequests);
            
            const activeReq = userRequests.filter(r => !['טופל', 'בקשה נדחתה', 'בוטל'].includes(r.status));
            const archivedReq = userRequests.filter(r => ['טופל', 'בקשה נדחתה', 'בוטל'].includes(r.status));
            setActiveRequests(activeReq);
            setArchivedRequests(archivedReq);

            // Fetch appointments for the CORRECT user (not admin when impersonating)
            console.log(`📅 Fetching appointments for user_id: ${user.id}`);
            const userAppointments = await Appointment.filter({ user_id: user.id }, '-created_date');
            console.log(`📅 Found ${userAppointments.length} appointments:`, userAppointments);
            
            const activeAppt = userAppointments.filter(a => !['טופל', 'בוטל'].includes(a.status));
            const archivedAppt = userAppointments.filter(a => ['טופל', 'בוטל'].includes(a.status));

            console.log(`📅 Active appointments: ${activeAppt.length}, Archived: ${archivedAppt.length}`);
            setActiveAppointments(activeAppt);
            setArchivedAppointments(archivedAppt);

        } catch (error) {
            console.error("Error loading data:", error);
            setError('שגיאה בטעינת הנתונים');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);
    
    const handleRefresh = () => {
        setIsRefreshing(true);
        loadData();
    };

    const openDetailsModal = (request) => {
        setSelectedRequest(request);
        setIsDetailsModalOpen(true);
    };
    
    const openAppointmentDetailsModal = (appointment) => {
        setSelectedAppointment(appointment);
        setIsAppointmentModalOpen(true);
    };

    const openChatModal = (request) => {
        setSelectedRequest(request);
        setIsChatModalOpen(true);
    };

    const handlePayment = async (record) => {
        setPaymentLoading(record.id);
        try {
            // This now handles ONLY appointments, as requests have a different flow.
             window.location.href = createPageUrl(`AppointmentPayment?appointmentId=${record.id}`);
        } catch (error) {
            console.error("Payment navigation failed:", error);
            alert('שגיאה במעבר לתשלום. אנא נסה שוב או פנה לתמיכה.');
            setPaymentLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <span>טוען נתונים...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-600">
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div dir="rtl">
            <Card className="border-none shadow-none">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl font-bold">הבקשות והתורים שלי</CardTitle>
                    <div className="flex gap-4 items-center">
                         <Button onClick={handleRefresh} variant="outline" size="icon" disabled={isRefreshing}>
                            <Loader2 className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                        <div className="flex gap-3">
                            <Button asChild variant="default" className="bg-[#5932EA] hover:bg-[#4925C4]">
                                <Link to={createPageUrl('ConsultationRequest')}>
                                    <Plus className="w-4 h-4 ml-2" />
                                    בקשת ייעוץ
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link to={createPageUrl('ScheduleAppointment')}>
                                    <Calendar className="w-4 h-4 ml-2" />
                                    קביעת תור
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-yellow-800 text-sm font-medium">
                            💡 <strong>הדרכה:</strong> תורים שקבעת יופיעו תחת "תורים פעילים". בקשות לייעוץ יופיעו תחת "בקשות פעילות".
                        </p>
                    </div>
                    
                    <Tabs defaultValue="activeAppointments" className="w-full" dir="rtl">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="activeAppointments">תורים פעילים ({activeAppointments.length})</TabsTrigger>
                            <TabsTrigger value="activeRequests">בקשות פעילות ({activeRequests.length})</TabsTrigger>
                            <TabsTrigger value="archivedAppointments">תורים בארכיון ({archivedAppointments.length})</TabsTrigger>
                            <TabsTrigger value="archivedRequests">בקשות בארכיון ({archivedRequests.length})</TabsTrigger>
                        </TabsList>
                        
                        {/* Content for Active Appointments */}
                        <TabsContent value="activeAppointments" className="mt-4">
                            <div className="space-y-4">
                                {activeAppointments.length > 0 ? (
                                    activeAppointments.map(appointment => (
                                        <Card key={appointment.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                    {/* Right side - Main info */}
                                                    <div className="flex-1 text-right" dir="rtl">
                                                        <h3 className="font-bold text-lg text-right">{appointment.specialty}</h3>
                                                        <p className="text-gray-600 text-right">ד"ר {appointment.doctor}</p>
                                                        <div className="flex items-center justify-end mt-2 text-sm text-gray-500 gap-2">
                                                            <span>{format(new Date(appointment.date), 'PPP p', { locale: he })}</span>
                                                            <Calendar className="w-4 h-4" />
                                                        </div>
                                                        {appointment.clinic && (
                                                            <p className="text-sm text-gray-500 mt-1 text-right">{appointment.clinic}</p>
                                                        )}
                                                    </div>

                                                    {/* Left side - Actions and status */}
                                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 lg:w-auto w-full">
                                                        <Badge className={`text-center justify-center ${appointmentStatusStyles[appointment.status]?.bg || 'bg-gray-100'} ${appointmentStatusStyles[appointment.status]?.text || 'text-gray-700'} font-semibold px-3 py-1.5`}>
                                                            {appointment.status}
                                                        </Badge>
                                                        
                                                        {appointment.status === 'ממתין לתשלום' && (
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-center bg-green-50 px-3 py-1.5 rounded border">
                                                                    <span className="text-green-700 font-semibold">₪{appointment.final_price}</span>
                                                                    <span className="text-xs text-green-600 block">לתשלום</span>
                                                                </div>
                                                                <Button 
                                                                    onClick={() => handlePayment(appointment)}
                                                                    disabled={paymentLoading === appointment.id}
                                                                    className="bg-green-600 hover:bg-green-700 text-white h-auto py-1.5"
                                                                    size="sm"
                                                                >
                                                                    {paymentLoading === appointment.id ? (
                                                                        <React.Fragment>
                                                                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                                                            מעבד...
                                                                        </React.Fragment>
                                                                    ) : (
                                                                        <React.Fragment>
                                                                            <CreditCard className="w-4 h-4 ml-2" />
                                                                            שלם עכשיו
                                                                        </React.Fragment>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        )}
                                                        
                                                        <Button variant="outline" onClick={() => openAppointmentDetailsModal(appointment)} className="h-auto py-1.5" size="sm">
                                                            צפה בפרטים
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 py-8">אין תורים פעילים</p>
                                )}
                            </div>
                        </TabsContent>

                        {/* Content for Active Requests */}
                        <TabsContent value="activeRequests" className="mt-4">
                            <div className="space-y-4">
                                {activeRequests.length > 0 ? (
                                    activeRequests.map(request => (
                                        <Card key={request.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                    {/* Right side - Main info */}
                                                    <div className="flex-1 text-right" dir="rtl">
                                                        <h3 className="font-bold text-lg text-right">{request.type}</h3>
                                                        <p className="text-sm text-gray-600 text-right">{request.doctor_name || 'נציג מערכת'}</p>
                                                        <div className="text-sm text-gray-500 mt-2 flex items-center justify-end gap-4">
                                                            <span>{format(new Date(request.date), 'dd/MM/yyyy')}</span>
                                                            <span>|</span>
                                                            <span>{request.time}</span>
                                                            {request.final_price && (
                                                                <>
                                                                    <span>|</span>
                                                                    <span className="font-semibold">₪{request.final_price}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Left side - Actions and status */}
                                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:w-auto w-full">
                                                        <Badge className={`text-center justify-center ${requestStatusStyles[request.status]?.bg || 'bg-gray-100'} ${requestStatusStyles[request.status]?.text || 'text-gray-700'} font-semibold px-3 py-1.5`}>
                                                            {request.status === 'מאושר עבור עליה' ? 'מאושר' : request.status}
                                                        </Badge>
                                                        
                                                        <Button variant="outline" onClick={() => openDetailsModal(request)} className="h-auto py-1.5" size="sm">
                                                            צפה בפרטים
                                                        </Button>
                                                        <Button onClick={() => openChatModal(request)} className="h-auto py-1.5" size="sm">
                                                            פתח פנייה
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <p>אין לך בקשות פעילות.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Content for Archived Appointments */}
                        <TabsContent value="archivedAppointments" className="mt-4">
                            <div className="space-y-4">
                                {archivedAppointments.length > 0 ? (
                                    archivedAppointments.map(appointment => (
                                        <Card key={appointment.id} className="bg-white rounded-lg shadow-sm opacity-70">
                                            <CardContent className="p-4">
                                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                    {/* Right side - Main info */}
                                                    <div className="flex-1 text-right" dir="rtl">
                                                        <h3 className="font-bold text-lg text-right">{appointment.specialty}</h3>
                                                        <p className="text-sm text-gray-600 text-right">ד"ר {appointment.doctor}</p>
                                                        {appointment.clinic && <p className="text-gray-500 text-sm text-right">{appointment.clinic}</p>}
                                                        <div className="text-sm text-gray-500 mt-2 flex items-center justify-end gap-2">
                                                            <span className="flex items-center gap-1">{format(new Date(appointment.date), 'dd/MM/yyyy')} <Calendar className="w-4 h-4" /></span>
                                                            <span className="flex items-center gap-1">{format(new Date(appointment.date), 'HH:mm')} <Clock className="w-4 h-4" /></span>
                                                        </div>
                                                    </div>

                                                    {/* Left side - Actions and status */}
                                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 lg:w-auto w-full">
                                                        <Badge className={`text-center justify-center ${appointmentStatusStyles[appointment.status]?.bg || 'bg-gray-100'} ${appointmentStatusStyles[appointment.status]?.text || 'text-gray-700'} font-semibold px-3 py-1.5`}>
                                                            {appointment.status}
                                                        </Badge>
                                                        <Button variant="outline" onClick={() => openAppointmentDetailsModal(appointment)} className="h-auto py-1.5" size="sm">
                                                            צפה בפרטים
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                     <div className="text-center py-12 text-gray-500">
                                        <p>אין לך תורים בארכיון.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Content for Archived Requests */}
                        <TabsContent value="archivedRequests" className="mt-4">
                            <div className="space-y-4">
                                {archivedRequests.length > 0 ? (
                                    archivedRequests.map(request => (
                                        <Card key={request.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                    {/* Right side - Main info */}
                                                    <div className="flex-1 text-right" dir="rtl">
                                                        <h3 className="font-bold text-lg text-right">{request.type}</h3>
                                                        <p className="text-sm text-gray-600 text-right">{request.doctor_name || 'נציג מערכת'}</p>
                                                        <div className="text-sm text-gray-500 mt-2 flex items-center justify-end gap-4">
                                                            <span>{format(new Date(request.date), 'dd/MM/yyyy')}</span>
                                                            <span>|</span>
                                                            <span>{request.time}</span>
                                                            {request.final_price && (
                                                                <>
                                                                    <span>|</span>
                                                                    <span className="font-semibold">₪{request.final_price}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Left side - Actions and status */}
                                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:w-auto w-full">
                                                        <Badge className={`text-center justify-center ${requestStatusStyles[request.status]?.bg || 'bg-gray-100'} ${requestStatusStyles[request.status]?.text || 'text-gray-700'} font-semibold px-3 py-1.5`}>
                                                            {request.status === 'מאושר עבור עליה' ? 'מאושר' : request.status}
                                                        </Badge>
                                                        <Button variant="outline" onClick={() => openDetailsModal(request)} className="h-auto py-1.5" size="sm">
                                                            צפה בפרטים
                                                        </Button>
                                                        <Button onClick={() => openChatModal(request)} className="h-auto py-1.5" size="sm">
                                                            פתח פנייה
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <p>אין לך בקשות בארכיון.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {selectedRequest && (
                <RequestDetailsModal
                    request={selectedRequest}
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                />
            )}
            
            {selectedAppointment && (
                <AppointmentDetailsModal
                    appointment={selectedAppointment}
                    isOpen={isAppointmentModalOpen}
                    onClose={() => setIsAppointmentModalOpen(false)}
                />
            )}

            {selectedRequest && currentUser && (
                <ChatModal
                    isOpen={isChatModalOpen}
                    onClose={() => setIsChatModalOpen(false)}
                    request={selectedRequest}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
}
