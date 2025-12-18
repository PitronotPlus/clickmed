import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { MedicalRecord as MedicalRecordEntity } from '@/entities/MedicalRecord';
import { Appointment } from '@/entities/Appointment';
import { TestResult } from '@/entities/TestResult';
import { Medication } from '@/entities/Medication';
import { DoctorNote } from '@/entities/DoctorNote';
import { MedicalReferral } from '@/entities/MedicalReferral';
import { MedicalDocument } from '@/entities/MedicalDocument';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FileText, Stethoscope, Beaker, Pill, BookMarked, Users } from 'lucide-react';
import { format } from 'date-fns';

const SectionCard = ({ title, icon: Icon, children }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Icon className="w-5 h-5" />{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
    </Card>
);

export default function MedicalRecordPage() {
    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const impersonatedUserId = sessionStorage.getItem('impersonatedUserId');
                let user;
                if (impersonatedUserId) {
                    user = await User.get(impersonatedUserId);
                } else {
                    user = await User.me();
                }

                // מחפש תיק רפואי קיים, אם לא קיים יוצר חדש
                let medicalRecords = await MedicalRecordEntity.filter({ patient_id: user.id });
                let medicalRecord = null;
                if (medicalRecords.length === 0) {
                    // יוצר תיק רפואי בסיסי אם לא קיים
                    medicalRecord = await MedicalRecordEntity.create({
                        patient_id: user.id,
                        blood_type: 'לא ידוע',
                        insurance: user.insurance_provider || 'כללית',
                        allergies: [],
                        chronic_conditions: [],
                        last_update: new Date().toISOString().split('T')[0]
                    });
                } else {
                    medicalRecord = medicalRecords[0];
                }

                const [appointments, testResults, medications, doctorNotes, medicalReferrals, medicalDocuments] = await Promise.all([
                    Appointment.filter({ user_id: user.id }),
                    TestResult.filter({ patient_id: user.id }),
                    Medication.filter({ patient_id: user.id }),
                    DoctorNote.filter({ patient_id: user.id }),
                    MedicalReferral.filter({ patient_id: user.id }),
                    MedicalDocument.filter({ patient_id: user.id }),
                ]);

                setPatientData({
                    user,
                    medicalRecord,
                    appointments,
                    testResults,
                    medications,
                    doctorNotes,
                    medicalReferrals,
                    medicalDocuments,
                });
            } catch (error) {
                console.error("Error fetching medical record data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="text-center py-10">טוען תיק רפואי...</div>;
    }

    if (!patientData) {
        return <div className="text-center py-10">לא נמצא מידע רפואי.</div>;
    }

    const { user, medicalRecord, appointments, testResults, medications, doctorNotes, medicalReferrals, medicalDocuments } = patientData;

    return (
        <div className="space-y-6" dir="rtl">
            {/* Patient Header */}
            <Card className="overflow-hidden">
                <div className="bg-gray-100 p-6 flex items-center gap-6">
                    <Avatar className="h-24 w-24 border-4 border-white">
                        <AvatarImage src={user.avatar} alt={user.full_name} />
                        <AvatarFallback>{user.full_name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl font-bold">{user.display_name || user.full_name || 'משתמש'}</h1>
                        <div className="text-gray-500 flex gap-4 mt-2">
                            <span>ת.ז: {user.id_number || 'לא הוזן'}</span>
                            <span>ת. לידה: {user.birth_date ? format(new Date(user.birth_date), 'dd/MM/yyyy') : 'לא הוזן'}</span>
                            <span>סוג דם: {medicalRecord?.blood_type || 'לא ידוע'}</span>
                        </div>
                    </div>
                </div>
            </Card>

            <Tabs defaultValue="appointments" className="w-full" dir="rtl">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="appointments">תורים</TabsTrigger>
                    <TabsTrigger value="test-results">תוצאות בדיקה</TabsTrigger>
                    <TabsTrigger value="medications">תרופות</TabsTrigger>
                    <TabsTrigger value="doctor-notes">הערות רופא</TabsTrigger>
                    <TabsTrigger value="referrals">הפניות</TabsTrigger>
                    <TabsTrigger value="documents">מסמכים</TabsTrigger>
                </TabsList>

                <TabsContent value="appointments">
                    <SectionCard title="תורים" icon={Stethoscope}>
                        {appointments.length > 0 ? (
                            <div className="space-y-3">
                                {appointments.map(a => (
                                    <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-semibold">{a.specialty}</h4>
                                            <p className="text-sm text-gray-600">ד"ר {a.doctor}</p>
                                            <p className="text-xs text-gray-500">
                                                {a.date ? format(new Date(a.date), 'dd/MM/yyyy HH:mm') : 'לא ידוע'}
                                            </p>
                                        </div>
                                        <Badge className={
                                            a.status === 'מאושר' ? 'bg-green-100 text-green-700' :
                                            a.status === 'ממתין לאישור' ? 'bg-yellow-100 text-yellow-700' :
                                            a.status === 'בוטל' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }>
                                            {a.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : <p>אין תורים רשומים.</p>}
                    </SectionCard>
                </TabsContent>
                
                <TabsContent value="test-results">
                    <SectionCard title="תוצאות בדיקה" icon={Beaker}>
                        {testResults.length > 0 ? (
                            <div className="space-y-3">
                                {testResults.map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-semibold">{t.test_name}</h4>
                                            <p className="text-sm text-gray-600">ד"ר {t.doctor}</p>
                                            <p className="text-xs text-gray-500">{format(new Date(t.date), 'dd/MM/yyyy')}</p>
                                        </div>
                                        <Badge className={
                                            t.status === 'הושלם' ? 'bg-green-100 text-green-700' :
                                            t.status === 'בעיבוד' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }>
                                            {t.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : <p>אין תוצאות בדיקה.</p>}
                    </SectionCard>
                </TabsContent>
                
                <TabsContent value="medications">
                    <SectionCard title="תרופות" icon={Pill}>
                        {medications.length > 0 ? (
                            <div className="space-y-3">
                                {medications.map(m => (
                                    <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-semibold">{m.name}</h4>
                                            <p className="text-sm text-gray-600">מינון: {m.dosage}</p>
                                            <p className="text-xs text-gray-500">נרשם על ידי: ד"ר {m.doctor}</p>
                                        </div>
                                        <Badge className={
                                            m.status === 'פעיל' ? 'bg-green-100 text-green-700' :
                                            m.status === 'הופסק' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }>
                                            {m.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : <p>אין תרופות רשומות.</p>}
                    </SectionCard>
                </TabsContent>
                
                <TabsContent value="doctor-notes">
                    <SectionCard title="הערות רופא" icon={BookMarked}>
                        {doctorNotes.length > 0 ? (
                            <div className="space-y-3">
                                {doctorNotes.map(n => (
                                    <div key={n.id} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold">ד"ר {n.doctor}</span>
                                            <span className="text-xs text-gray-500">{format(new Date(n.date), 'dd/MM/yyyy')}</span>
                                        </div>
                                        <p className="text-sm">{n.note}</p>
                                        <Badge className="mt-2" variant={n.priority === 'גבוה' ? 'destructive' : 'secondary'}>
                                            עדיפות: {n.priority}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : <p>אין הערות רופא.</p>}
                    </SectionCard>
                </TabsContent>
                
                <TabsContent value="referrals">
                    <SectionCard title="הפניות" icon={Users}>
                        {medicalReferrals.length > 0 ? (
                            <div className="space-y-3">
                                {medicalReferrals.map(r => (
                                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-semibold">הפניה ל{r.specialty}</h4>
                                            <p className="text-sm text-gray-600">אל: ד"ר {r.to_doctor}</p>
                                            <p className="text-sm text-gray-600">מאת: ד"ר {r.from_doctor}</p>
                                            <p className="text-xs text-gray-500">{format(new Date(r.date), 'dd/MM/yyyy')}</p>
                                        </div>
                                        <Badge className={
                                            r.status === 'הושלם' ? 'bg-green-100 text-green-700' :
                                            r.status === 'ממתין' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }>
                                            {r.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : <p>אין הפניות.</p>}
                    </SectionCard>
                </TabsContent>
                
                <TabsContent value="documents">
                    <SectionCard title="מסמכים" icon={FileText}>
                        {medicalDocuments.length > 0 ? (
                            <div className="space-y-3">
                                {medicalDocuments.map(d => (
                                    <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-semibold">{d.name}</h4>
                                            <p className="text-sm text-gray-600">סוג: {d.type}</p>
                                            <p className="text-xs text-gray-500">הועלה על ידי: ד"ר {d.doctor} | {format(new Date(d.date), 'dd/MM/yyyy')}</p>
                                        </div>
                                        <a href={d.file_url} target="_blank" rel="noopener noreferrer" 
                                           className="text-blue-600 hover:underline text-sm">
                                            הורד
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : <p>אין מסמכים.</p>}
                    </SectionCard>
                </TabsContent>
            </Tabs>
        </div>
    );
}