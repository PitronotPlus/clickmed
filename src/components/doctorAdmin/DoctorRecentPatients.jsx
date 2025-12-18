
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DoctorRecentPatients({ patients = [] }) {
    return (
        <Card className="bg-white shadow-[0px_10px_60px_rgba(226,236,249,0.5)] border-none rounded-lg h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">מטופלים אחרונים</CardTitle>
                <Button variant="ghost" size="sm" className="text-sm text-blue-600 hover:text-blue-700" asChild>
                    <Link to={createPageUrl('DoctorPatients')}>
                        כל המטופלים <ArrowRight className="w-4 h-4 mr-1" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {patients.length > 0 ? (
                        patients.map((patient) => (
                            <div key={patient.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={patient.avatar || `https://i.pravatar.cc/150?u=${patient.id}`} />
                                        <AvatarFallback>{patient.full_name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-gray-800">{patient.full_name || 'שם לא ידוע'}</p>
                                        <p className="text-xs text-gray-500">
                                            ביקור אחרון: {patient.lastVisit ? formatDistanceToNow(patient.lastVisit, { addSuffix: true, locale: he }) : 'לא ידוע'}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link to={createPageUrl(`PatientMedicalRecord?patientId=${patient.id}`)}>
                                        צפה בתיק
                                    </Link>
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center h-full flex items-center justify-center">
                            <p className="text-gray-500">אין מטופלים אחרונים</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
