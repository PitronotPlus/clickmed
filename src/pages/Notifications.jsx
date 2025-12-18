
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemNotification } from '@/entities/SystemNotification';
import { User } from '@/entities/User';
import { Request } from '@/entities/Request';
import { Appointment } from '@/entities/Appointment';
import {
    Bell,
    CheckCircle,
    AlertTriangle,
    Settings,
    Calendar,
    CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

// Helper function to manage dismissed virtual notifications
const getDismissedNotifications = () => {
    const dismissed = sessionStorage.getItem('dismissedNotifications');
    return dismissed ? JSON.parse(dismissed) : [];
};

const addDismissedNotification = (id) => {
    const dismissed = getDismissedNotifications();
    if (!dismissed.includes(id)) {
        sessionStorage.setItem('dismissedNotifications', JSON.stringify([...dismissed, id]));
    }
};

const notificationIcons = {
    system: <Settings className="w-5 h-5 text-blue-500" />,
    admin: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    appointment: <Calendar className="w-5 h-5 text-green-500" />,
    payment: <CreditCard className="w-5 h-5 text-purple-500" />,
    request_status: <Bell className="w-5 h-5 text-blue-500" />,
    chat_message: <Settings className="w-5 h-5 text-green-500" />
};

const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadNotifications = async () => {
            setIsLoading(true);
            try {
                console.log('🔔 Notifications: Starting fresh fetch...');

                // Determine the correct user context (impersonated or real)
                const impersonatedUserId = sessionStorage.getItem('impersonatedUserId');
                let currentUser;
                if (impersonatedUserId) {
                     console.log(`[Notifications] Impersonation mode active. Fetching user ID: ${impersonatedUserId}`);
                    currentUser = await User.get(impersonatedUserId);
                } else {
                    console.log('[Notifications] Normal mode. Fetching current user.');
                    currentUser = await User.me();
                }

                console.log('👤 Current user for notifications:', {
                    id: currentUser.id,
                    email: currentUser.email,
                    user_type: currentUser.user_type,
                    permissions: currentUser.permissions
                });

                // EXACT SAME LOGIC AS LAYOUT - Check if user is office staff or admin
                const isOffice = currentUser.user_type === 'office' || currentUser.permissions?.includes('office');
                const isAdmin = currentUser.role === 'admin' || currentUser.permissions?.includes('admin');

                let userNotifications = [];

                if (isAdmin && !impersonatedUserId) {
                    // Admin sees all notifications
                    console.log('🔐 Admin mode: Loading all system notifications');
                    userNotifications = await SystemNotification.list('-created_date');
                } else if (isOffice) { // BUG FIX: Removed "!impersonatedUserId" to allow logic to run for impersonated office users
                    // Office staff sees system-wide notifications relevant to their work
                    console.log('🏢 Office mode: Using EXACT SAME LOGIC as Layout');

                    // EXACT SAME LOGIC AS LAYOUT:
                    // Fetch notifications that are NOT marked as read from the DB
                    const notifications = await SystemNotification.filter({
                        type: { $in: ['system', 'admin', 'payment', 'request_status'] }
                    });

                    // Add delay before next API call (same as Layout)
                    await new Promise(resolve => setTimeout(resolve, 250));

                    const [paymentRequests, paymentAppointments] = await Promise.all([
                        Request.filter({ status: 'ממתין לתשלום' }),
                        Appointment.filter({ status: 'ממתין לתשלום' })
                    ]);

                    // Create virtual notifications exactly like Layout does
                    const virtualNotifications = [];

                    // Create notifications for payment requests
                    paymentRequests.forEach(request => {
                        virtualNotifications.push({
                            id: `payment-request-${request.id}`,
                            title: 'בקשה ממתינה לתשלום',
                            message: `בקשה מ-${request.user_name} לשירות ${request.type} ממתינה לתשלום (₪${request.final_price})`,
                            type: 'payment',
                            priority: 'medium',
                            read: false,
                            created_date: request.created_date
                        });
                    });

                    // Create notifications for appointment payments
                    paymentAppointments.forEach(appointment => {
                        virtualNotifications.push({
                            id: `payment-appointment-${appointment.id}`,
                            title: 'תור ממתין לתשלום',
                            message: `תור של ${appointment.patient_name} עם ד"ר ${appointment.doctor} ממתין לתשלום (₪${appointment.final_price})`,
                            type: 'payment',
                            priority: 'medium',
                            read: false,
                            created_date: appointment.created_date
                        });
                    });

                    // Also add pending users notifications
                    const pendingUsers = await User.filter({ status: 'pending' });
                    pendingUsers.forEach(user => {
                        virtualNotifications.push({
                            id: `pending-user-${user.id}`,
                            title: 'משתמש חדש ממתין לאישור',
                            message: `${user.display_name || user.full_name} (${user.email}) נרשם למערכת וממתין לאישור`,
                            type: 'admin',
                            priority: 'high',
                            read: false, // Virtual notifications are always "unread" initially
                            created_date: user.created_date
                        });
                    });

                    // Combine real and virtual notifications
                    const allNotifications = [...notifications, ...virtualNotifications];
                    
                    // Filter out notifications that have been dismissed in the current session
                    const dismissedIds = getDismissedNotifications();
                    userNotifications = allNotifications
                        .map(n => ({...n, read: n.read || dismissedIds.includes(n.id) }))
                        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

                } else {
                    // Regular user or impersonated user - get their specific notifications
                    console.log('👤 User mode: Loading user-specific notifications for:', currentUser.id);
                    userNotifications = await SystemNotification.filter({ user_id: currentUser.id }, '-created_date');
                }

                console.log('✅ Final user notifications:', userNotifications.length);
                console.log('📋 Notifications details:', userNotifications.map(n => ({ id: n.id, title: n.title, type: n.type, read: n.read })));
                setNotifications(userNotifications);

            } catch (error) {
                console.error("❌ Error loading notifications:", error);
                setError('שגיאה בטעינת ההתראות: ' + error.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadNotifications();
        
        // Reload notifications every 60 seconds to stay in sync
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);

    }, []);

    const handleMarkAsRead = async (notificationId) => {
        console.log('🔔 Marking notification as read:', notificationId);
        try {
            // Virtual notifications start with a prefix, real ones don't.
            if (notificationId.startsWith('payment-') || notificationId.startsWith('pending-user-')) {
                console.log('📝 Virtual notification - dismissing locally');
                addDismissedNotification(notificationId); // Dismiss it in session storage
            } else {
                console.log('💾 Real notification - updating in database');
                await SystemNotification.update(notificationId, { read: true });
            }
            
            // Update UI immediately
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === notificationId ? { ...notif, read: true } : notif
                )
            );
        } catch (error) {
            console.error("❌ Error marking notification as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        const realUnreadIds = notifications
            .filter(n => !n.read && !n.id.startsWith('payment-') && !n.id.startsWith('pending-user-'))
            .map(n => n.id);

        const virtualUnreadIds = notifications
            .filter(n => !n.read && (n.id.startsWith('payment-') || n.id.startsWith('pending-user-')))
            .map(n => n.id);
            
        try {
            // Update all real notifications in the database if there are any
            if (realUnreadIds.length > 0) {
                await Promise.all(realUnreadIds.map(id => SystemNotification.update(id, { read: true })));
            }
            
            // Dismiss all virtual notifications
            virtualUnreadIds.forEach(id => addDismissedNotification(id));

            // Mark ALL notifications (real and virtual) as read in the local state for immediate UI feedback
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, read: true }))
            );
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const getFilteredNotifications = () => {
        if (activeTab === 'all') return notifications;
        if (activeTab === 'unread') return notifications.filter(n => !n.read);
        // This tab is for requests, which are a type of notification
        if (activeTab === 'request_status') return notifications.filter(n => n.type === 'request_status' || n.type === 'appointment');
        return notifications.filter(n => n.type === activeTab);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (isLoading) {
        return (
            <div className="text-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>טוען התראות...</p>
            </div>
        );
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

            <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                <div className="flex items-center gap-3">
                    <Bell className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold">התראות</h1>
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="text-sm">
                            {unreadCount} חדשות
                        </Badge>
                    )}
                </div>
                {unreadCount > 0 && (
                    <Button onClick={handleMarkAllAsRead} variant="outline">
                        <CheckCircle className="w-4 h-4 ml-2" />
                        סמן הכל כנקרא
                    </Button>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">הכל ({notifications.length})</TabsTrigger>
                    <TabsTrigger value="unread">לא נקרא ({unreadCount})</TabsTrigger>
                    <TabsTrigger value="request_status">בקשות ותורים</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4 pt-4">
                    {getFilteredNotifications().length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-8">
                                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-500">אין התראות</h3>
                                <p className="text-gray-400">לא נמצאו התראות בקטגוריה זו</p>
                            </CardContent>
                        </Card>
                    ) : (
                        getFilteredNotifications().map(notification => (
                            <Card
                                key={notification.id}
                                className={`${notification.read ? 'bg-gray-50' : 'bg-white border-r-4 border-blue-500'}`}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            {notificationIcons[notification.type] || notificationIcons.system}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className={`font-semibold ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                                                        {notification.title}
                                                    </h3>
                                                    <Badge className={priorityColors[notification.priority] || priorityColors.medium}>
                                                        {notification.priority === 'high' ? 'גבוה' :
                                                         notification.priority === 'medium' ? 'בינוני' : 'נמוך'}
                                                    </Badge>
                                                </div>
                                                <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {format(new Date(notification.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                                                </p>
                                            </div>
                                        </div>
                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
