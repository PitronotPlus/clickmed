
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '@/entities/User';
import { Appointment } from '@/entities/Appointment';
import { SystemNotification } from '@/entities/SystemNotification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CreditCard, Calendar, Clock, User as UserIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { createPageUrl } from '@/utils';

export default function AppointmentPaymentPage() {
    const [appointment, setAppointment] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Moved inside useEffect to resolve dependency warning, as it uses location.search
        const getAppointmentId = () => new URLSearchParams(location.search).get('appointmentId');

        const fetchData = async () => {
            const appointmentId = getAppointmentId();
            if (!appointmentId) {
                navigate(createPageUrl('MyRequests'));
                return;
            }

            try {
                const [currentUser, appointmentData] = await Promise.all([
                    User.me(),
                    Appointment.get(appointmentId)
                ]);

                // Verify this appointment belongs to the current user
                if (appointmentData.user_id !== currentUser.id) {
                    alert('שגיאה: אין לך הרשאה לצפות בתור זה.');
                    navigate(createPageUrl('MyRequests'));
                    return;
                }

                // Check if appointment is in the correct status for payment
                if (appointmentData.status !== 'ממתין לתשלום') {
                    alert('שגיאה: התור לא במצב של המתנה לתשלום.');
                    navigate(createPageUrl('MyRequests'));
                    return;
                }

                setUser(currentUser);
                setAppointment(appointmentData);
            } catch (error) {
                console.error('Error loading appointment:', error);
                alert('שגיאה בטעינת פרטי התור.');
                navigate(createPageUrl('MyRequests'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [location.search, navigate]);

    const handlePayment = async () => {
        setPaymentProcessing(true);
        try {
            // Simulate payment processing (replace with real payment gateway)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Update appointment status
            await Appointment.update(appointment.id, {
                status: 'מאושר',
                payment_status: 'paid',
                payment_date: new Date().toISOString(),
                payment_method: 'אשראי'
            });

            // Send confirmation notification to patient
            await SystemNotification.create({
                user_id: user.id,
                title: 'התשלום בוצע בהצלחה!',
                message: `התור שלך עם ד"ר ${appointment.doctor} אושר ושולם. פרטי התור: ${format(new Date(appointment.date), 'PPP p', { locale: he })}`,
                type: 'payment',
                priority: 'high'
            });

            // Send notification to doctor
            await SystemNotification.create({
                user_id: appointment.doctor_id,
                title: 'תשלום התקבל עבור תור',
                message: `התקבל תשלום עבור התור עם ${user.display_name || user.full_name} בתאריך ${format(new Date(appointment.date), 'PPP p', { locale: he })}`,
                type: 'payment',
                priority: 'medium'
            });

            setPaymentSuccess(true);
        } catch (error) {
            console.error('Payment failed:', error);
            alert('שגיאה בביצוע התשלום. אנא נסה שוב.');
        } finally {
            setPaymentProcessing(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">טוען...</div>;
    }

    if (paymentSuccess) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4" dir="rtl">
                <Card className="text-center">
                    <CardContent className="pt-6">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-green-700 mb-2">התשלום בוצע בהצלחה!</h1>
                        <p className="text-gray-600 mb-6">התור שלך אושר וזומן. תקבל הודעה נוספת לפני התור.</p>
                        <div className="flex gap-4 justify-center">
                            <Button onClick={() => navigate(createPageUrl('MyRequests'))}>
                                צפה בתורים שלי
                            </Button>
                            <Button variant="outline" onClick={() => navigate(createPageUrl('Dashboard'))}>
                                חזור לדף הבית
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4" dir="rtl">
            <h1 className="text-3xl font-bold text-center mb-8">תשלום עבור התור</h1>
            
            <div className="grid gap-6">
                {/* Appointment Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            פרטי התור
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <UserIcon className="w-5 h-5 text-gray-500" />
                            <span className="font-semibold">ד"ר {appointment.doctor}</span>
                            <Badge variant="outline">{appointment.specialty}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <span>{format(new Date(appointment.date), 'PPPP', { locale: he })}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-gray-500" />
                            <span>{format(new Date(appointment.date), 'p', { locale: he })}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            פירוט תשלום
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span>מחיר בסיס:</span>
                            <span>₪{appointment.original_price || appointment.final_price}</span>
                        </div>
                        {appointment.discount_applied && (
                            <div className="flex justify-between items-center text-green-600">
                                <span>הנחה ({appointment.discount_applied}%):</span>
                                <span>-₪{Math.round((appointment.original_price * appointment.discount_applied) / 100)}</span>
                            </div>
                        )}
                        {user.subscription_type === 'premium' && user.subscription_status === 'active' && (
                            <div className="flex justify-between items-center text-purple-600">
                                <span>הנחת מנוי פרמיום:</span>
                                <Badge className="bg-purple-100 text-purple-800">כלול במנוי</Badge>
                            </div>
                        )}
                        <hr />
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>סך לתשלום:</span>
                            <span>₪{appointment.final_price}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Button */}
                <Card>
                    <CardContent className="pt-6 text-center">
                        <Button
                            onClick={handlePayment}
                            disabled={paymentProcessing}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                        >
                            {paymentProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                                    מעבד תשלום...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5 ml-2" />
                                    שלם עכשיו ₪{appointment.final_price}
                                </>
                            )}
                        </Button>
                        <p className="text-sm text-gray-500 mt-4">תשלום מאובטח באמצעות הצפנה</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
