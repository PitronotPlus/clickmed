import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Request } from '@/entities/Request';
import { Appointment } from '@/entities/Appointment';
import { ActivityLog } from '@/entities/ActivityLog';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminSummaryCards from '@/components/admin/AdminSummaryCards';
import AdminAppointmentsTable from '@/components/admin/AdminAppointmentsTable';
import AdminRecentActivityTable from '@/components/admin/AdminRecentActivityTable';
import TopDoctorsTable from '@/components/admin/TopDoctorsTable';
import SystemActivityChart from '@/components/admin/SystemActivityChart';

function AdminPanelContent() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalDoctors: 0,
        totalClinics: 0,
        totalRequests: 0,
        pendingRequests: 0,
        totalAppointments: 0,
        pendingApprovals: 0,
        totalRevenue: 0,
    });
    const [appointments, setAppointments] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [activityChartData, setActivityChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                console.log('🔄 AdminPanel: Starting to fetch all data...');
                
                // Fetch all data in parallel
                const [allUsers, allRequests, allAppointments, allActivity] = await Promise.all([
                    User.list('-created_date'),
                    Request.list('-created_date'),
                    Appointment.list('-created_date', 10), // Get more appointments for better data
                    ActivityLog.list('-created_date', 10)
                ]);

                console.log('📊 AdminPanel: Data fetched:', {
                    users: allUsers.length,
                    requests: allRequests.length,
                    appointments: allAppointments.length,
                    activities: allActivity.length
                });

                // Create a map of user IDs to full names for efficient lookup
                const userMap = allUsers.reduce((acc, user) => {
                    acc[user.id] = user.full_name || user.display_name;
                    return acc;
                }, {});

                // Add patient names to each appointment
                const appointmentsWithNames = allAppointments.map(appointment => ({
                    ...appointment,
                    patient_name: userMap[appointment.user_id] || 'משתמש לא ידוע'
                }));

                // Calculate comprehensive stats
                const totalDoctors = allUsers.filter(u => u.user_type === 'doctor').length;
                const totalClinics = allUsers.filter(u => u.user_type === 'clinic').length;
                const pendingUsers = allUsers.filter(u => u.status === 'pending').length;
                
                // Calculate pending requests - requests that are open/waiting
                const pendingRequestStatuses = [
                    'בקשה בבדיקה', 
                    'מחפש רופא', 
                    'מחפש רופא - עדיפות פרמיום',
                    'ממתין לתשלום',
                    'מאושר'
                ];
                const pendingReqs = allRequests.filter(r => pendingRequestStatuses.includes(r.status)).length;
                
                // Calculate total revenue from completed requests and appointments
                const completedRequests = allRequests.filter(r => r.status === 'טופל');
                const completedAppointments = allAppointments.filter(a => a.status === 'טופל');
                
                const revenueFromRequests = completedRequests.reduce((sum, r) => sum + (r.final_price || 0), 0);
                const revenueFromAppointments = completedAppointments.reduce((sum, a) => sum + (a.final_price || 0), 0);
                const totalRevenue = revenueFromRequests + revenueFromAppointments;

                const calculatedStats = {
                    totalUsers: allUsers.length,
                    totalDoctors,
                    totalClinics,
                    totalRequests: allRequests.length,
                    pendingRequests: pendingReqs,
                    totalAppointments: allAppointments.length,
                    pendingApprovals: pendingUsers,
                    totalRevenue,
                };

                console.log('📈 AdminPanel: Calculated stats:', calculatedStats);

                setStats(calculatedStats);

                // Prepare data for components
                setAppointments(appointmentsWithNames.slice(0, 5)); // Show only last 5 in table
                setRecentActivity(allActivity.slice(0, 5)); // Show only last 5 in table
                
                const doctorUsers = allUsers.filter(u => u.user_type === 'doctor');
                setDoctors(doctorUsers);
                
                // Prepare chart data (user registrations per day for last 7 days)
                const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return d.toISOString().split('T')[0];
                }).reverse();

                const chartData = last7Days.map(date => ({
                    date,
                    users: allUsers.filter(u => u.created_date.startsWith(date)).length,
                    requests: allRequests.filter(r => r.created_date.startsWith(date)).length,
                    appointments: allAppointments.filter(a => a.created_date.startsWith(date)).length,
                }));
                setActivityChartData(chartData);

                console.log('✅ AdminPanel: All data processed and set successfully');

            } catch (error) {
                console.error("❌ AdminPanel: Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">טוען נתוני פאנל האדמין...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AdminSummaryCards stats={stats} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <SystemActivityChart data={activityChartData} />
                </div>
                <div>
                    <TopDoctorsTable doctors={doctors} />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AdminAppointmentsTable appointments={appointments} />
                <AdminRecentActivityTable activities={recentActivity} />
            </div>
        </div>
    );
}

export default function AdminPanel() {
    return (
        <ProtectedRoute requiredRoles={['admin']}>
            <AdminPanelContent />
        </ProtectedRoute>
    );
}