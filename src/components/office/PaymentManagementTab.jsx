import React, { useState, useEffect } from 'react';
import { Request } from '@/entities/Request';
import { Appointment } from '@/entities/Appointment';
import { User } from '@/entities/User';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Check, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function PaymentManagementTab() {
    const [items, setItems] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const [paymentRequests, paymentAppointments, allUsers] = await Promise.all([
            Request.filter({ status: 'ממתין לתשלום' }),
            Appointment.filter({ status: 'ממתין לתשלום' }),
            User.list()
        ]);
        
        const users = allUsers.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {});

        const combinedItems = [
            ...paymentRequests.map(r => ({ ...r, record_type: 'request' })),
            ...paymentAppointments.map(a => ({ ...a, record_type: 'appointment', type: a.specialty, user_name: a.patient_name }))
        ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

        setItems(combinedItems);
        setUsersMap(users);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSendReminder = (item) => {
        const patient = usersMap[item.user_id];
        alert(`תזכורת תשלום נשלחה אל ${patient.full_name}`);
        // In a real app, this would trigger an email or SMS
    };

    const handleMarkAsPaid = async (item) => {
        const confirmPaid = window.confirm(`האם לסמן את התשלום עבור ${item.user_name} כשולם? הפעולה תעביר את הפריט לארכיון.`);
        if (confirmPaid) {
            if (item.record_type === 'request') {
                await Request.update(item.id, { status: 'טופל' });
            } else {
                await Appointment.update(item.id, { status: 'טופל', payment_status: 'paid' });
            }
            fetchData(); // Refresh the list
            alert('הפריט סומן כשולם ומצבו עודכן ל"טופל".');
        }
    };
    
    const handleCancel = async (item) => {
        const confirmCancel = window.confirm(`האם לבטל את הפריט עבור ${item.user_name}?`);
        if (confirmCancel) {
            if (item.record_type === 'request') {
                await Request.update(item.id, { status: 'בוטל' });
            } else {
                await Appointment.update(item.id, { status: 'בוטל' });
            }
            fetchData(); // Refresh the list
            alert('הפריט בוטל והועבר לארכיון.');
        }
    };

    if (loading) {
        return <p className="text-center text-gray-500 py-8">טוען בקשות לתשלום...</p>;
    }

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-right">ניהול תשלומים</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-right">מטופל</TableHead>
                        <TableHead className="text-right">שירות</TableHead>
                        <TableHead className="text-right">רופא</TableHead>
                        <TableHead className="text-right">תאריך יצירה</TableHead>
                        <TableHead className="text-right">סכום</TableHead>
                        <TableHead className="text-center">פעולות</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map(item => (
                        <TableRow key={`${item.record_type}-${item.id}`}>
                            <TableCell className="text-right">{usersMap[item.user_id]?.full_name || 'לא ידוע'}</TableCell>
                            <TableCell className="text-right">
                                {item.record_type === 'appointment' ? 
                                    <Badge variant="outline">תור</Badge> : 
                                    <Badge variant="secondary">בקשה</Badge>
                                }
                                <span className="mr-2">{item.type}</span>
                            </TableCell>
                            <TableCell className="text-right">{item.doctor_name || item.doctor}</TableCell>
                            <TableCell className="text-right">{format(new Date(item.created_date), 'dd/MM/yyyy')}</TableCell>
                            <TableCell className="text-right font-semibold">₪{item.final_price || 'לא צוין'}</TableCell>
                            <TableCell className="text-center">
                                <div className="flex gap-2 justify-center">
                                    <Button size="sm" variant="outline" onClick={() => handleSendReminder(item)}>
                                        <Send className="w-4 h-4 ml-2" />
                                        תזכורת
                                    </Button>
                                    <Button size="sm" onClick={() => handleMarkAsPaid(item)} className="bg-green-600 hover:bg-green-700">
                                        <Check className="w-4 h-4 ml-2" />
                                        סמן כשולם
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleCancel(item)}>
                                        <XCircle className="w-4 h-4 ml-2" />
                                        ביטול
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {items.length === 0 && <p className="text-center text-gray-500 py-8">אין פריטים הממתינים לתשלום.</p>}
        </div>
    );
}