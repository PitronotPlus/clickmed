
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Video } from 'lucide-react';
import { format } from 'date-fns';
import { User as UserEntity } from '@/entities/User';
import { Appointment } from '@/entities/Appointment';

const statusStyles = {
    'ממתין לאישור': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    'מאושר': { bg: 'bg-green-100', text: 'text-green-700' }, // Changed 'מאושר עבור עליה' to 'מאושר'
    'טופל': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'בוטל': { bg: 'bg-gray-100', text: 'text-gray-500' }
};

export default function DoctorAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            const currentUser = await UserEntity.me();
            setUser(currentUser);
            
            if (currentUser.user_type === 'doctor') {
                const doctorAppointments = await Appointment.filter({ doctor_id: currentUser.id }, '-date');
                setAppointments(doctorAppointments);
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="text-center p-8">טוען תורים...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold">כל התורים שלי</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>רשימת תורים מלאה</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>מטופל</TableHead>
                                    <TableHead>שירות</TableHead>
                                    <TableHead>תאריך</TableHead>
                                    <TableHead>שעה</TableHead>
                                    <TableHead>סוג</TableHead>
                                    <TableHead>סטטוס</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {appointments.length > 0 ? (
                                    appointments.map((appointment, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{appointment.patient_name || appointment.user_name || 'שם מטופל'}</TableCell>
                                            <TableCell>{appointment.specialty}</TableCell>
                                            <TableCell>{format(new Date(appointment.date), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>{format(new Date(appointment.date), 'HH:mm')}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Video className="w-4 h-4 text-purple-600" />
                                                    <span>Online</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${statusStyles[appointment.status]?.bg || 'bg-gray-100'} ${statusStyles[appointment.status]?.text || 'text-gray-700'}`}>
                                                    {appointment.status || 'ממתין לאישור'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            לא נמצאו תורים
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
