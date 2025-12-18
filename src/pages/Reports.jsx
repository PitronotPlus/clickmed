
import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { User } from '@/entities/User';
import { Request } from '@/entities/Request';
// Referral is no longer used by the updated reporting logic
import { Appointment } from '@/entities/Appointment';

const COLORS = ['#5932EA', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];

function ReportsPageContent() {
    // Replaced reportData with requestsData and appointmentsData as per outline
    const [requestsData, setRequestsData] = useState([]);
    const [appointmentsData, setAppointmentsData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadReportData = async () => {
            setLoading(true);
            try {
                const impersonatedUserId = sessionStorage.getItem('impersonatedUserId');
                let currentUser;
                if (impersonatedUserId) {
                    // If impersonating, fetch the impersonated user's details
                    currentUser = await User.get(impersonatedUserId);
                } else {
                    // Otherwise, fetch the currently logged-in user's details
                    currentUser = await User.me();
                }

                // Determine user role for correct data fetching
                const isAdmin = currentUser.role === 'admin' || currentUser.permissions?.includes('admin');
                const isOffice = currentUser.user_type === 'office' || currentUser.permissions?.includes('office');
                const isDoctor = currentUser.user_type === 'doctor';

                let fetchedRequests = [];
                let fetchedAppointments = [];

                if ((isAdmin || isOffice) && !impersonatedUserId) {
                    // If an admin or office user and not impersonating, fetch all requests and appointments
                    [fetchedRequests, fetchedAppointments] = await Promise.all([
                        Request.list('-created_date'), // Fetch all requests
                        Appointment.list('-created_date') // Fetch all appointments
                    ]);
                } else if (isDoctor) {
                    // If a doctor (or impersonating one), filter by doctor_id
                    [fetchedRequests, fetchedAppointments] = await Promise.all([
                        Request.filter({ doctor_id: currentUser.id }, '-created_date'),
                        Appointment.filter({ doctor_id: currentUser.id }, '-created_date')
                    ]);
                } else {
                    // If a regular user (patient), filter by user_id
                    // This also covers cases where an admin is impersonating a regular user/patient
                    [fetchedRequests, fetchedAppointments] = await Promise.all([
                        Request.filter({ user_id: currentUser.id }, '-created_date'),
                        Appointment.filter({ user_id: currentUser.id }, '-created_date')
                    ]);
                }

                // Process requests data for the status pie chart
                const requestsByStatus = fetchedRequests.reduce((acc, req) => {
                    const status = req.status || 'לא ידוע'; // Handle cases where status might be undefined
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, {});
                setRequestsData(Object.entries(requestsByStatus).map(([name, value]) => ({ name, value })));

                // Process appointments data for the status pie chart
                const appointmentsByStatus = fetchedAppointments.reduce((acc, appt) => {
                    const status = appt.status || 'לא ידוע'; // Handle cases where status might be undefined
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, {});
                setAppointmentsData(Object.entries(appointmentsByStatus).map(([name, value]) => ({ name, value })));

            } catch (error) {
                console.error("Failed to load report data:", error);
                // Optionally set an error state here to display a message to the user
            } finally {
                setLoading(false);
            }
        };

        loadReportData();
    }, []); // Empty dependency array ensures this effect runs only once on mount

    if (loading) {
        return <div className="flex justify-center items-center h-screen">טוען דוחות...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">דוחות ובקרה</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* The following cards from the original code are removed as the new logic
                    only generates data for Request Status and Appointment Status.
                    User Growth, Revenue Over Time, and Clinic Performance data are no longer calculated. */}
                {/* <Card> (User Growth) ... </Card> */}
                {/* <Card className="md:col-span-2"> (Revenue Over Time) ... </Card> */}
                {/* <Card className="md:col-span-2"> (Clinic Performance) ... </Card> */}

                {/* Card for Request Status, now using requestsData */}
                <Card>
                    <CardHeader>
                        <CardTitle>סטטוס בקשות</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={requestsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {requestsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* New Card for Appointment Status, using appointmentsData */}
                <Card>
                    <CardHeader>
                        <CardTitle>סטטוס תורים</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={appointmentsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {appointmentsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function ReportsPage() {
    return (
        <ProtectedRoute requiredRoles={['admin', 'office', 'doctor']}>
            <ReportsPageContent />
        </ProtectedRoute>
    );
}
