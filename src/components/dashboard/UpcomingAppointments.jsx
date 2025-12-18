import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const statusStyles = {
    'ממתין לאישור': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    'מאושר': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    'טופל': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    'בוטל': { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
};

export default function UpcomingAppointments({ appointments }) {
    return (
        <Card className="bg-transparent rounded-lg border-none shadow-none w-full">
            <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-black">תורים קרובים</CardTitle>
                <Link to={createPageUrl('ScheduleAppointment')}>
                    <Button variant="ghost" className="text-sm font-semibold text-[#5932EA]">
                        <Plus className="w-4 h-4 ml-1" />
                        קבע תור חדש
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="p-0">
                <div className="space-y-3">
                    {appointments && appointments.length > 0 ? (
                        appointments.map((appointment, index) => (
                            <div key={appointment.id || index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{appointment.specialty}</p>
                                        <p className="text-sm text-gray-500">עם ד"ר {appointment.doctor}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mt-3 sm:mt-0">
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        <span>{format(new Date(appointment.date), 'dd/MM/yyyy')}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <Clock className="w-4 h-4" />
                                        <span>{format(new Date(appointment.date), 'HH:mm')}</span>
                                    </div>
                                    <Badge className={`${statusStyles[appointment.status]?.bg || 'bg-gray-100'} ${statusStyles[appointment.status]?.text || 'text-gray-700'}`}>
                                        {appointment.status}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
                            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p>אין לך תורים קרובים.</p>
                            <p className="text-sm mt-1">ברגע שיקבע לך תור חדש, הוא יופיע כאן.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}