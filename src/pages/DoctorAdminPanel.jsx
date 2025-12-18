
import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DoctorSummaryCards from '@/components/doctorAdmin/DoctorSummaryCards';
import DoctorAppointmentsTable from '@/components/doctorAdmin/DoctorAppointmentsTable';
import DoctorPendingRequestsTable from '@/components/doctorAdmin/DoctorPendingRequestsTable';
import DoctorRecentPatients from '@/components/doctorAdmin/DoctorRecentPatients';
import DoctorPaymentsTable from '@/components/doctorAdmin/DoctorPaymentsTable';
import { User } from '@/entities/User';
import { Request } from '@/entities/Request';
import { Appointment } from '@/entities/Appointment';
import { SystemNotification } from '@/entities/SystemNotification';
import { startOfWeek, endOfWeek, isWithinInterval, isFuture } from 'date-fns';
import { cancelExpiredAppointments } from '@/functions/cancelExpiredAppointments';


function DoctorAdminPanelContent() {
    const [doctor, setDoctor] = useState(null);
    const [stats, setStats] = useState({
        patients: 0,
        pendingRequests: 0,
        appointmentsThisWeek: 0,
        pendingPayout: '₪0'
    });
    const [appointments, setAppointments] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [recentPatients, setRecentPatients] = useState([]);
    const [payments, setPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                console.log('🔄 DoctorAdminPanel: Starting fresh data fetch...');
                
                // Run cancellation logic for expired appointments
                await cancelExpiredAppointments();
                
                const impersonatedUserId = sessionStorage.getItem('impersonatedUserId');
                let currentUser;

                if (impersonatedUserId) {
                    console.log(`[DoctorAdminPanel] Impersonation mode. Fetching user ID: ${impersonatedUserId}`);
                    currentUser = await User.get(impersonatedUserId);
                } else {
                    console.log('[DoctorAdminPanel] Normal mode. Fetching current user.');
                    currentUser = await User.me();
                }
                
                setDoctor(currentUser);
                
                console.log('👨‍⚕️ Doctor Info:', {
                    id: currentUser.id,
                    email: currentUser.email,
                    userType: currentUser.user_type,
                    specialties: currentUser.specialties
                });

                // Step 1: Get ALL requests from the system
                const allSystemRequests = await Request.list('-created_date');
                console.log('📋 Total system requests:', allSystemRequests.length);
                
                // Step 2: Get ALL appointments from the system  
                const allSystemAppointments = await Appointment.list('-created_date');
                console.log('📅 Total system appointments:', allSystemAppointments.length);

                // Step 3: Debug - let's see what's in the data
                console.log('🔍 First few requests:', allSystemRequests.slice(0, 3));
                console.log('🔍 First few appointments:', allSystemAppointments.slice(0, 3));

                // Step 4: Find requests and appointments relevant to this doctor
                let doctorRequests = [];
                let doctorAppointments = [];

                if (currentUser.user_type === 'doctor') {
                    // Method 1: Direct assignment (doctor_id matches)
                    const directRequests = allSystemRequests.filter(req => req.doctor_id === currentUser.id);
                    console.log('🎯 Direct requests for doctor:', directRequests.length);

                    // Method 2: Arena requests that match specialties
                    const arenaRequests = allSystemRequests.filter(req => 
                        (req.status === 'מחפש רופא' || req.status === 'מחפש רופא - עדיפות פרמיום') &&
                        currentUser.specialties && 
                        currentUser.specialties.includes(req.type)
                    );
                    console.log('🏟️ Arena requests matching specialties:', arenaRequests.length);

                    doctorRequests = [...directRequests, ...arenaRequests];

                    // Appointments for this doctor
                    doctorAppointments = allSystemAppointments.filter(app => app.doctor_id === currentUser.id);
                    console.log('📅 Doctor appointments:', doctorAppointments.length);
                }

                console.log('📊 Final doctor data:', {
                    totalRequests: doctorRequests.length,
                    totalAppointments: doctorAppointments.length
                });

                // Calculate stats - UPDATE THIS PART FOR BETTER PATIENT COUNTING
                const pendingReqs = doctorRequests.filter(r => 
                    r.status === 'בקשה בבדיקה' || 
                    r.status === 'מחפש רופא' || 
                    r.status === 'מחפש רופא - עדיפות פרמיום'
                );

                const today = new Date();
                const weekStart = startOfWeek(today, { weekStartsOn: 0 });
                const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
                
                const thisWeekAppointments = doctorAppointments.filter(a => 
                    isWithinInterval(new Date(a.date), { start: weekStart, end: weekEnd }) &&
                    isFuture(new Date(a.date)) // Only include future appointments
                );

                // Calculate unique patients FROM BOTH REQUESTS AND APPOINTMENTS
                const allPatientIds = [
                    ...doctorRequests.map(r => r.user_id).filter(Boolean),
                    ...doctorAppointments.map(a => a.user_id).filter(Boolean)
                ];
                const uniquePatientIds = [...new Set(allPatientIds)];
                console.log('👥 Unique patient IDs found:', uniquePatientIds);

                // GET ACTUAL PATIENT DATA FOR RECENT PATIENTS DISPLAY
                let recentPatientData = [];
                if (uniquePatientIds.length > 0) {
                    try {
                        const allPatientInteractions = [
                            ...doctorRequests.map(r => ({ interaction_date: r.created_date, patient_id: r.user_id })),
                            ...doctorAppointments.map(a => ({ interaction_date: a.created_date || a.date, patient_id: a.user_id }))
                        ].filter(item => item.patient_id);

                        allPatientInteractions.sort((a, b) => new Date(b.interaction_date) - new Date(a.interaction_date));

                        const uniqueRecentInteractions = [];
                        const seenPatientIds = new Set();
                        for (const interaction of allPatientInteractions) {
                            if (interaction.patient_id && !seenPatientIds.has(interaction.patient_id)) {
                                uniqueRecentInteractions.push(interaction);
                                seenPatientIds.add(interaction.patient_id);
                                if (uniqueRecentInteractions.length >= 5) break;
                            }
                        }

                        // Fetch full user data for recent patients
                        const patientPromises = uniqueRecentInteractions.map(inter => User.get(inter.patient_id));
                        const fetchedPatients = await Promise.all(patientPromises);
                        
                        recentPatientData = fetchedPatients.map(patient => {
                            const lastInteraction = uniqueRecentInteractions.find(i => i.patient_id === patient.id);
                            return {
                                ...patient,
                                lastVisit: lastInteraction ? new Date(lastInteraction.interaction_date) : new Date(),
                            };
                        });

                        console.log('📋 Recent patients data (with full user info):', recentPatientData);
                    } catch (patientError) {
                        console.error('Error fetching recent patient data:', patientError);
                        recentPatientData = [];
                    }
                }

                const calculatedStats = {
                    patients: uniquePatientIds.length,
                    pendingRequests: pendingReqs.length,
                    appointmentsThisWeek: thisWeekAppointments.length,
                    pendingPayout: `₪${doctorRequests.filter(r => r.status === 'טופל').reduce((sum, r) => sum + (r.final_price || 0), 0).toLocaleString()}`
                };

                console.log('📈 Calculated stats:', calculatedStats);

                setStats(calculatedStats);
                setAppointments(doctorAppointments.filter(a => isFuture(new Date(a.date))).slice(0, 10)); // Show future appointments
                setPendingRequests(pendingReqs.slice(0, 10)); // Show recent pending
                setRecentPatients(recentPatientData); // Set the recent patients data
                
                // Set payments data
                const paymentData = doctorRequests
                    .filter(r => r.status === 'טופל' || r.status === 'ממתין לתשלום')
                    .slice(0, 10)
                    .map(r => ({
                        id: r.id,
                        patient: r.user_name,
                        service: r.type,
                        date: new Date(r.created_date),
                        amount: r.final_price || 0,
                        status: r.status === 'טופל' ? 'שולם' : 'ממתין לתשלום'
                    }));
                setPayments(paymentData);

            } catch (error) {
                console.error("❌ Error in DoctorAdminPanel:", error);
                setError('שגיאה בטעינת נתונים: ' + error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []); 

    const handleRequestAction = async (requestId, newStatus, patientId) => {
        try {
            await Request.update(requestId, { status: newStatus });
            
            // Send notification to patient
            await SystemNotification.create({
                user_id: patientId,
                title: newStatus === 'מאושר' ? 'בקשתך אושרה' : 'עדכון בבקשתך',
                message: `ד"ר ${doctor.full_name} עדכן את סטטוס בקשתך ל: ${newStatus}`,
                type: 'request_status',
                priority: 'medium'
            });
            
            // Reload page to refresh data
            window.location.reload();
        } catch (error) {
            console.error("Error updating request:", error);
            alert('שגיאה בעדכון הבקשה');
        }
    };
    
    if (isLoading) {
        return (
            <div className="text-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>טוען נתוני הפאנל...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8 text-red-600">
                <p>{error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    נסה שוב
                </button>
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="text-center p-8 text-gray-700">
                שגיאה: לא נמצא רופא
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-blue-800 mb-2">פאנל ניהול - ד"ר {doctor.full_name || doctor.display_name}</h2>
                <p className="text-sm text-blue-600">
                    התמחויות: {doctor.specialties ? doctor.specialties.join(', ') : 'לא מוגדר'}
                </p>
            </div>
            
            <DoctorSummaryCards stats={stats} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <DoctorAppointmentsTable appointments={appointments} />
                </div>
                <div className="lg:col-span-1">
                    <DoctorRecentPatients patients={recentPatients} />
                </div>
            </div>
            
            <DoctorPendingRequestsTable 
                requests={pendingRequests} 
                onApprove={(req) => handleRequestAction(req.id, 'מאושר', req.user_id)}
                onDeny={(req) => handleRequestAction(req.id, 'בקשה נדחתה', req.user_id)}
            />
            
            <DoctorPaymentsTable payments={payments} />
        </div>
    );
}

export default function DoctorAdminPanel() {
    return (
        <ProtectedRoute requiredRoles={['doctor', 'admin']}>
            <DoctorAdminPanelContent />
        </ProtectedRoute>
    );
}
