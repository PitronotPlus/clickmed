import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Request } from '@/entities/Request';
import { Appointment } from '@/entities/Appointment';
import { User } from '@/entities/User';
import UserApprovalTab from '@/components/office/UserApprovalTab';
import PaymentManagementTab from '@/components/office/PaymentManagementTab';
import ClinicManagementTab from '@/components/office/ClinicManagementTab';
import CommunicationTab from '@/components/office/CommunicationTab';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function OfficePage() {
    const [activeTab, setActiveTab] = useState('user-approval');
    const [pendingUserCount, setPendingUserCount] = useState(0);
    const [pendingPaymentCount, setPendingPaymentCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                // Count pending user approvals
                const pendingUsers = await User.filter({ status: 'pending' });
                setPendingUserCount(pendingUsers.length);

                // Count pending payments (both requests and appointments)
                const [paymentRequests, paymentAppointments] = await Promise.all([
                    Request.filter({ status: 'ממתין לתשלום' }),
                    Appointment.filter({ status: 'ממתין לתשלום' })
                ]);
                
                const totalPendingPayments = paymentRequests.length + paymentAppointments.length;
                setPendingPaymentCount(totalPendingPayments);

            } catch (error) {
                console.error('Error fetching office counts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCounts();
    }, []);

    return (
        <ProtectedRoute requiredRoles={['admin', 'office', 'מנהל']}>
            <div className="space-y-6" dir="rtl">
                <div className="flex items-center gap-3">
                    <Briefcase className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold">משרד</h1>
                </div>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="user-approval" className="relative">
                            אישור משתמשים
                            {!loading && pendingUserCount > 0 && (
                                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                                    {pendingUserCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="payment-management" className="relative">
                            ניהול תשלומים
                            {!loading && pendingPaymentCount > 0 && (
                                <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs">
                                    {pendingPaymentCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="clinic-management">ניהול מרפאות</TabsTrigger>
                        <TabsTrigger value="communication">תקשורת</TabsTrigger>
                    </TabsList>

                    <TabsContent value="user-approval">
                        <UserApprovalTab />
                    </TabsContent>
                    
                    <TabsContent value="payment-management">
                        <PaymentManagementTab />
                    </TabsContent>
                    
                    <TabsContent value="clinic-management">
                        <ClinicManagementTab />
                    </TabsContent>
                    
                    <TabsContent value="communication">
                        <CommunicationTab />
                    </TabsContent>
                </Tabs>
            </div>
        </ProtectedRoute>
    );
}