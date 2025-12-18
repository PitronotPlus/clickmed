
import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Request } from '@/entities/Request';
import { Appointment } from '@/entities/Appointment'; // Import Appointment entity
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DoctorRequestDetailsModal from '@/components/doctors/DoctorRequestDetailsModal';
import { Eye, Users, Clock } from 'lucide-react';

const statusStyles = {
    'בקשה בבדיקה': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    'ממתין לתשלום': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    'מאושר': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    'מאושר עבור עליה': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    'טופל': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    'בקשה נדחתה': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    'ממתין לזימון תור': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    'בוטל': { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
    'מחפש רופא': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
    'מחפש רופא - עדיפות פרמיום': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    'ממתין לאישור': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' }, // Added for appointments
};

function DoctorRequestsPageContent() {
    const [user, setUser] = useState(null);
    const [requests, setRequests] = useState([]); // This state will now hold a mix of requests and appointments
    const [archivedRequests, setArchivedRequests] = useState([]); // This state will now hold a mix of requests and appointments
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        let mounted = true;
        
        const loadAllData = async () => {
            if (!mounted) return;
            
            setLoading(true);
            setError(null);
            
            try {
                console.log('[DoctorRequests] Starting to load data...');
                
                // Check for impersonation first
                const impersonatedUserId = sessionStorage.getItem('impersonatedUserId');
                const adminUserId = sessionStorage.getItem('adminUserId');
                let currentUser;

                if (impersonatedUserId && adminUserId) {
                    console.log(`[DoctorRequests] Impersonation mode active. Fetching user ID: ${impersonatedUserId}`);
                    currentUser = await User.get(impersonatedUserId);
                } else {
                    console.log('[DoctorRequests] Normal mode. Fetching current user.');
                    currentUser = await User.me();
                }

                if (!mounted) return;
                
                setUser(currentUser);
                console.log('[DoctorRequests] Current user context:', currentUser.email, currentUser.user_type);

                let allDoctorItems = [];

                // Use the real admin's permissions if they are impersonating.
                let isEffectivelyAdmin = false;
                if (adminUserId) {
                    const adminUser = await User.get(adminUserId);
                    if (adminUser.permissions?.includes('admin')) {
                        isEffectivelyAdmin = true;
                    }
                } else {
                    isEffectivelyAdmin = currentUser.permissions?.includes('admin');
                }


                if (isEffectivelyAdmin && !impersonatedUserId) {
                    console.log('[DoctorRequests] Admin mode (not impersonating) - fetching all requests and appointments');
                    const allRequests = await Request.list('-created_date');
                    const allAppointments = await Appointment.list('-created_date');
                    allDoctorItems = [
                        ...allRequests.map(r => ({ ...r, record_type: 'request' })),
                        ...allAppointments.map(a => ({ ...a, record_type: 'appointment' }))
                    ];

                } else if (currentUser.user_type === 'doctor') {
                    console.log('[DoctorRequests] Doctor mode - fetching relevant items');
                    
                    const allRequests = await Request.list('-created_date', 200);
                    const allAppointments = await Appointment.list('-created_date', 200);
                    
                    const doctorSpecialties = currentUser.specialties || [];
                    console.log('[DoctorRequests] Doctor specialties:', doctorSpecialties);
                    
                    const relevantRequests = allRequests.filter(req => {
                        // Assigned directly to this doctor
                        if (req.doctor_id === currentUser.id) {
                            console.log('[DoctorRequests] Found assigned request:', req.id, req.type);
                            return true;
                        }
                        
                        // Arena requests matching specialties
                        if (['מחפש רופא', 'מחפש רופא - עדיפות פרמיום'].includes(req.status)) {
                            if (doctorSpecialties.includes(req.type)) {
                                console.log('[DoctorRequests] Found arena request:', req.id, req.type);
                                return true;
                            }
                        }
                        
                        return false;
                    });
                    
                    // CRITICAL FIX: Fetch ALL appointments for the doctor, not just those 'pending approval'
                    const relevantAppointments = allAppointments.filter(appt => 
                        appt.doctor_id === currentUser.id
                    );

                    allDoctorItems = [
                        ...relevantRequests.map(r => ({ ...r, record_type: 'request' })),
                        ...relevantAppointments.map(a => ({ ...a, record_type: 'appointment', type: a.specialty, user_name: a.patient_name }))
                    ].sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());

                    console.log('[DoctorRequests] Filtered relevant items:', allDoctorItems.length);
                    
                } else {
                    console.log('[DoctorRequests] Regular user mode - fetching own requests');
                    const userRequests = await Request.filter({ user_id: currentUser.id }, '-created_date');
                    allDoctorItems = userRequests.map(r => ({ ...r, record_type: 'request' }));
                }

                if (!mounted) return;
                console.log('[DoctorRequests] Final items count:', allDoctorItems.length);

                // Separate active items from archived ones - FIXED TO INCLUDE ALL NON-ARCHIVED STATUSES
                const activeStatuses = [
                    'בקשה בבדיקה', 
                    'ממתין לתשלום', 
                    'מאושר', 
                    'מאושר עבור עליה',
                    'ממתין לזימון תור', 
                    'מחפש רופא', 
                    'מחפש רופא - עדיפות פרמיום', 
                    'ממתין לאישור'
                ];
                const archivedStatuses = ['טופל', 'בקשה נדחתה', 'בוטל'];

                const activeItems = allDoctorItems.filter(item => activeStatuses.includes(item.status));
                const archivedItems = allDoctorItems.filter(item => archivedStatuses.includes(item.status));

                console.log('[DoctorRequests] Active items:', activeItems.length);
                console.log('[DoctorRequests] Active items details:', activeItems);
                console.log('[DoctorRequests] Archived items:', archivedItems.length);
                
                setRequests(activeItems);
                setArchivedRequests(archivedItems);
                
            } catch (error) {
                console.error('Error loading requests:', error);
                if (mounted) {
                    setError('שגיאה בטעינת הבקשות: ' + error.message);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadAllData();
        
        return () => {
            mounted = false;
        };
    }, []); // Only run once on mount

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const handleUpdateRequest = async () => {
        setIsModalOpen(false);
        // Refresh data after update
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    const RequestsTable = ({ requests, showArchived = false }) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-right">מטופל</TableHead>
                    <TableHead className="text-right">סוג</TableHead>
                    <TableHead className="text-right">תאריך</TableHead>
                    <TableHead className="text-right">סטטוס</TableHead>
                    <TableHead className="text-center">פעולות</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests.length > 0 ? (
                    requests.map((item, index) => (
                        <TableRow key={`${item.id}-${index}`}>
                            <TableCell className="font-medium text-right">{item.user_name}</TableCell>
                            <TableCell className="text-right">
                                {item.record_type === 'appointment' && <Badge variant="outline" className="mr-2">תור</Badge>}
                                {item.type}
                            </TableCell>
                            <TableCell className="text-right">{new Date(item.created_date).toLocaleDateString('he-IL')}</TableCell>
                            <TableCell className="text-right">
                                <Badge 
                                    className={`${statusStyles[item.status]?.bg || 'bg-gray-100'} ${statusStyles[item.status]?.text || 'text-gray-700'} font-semibold`}
                                >
                                    {item.status === 'מאושר עבור עליה' ? 'מאושר' : item.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleViewDetails(item)}
                                    className="flex items-center mx-auto"
                                >
                                    <Eye className="w-4 h-4 mr-1" />
                                    צפה בפרטים
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            {showArchived ? 'אין פריטים בארכיון' : 'אין בקשות או תורים פעילים'}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    if (loading) {
        return <div className="text-center p-8">טוען בקשות...</div>;
    }

    if (error) {
        return (
            <div className="text-center p-8 text-red-600">
                <p>{error}</p>
                <Button 
                    onClick={() => window.location.reload()} 
                    className="mt-4"
                    variant="outline"
                >
                    נסה שוב
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">בקשות ותורים למטופלים</h1>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>{requests.length} פריטים פעילים</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span>{requests.filter(r => ['בקשה בבדיקה', 'מחפש רופא', 'מחפש רופא - עדיפות פרמיום', 'ממתין לאישור'].includes(r.status)).length} ממתינות לבדיקה</span>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="active" className="w-full" dir="rtl">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">פעילים ({requests.length})</TabsTrigger>
                    <TabsTrigger value="archived">ארכיון ({archivedRequests.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-right">בקשות ותורים פעילים</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RequestsTable requests={requests} />
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="archived" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-right">פריטים בארכיון</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RequestsTable requests={archivedRequests} showArchived={true} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {selectedRequest && user && (
                <DoctorRequestDetailsModal
                    request={selectedRequest}
                    doctor={user}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onUpdateRequest={handleUpdateRequest}
                />
            )}
        </div>
    );
}

export default function DoctorRequestsPage() {
    return (
        <ProtectedRoute requiredRoles={['doctor', 'admin']}>
            <DoctorRequestsPageContent />
        </ProtectedRoute>
    );
}
