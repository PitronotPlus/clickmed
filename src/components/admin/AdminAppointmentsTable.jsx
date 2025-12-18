
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const statusStyles = {
    'מאושר עבור עליה': { bg: 'bg-green-100', text: 'text-green-700' },
    'טופל': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'ממתין לאישור': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    'בוטל': { bg: 'bg-gray-100', text: 'text-gray-500' }
};

export default function AdminAppointmentsTable({ appointments = [] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>תורים אחרונים שנקבעו</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">מטופל</TableHead>
                                <TableHead className="text-right">רופא</TableHead>
                                <TableHead className="text-right">תאריך</TableHead>
                                <TableHead className="text-right">סטטוס</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {appointments.length > 0 ? (
                                appointments.slice(0, 5).map(appointment => (
                                    <TableRow key={appointment.id}>
                                        <TableCell>{appointment.patient_name || 'שם מטופל'}</TableCell>
                                        <TableCell>{appointment.doctor}</TableCell>
                                        <TableCell>{format(new Date(appointment.date), 'dd/MM/yyyy HH:mm', { locale: he })}</TableCell>
                                        <TableCell>
                                            <Badge className={`${statusStyles[appointment.status]?.bg || 'bg-gray-100'} ${statusStyles[appointment.status]?.text || 'text-gray-700'}`}>
                                                {appointment.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                        לא נמצאו תורים
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
