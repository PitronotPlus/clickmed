import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Video } from 'lucide-react'; // Changed to ArrowLeft for RTL logic
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DoctorAppointmentsTable({ appointments = [] }) {
    return (
        <Card className="bg-white shadow-[0px_10px_60px_rgba(226,236,249,0.5)] border-none rounded-lg h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">תורים קרובים</CardTitle>
                <Button variant="ghost" className="text-sm text-blue-600 hover:text-blue-700" asChild>
                    <Link to={createPageUrl('DoctorAppointments')} className="flex items-center">
                        צפה בכל התורים <ArrowLeft className="w-4 h-4 ml-1" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">מטופל</TableHead>
                            <TableHead className="text-right">שירות</TableHead>
                            <TableHead className="text-right">תאריך</TableHead>
                            <TableHead className="text-right">שעה</TableHead>
                            <TableHead className="text-right">סוג</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {appointments.length > 0 ? (
                            appointments.slice(0, 4).map((app, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium text-right">{app.patient_name || app.user_name || 'שם מטופל'}</TableCell>
                                    <TableCell className="text-right">{app.specialty}</TableCell>
                                    <TableCell className="text-right">{format(new Date(app.date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="text-right">{format(new Date(app.date), 'HH:mm')}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <span>Online</span>
                                            <Video className="w-4 h-4 text-purple-600" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    אין תורים קרובים
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}