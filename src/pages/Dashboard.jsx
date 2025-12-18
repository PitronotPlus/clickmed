
import React, { useState, useEffect } from 'react';
import { Appointment } from '@/entities/Appointment';
import { Request } from '@/entities/Request';
import { User } from '@/entities/User';
import SummaryCards from '@/components/dashboard/SummaryCards';
import ProfileCard from '@/components/dashboard/ProfileCard';
import RequestsChart from '@/components/dashboard/RequestsChart';
import UpcomingAppointments from '@/components/dashboard/UpcomingAppointments';
import ActivityHistory from '@/components/dashboard/ActivityHistory';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { he } from 'date-fns/locale';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [appointmentDates, setAppointmentDates] = useState([]);
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState({ treatment: 0, submitted: 0, payment: 0 });
    const [requestsChartData, setRequestsChartData] = useState([]);
    const [date, setDate] = React.useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        
        const fetchData = async () => {
            if (!mounted) return;
            
            setLoading(true);
            setError(null);
            
            try {
                const impersonatedUserId = sessionStorage.getItem('impersonatedUserId');
                let currentUser;
                if (impersonatedUserId) {
                    currentUser = await User.get(impersonatedUserId);
                } else {
                    currentUser = await User.me();
                }

                if (!mounted) return;
                
                setUser(currentUser);

                if (currentUser) {
                    const isAdmin = currentUser.role === 'admin' || currentUser.permissions?.includes('admin');
                    const isDoctor = currentUser.user_type === 'doctor';
                    
                    let userRequests = [];
                    let userAppointments = [];
                    let relevantActivities = [];

                    if (isAdmin) {
                        // Admin sees everything - but with controlled API calls
                        const allRequests = await Request.list('-created_date', 50); // Limit results
                        if (!mounted) return;
                        
                        await new Promise(resolve => setTimeout(resolve, 300)); // Delay
                        
                        const allAppointments = await Appointment.list('-created_date', 50); // Limit results
                        if (!mounted) return;
                        
                        userRequests = allRequests;
                        userAppointments = allAppointments;
                        
                        // Create activity from limited requests and appointments
                        relevantActivities = [
                            ...allRequests.slice(0, 8).map(req => ({
                                id: req.id,
                                user_id: req.user_id,
                                type: req.type,
                                description: `בקשה: ${req.type}`,
                                status: req.status,
                                date: req.created_date,
                                user_name: req.user_name
                            })),
                            ...allAppointments.slice(0, 8).map(appt => ({
                                id: appt.id,
                                user_id: appt.user_id,
                                type: appt.specialty,
                                description: `תור: ${appt.specialty}`,
                                status: appt.status,
                                date: appt.created_date,
                                user_name: `תור עם ד"ר ${appt.doctor}`
                            }))
                        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12);
                        
                    } else if (isDoctor) {
                        // Doctor sees their requests + relevant arena requests
                        const doctorRequests = await Request.filter({ doctor_id: currentUser.id });
                        if (!mounted) return;
                        
                        await new Promise(resolve => setTimeout(resolve, 200)); // Delay
                        
                        const doctorAppointments = await Appointment.filter({ doctor_id: currentUser.id });
                        if (!mounted) return;
                        
                        await new Promise(resolve => setTimeout(resolve, 200)); // Delay
                        
                        // Get arena requests matching doctor's specialties
                        const doctorSpecialties = currentUser.specialties || [];
                        let relevantArenaRequests = [];
                        
                        if (doctorSpecialties.length > 0) {
                            const arenaRequests = await Request.filter({ 
                                status: { $in: ['מחפש רופא', 'מחפש רופא - עדיפות פרמיום'] } 
                            });
                            relevantArenaRequests = arenaRequests.filter(req => doctorSpecialties.includes(req.type));
                        }
                        
                        userRequests = [...doctorRequests, ...relevantArenaRequests];
                        userAppointments = doctorAppointments;
                        
                        relevantActivities = [
                            ...userRequests.slice(0, 8).map(req => ({
                                id: req.id,
                                user_id: req.user_id,
                                type: req.type,
                                description: `בקשה: ${req.type}`,
                                status: req.status,
                                date: req.created_date,
                                user_name: req.user_name
                            })),
                            ...userAppointments.slice(0, 8).map(appt => ({
                                id: appt.id,
                                user_id: appt.user_id,
                                type: appt.specialty,
                                description: `תור: ${appt.specialty}`,
                                status: appt.status,
                                date: appt.created_date,
                                user_name: `תור עם מטופל`
                            }))
                        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12);
                        
                    } else {
                        // Regular user sees only their own data
                        const myRequests = await Request.filter({ user_id: currentUser.id });
                        if (!mounted) return;
                        
                        await new Promise(resolve => setTimeout(resolve, 200)); // Delay
                        
                        const myAppointments = await Appointment.filter({ user_id: currentUser.id });
                        if (!mounted) return;
                        
                        userRequests = myRequests;
                        userAppointments = myAppointments;
                        
                        relevantActivities = [
                            ...userRequests.slice(0, 8).map(req => ({
                                id: req.id,
                                user_id: req.user_id,
                                type: req.type,
                                description: req.type,
                                status: req.status,
                                date: req.created_date,
                                user_name: currentUser.full_name
                            })),
                            ...userAppointments.slice(0, 8).map(appt => ({
                                id: appt.id,
                                user_id: appt.user_id,
                                type: appt.specialty,
                                description: `תור עם ד"ר ${appt.doctor}`,
                                status: appt.status,
                                date: appt.created_date,
                                user_name: currentUser.full_name
                            }))
                        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12);
                    }
                    
                    if (!mounted) return;
                    
                    // Process stats
                    const statsRequests = isAdmin ? userRequests : userRequests.filter(r => r.user_id === currentUser.id);
                    const treatmentCount = statsRequests.filter(r => r.status === 'טופל').length;
                    const paymentCount = statsRequests.filter(r => r.status === 'ממתין לתשלום').length;
                    
                    setStats({
                        treatment: treatmentCount,
                        submitted: statsRequests.length,
                        payment: paymentCount
                    });
                    
                    // Chart data
                    const requestCounts = statsRequests.reduce((acc, req) => {
                        const type = req.type || 'לא ידוע';
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                    }, {});
                    const chartData = Object.entries(requestCounts).map(([name, value]) => ({ name, value }));
                    setRequestsChartData(chartData);

                    // Upcoming appointments
                    const now = new Date();
                    const relevantAppointments = isAdmin ? userAppointments : 
                                                 isDoctor ? userAppointments :
                                                 userAppointments.filter(app => app.user_id === currentUser.id);
                    
                    const upcomingUserAppointments = relevantAppointments
                        .filter(appointment => new Date(appointment.date) >= now && appointment.status !== 'בוטל')
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .slice(0, 5);
                        
                    setUpcomingAppointments(upcomingUserAppointments);
                    setAppointmentDates(relevantAppointments.map(app => new Date(app.date)));
                    setActivities(relevantActivities);
                }
            } catch (e) {
                console.error("Failed to fetch dashboard data:", e);
                if (mounted) {
                    if (e.response?.status === 429) {
                        setError('יותר מדי בקשות לשרת. אנא רענן את הדף בעוד כמה שניות.');
                    } else {
                        setError('שגיאה בטעינת נתוני הדאשבורד');
                    }
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };
        
        fetchData();
        
        return () => {
            mounted = false;
        };
    }, []); // Only run once on mount

    if (loading) {
        return <div className="text-center p-8 text-gray-700">טוען נתונים...</div>;
    }

    if (error) {
        return (
            <div className="text-center p-8 text-red-600">
                <p>{error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    רענן דף
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <style>{`
                .has-appointment .rdp-button {
                    position: relative;
                }
                .has-appointment .rdp-button::after {
                    content: '';
                    position: absolute;
                    bottom: 4px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background-color: #5932EA;
                }
                .rdp-day_selected.has-appointment .rdp-button::after {
                    background-color: white;
                }
            `}</style>
            <SummaryCards stats={stats} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-1">
                    <ProfileCard />
                </div>
                <div className="lg:col-span-1">
                    <RequestsChart data={requestsChartData} />
                </div>
                <div className="lg:col-span-1">
                    <Card className="bg-white rounded-lg border shadow-none w-full h-[484px] lg:h-[357px] flex flex-col">
                        <CardHeader className="p-3 md:p-4 border-b">
                            <CardTitle className="text-sm md:text-base font-bold text-gray-900">לוח שנה</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 flex-1 flex items-center justify-center overflow-hidden">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                locale={he}
                                dir="rtl"
                                className="w-full h-full flex flex-col"
                                modifiers={{ hasAppointment: appointmentDates }}
                                modifiersClassNames={{
                                    hasAppointment: 'has-appointment',
                                }}
                                classNames={{
                                    months: "flex flex-col flex-1",
                                    month: 'space-y-2 flex flex-col flex-1',
                                    caption: 'flex justify-center pt-1 relative items-center mb-1',
                                    caption_label: "text-sm font-medium",
                                    nav: "space-x-1 flex items-center",
                                    nav_button: 'h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100',
                                    nav_button_previous: "absolute left-1 top-1",
                                    nav_button_next: "absolute right-1 top-1",
                                    table: 'w-full border-collapse flex flex-col flex-1',
                                    head_row: 'flex w-full mt-1',
                                    head_cell: 'text-gray-500 rounded-md flex-1 text-center font-normal text-xs p-0',
                                    row: 'flex w-full mt-1 flex-1',
                                    cell: 'text-center p-0 relative flex-1',
                                    day: 'h-full w-full p-0 font-normal text-xs flex items-center justify-center rounded-sm',
                                    day_selected: 'bg-[#5932EA] text-white hover:bg-[#5932EA]',
                                    day_today: 'bg-gray-100 font-semibold',
                                    day_outside: 'text-gray-400 opacity-50',
                                    day_disabled: 'text-gray-400 opacity-50',
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <UpcomingAppointments appointments={upcomingAppointments} />
            
            <ActivityHistory activities={activities} />
        </div>
    );
}
