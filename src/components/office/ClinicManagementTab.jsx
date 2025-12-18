
import React, { useState, useEffect } from 'react';
import { Clinic } from '@/entities/Clinic';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ClinicManagementTab() {
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchClinics = async () => {
        setLoading(true);
        const allClinics = await Clinic.list('-created_date');
        setClinics(allClinics);
        setLoading(false);
    };

    useEffect(() => {
        fetchClinics();
    }, []);

    const handleApproveClinic = async (clinicId) => {
        await Clinic.update(clinicId, { status: 'active' });
        fetchClinics(); // Refresh list
        alert('המרפאה אושרה והפכה לפעילה.');
    };

    if (loading) {
        return <p className="text-center text-gray-500 py-8">טוען מרפאות...</p>;
    }

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-right">ניהול מרפאות שותפות</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-right">שם מרפאה</TableHead>
                        <TableHead className="text-right">איש קשר</TableHead>
                        <TableHead className="text-right">סטטוס</TableHead>
                        <TableHead className="text-right">קליקים / נרשמים</TableHead>
                        <TableHead className="text-right">תאריך הצטרפות</TableHead>
                        <TableHead className="text-center">פעולות</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clinics.map(clinic => (
                        <TableRow key={clinic.id}>
                            <TableCell className="font-semibold text-right">{clinic.name}</TableCell>
                            <TableCell className="text-right">{clinic.contact_person}</TableCell>
                            <TableCell className="text-right">
                                <Badge className={clinic.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                    {clinic.status === 'active' ? 'פעילה' : 'ממתינה לאישור'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">{clinic.clicks || 0} / {clinic.registrations || 0}</TableCell>
                            <TableCell className="text-right">{format(new Date(clinic.created_date), 'dd/MM/yyyy')}</TableCell>
                            <TableCell className="text-center">
                                {clinic.status === 'pending' && (
                                    <Button size="sm" onClick={() => handleApproveClinic(clinic.id)}>
                                        <CheckCircle className="w-4 h-4 ml-2" />
                                        אשר מרפאה
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {clinics.length === 0 && <p className="text-center text-gray-500 py-8">לא נמצאו מרפאות שותפות.</p>}
        </div>
    );
}
