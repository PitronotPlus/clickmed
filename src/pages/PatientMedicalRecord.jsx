import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { User as UserEntity } from '@/entities/User';
import { Appointment } from '@/entities/Appointment';
import { TestResult } from '@/entities/TestResult';
import { Medication } from '@/entities/Medication';
import { DoctorNote } from '@/entities/DoctorNote';
import { MedicalReferral } from '@/entities/MedicalReferral';
import { MedicalDocument } from '@/entities/MedicalDocument';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // Added Badge import
import { FileText, Stethoscope, Beaker, Pill, BookMarked, Users, Plus, Paperclip, ClipboardCheck, Send } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import AddMedicalDataModal from '@/components/doctors/AddMedicalDataModal';
import QuestionnaireResponsesTab from '@/components/patients/QuestionnaireResponsesTab';
import SendQuestionnaireModal from '@/components/patients/SendQuestionnaireModal';
import SendUploadLinkModal from '@/components/patients/SendUploadLinkModal';

const SectionCard = ({ title, icon: Icon, children, onAdd, canAdd }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl text-right"><Icon className="w-6 h-6" />{title}</CardTitle>
            {canAdd && (
                 <Button variant="outline" size="sm" onClick={onAdd}>
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף
                </Button>
            )}
        </CardHeader>
        <CardContent className="text-right">{children}</CardContent>
    </Card>
);

export default function PatientMedicalRecord() {
    const [patient, setPatient] = useState(null);
    const [doctor, setDoctor] = useState(null);
    const [data, setData] = useState({ appointments: [], testResults: [], medications: [], doctorNotes: [], medicalReferrals: [], medicalDocuments: [] });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [isSendQuestionnaireOpen, setIsSendQuestionnaireOpen] = useState(false);
    const [isSendUploadLinkOpen, setIsSendUploadLinkOpen] = useState(false);
    const location = useLocation();

    const getPatientId = useCallback(() => new URLSearchParams(location.search).get('patientId'), [location.search]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const patientId = getPatientId();
        if (!patientId) {
            setLoading(false);
            return;
        }

        try {
            const [currentDoctor, patientData] = await Promise.all([
                UserEntity.me(),
                UserEntity.get(patientId)
            ]);
            
            setDoctor(currentDoctor);
            setPatient(patientData);

            const [appointments, testResults, medications, doctorNotes, medicalReferrals, medicalDocuments] = await Promise.all([
                Appointment.filter({ user_id: patientId }, '-date'),
                TestResult.filter({ patient_id: patientId }, '-date'),
                Medication.filter({ patient_id: patientId }, '-start_date'),
                DoctorNote.filter({ patient_id: patientId }, '-date'),
                MedicalReferral.filter({ patient_id: patientId }, '-date'),
                MedicalDocument.filter({ patient_id: patientId }, '-date'),
            ]);

            setData({ appointments, testResults, medications, doctorNotes, medicalReferrals, medicalDocuments });
        } catch (error) {
            console.error("Error fetching patient medical record:", error);
        } finally {
            setLoading(false);
        }
    }, [getPatientId]); // fetchData now depends on getPatientId

    useEffect(() => {
        fetchData();
    }, [fetchData]); // useEffect now depends on fetchData

    const handleAddClick = (type) => {
        setModalType(type);
        setIsModalOpen(true);
    };
    
    const canAddData = doctor && (doctor.role === 'admin' || doctor.user_type === 'doctor');

    if (loading) {
        return <div className="text-center py-10" dir="rtl">טוען תיק רפואי...</div>;
    }

    if (!patient) {
        return <div className="text-center py-10 text-red-500" dir="rtl">שגיאה: לא נמצא מטופל.</div>;
    }

    return (
        <div className="space-y-6" dir="rtl">
            <Card className="overflow-hidden">
                <CardHeader className="bg-gray-50 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                            <AvatarImage src={patient.avatar} alt={patient.full_name} />
                            <AvatarFallback className="text-2xl">{patient.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="text-center md:text-right">
                            <CardTitle className="text-3xl font-bold">{patient.full_name}</CardTitle>
                            <CardDescription className="text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center md:justify-start">
                                <span>ת.ז: {patient.id_number || 'לא הוזן'}</span>
                                <span>ת. לידה: {patient.birth_date ? format(new Date(patient.birth_date), 'dd/MM/yyyy') : 'לא הוזן'}</span>
                                <span>טלפון: {patient.phone || 'לא הוזן'}</span>
                            </CardDescription>
                        </div>
                    </div>
                    {canAddData && (
                        <div className="flex gap-2">
                            <Button onClick={() => setIsSendQuestionnaireOpen(true)} className="bg-[#5932EA]">
                                <Send className="w-4 h-4 ml-2" />
                                שלח שאלון
                            </Button>
                            <Button onClick={() => setIsSendUploadLinkOpen(true)} variant="outline">
                                <FileText className="w-4 h-4 ml-2" />
                                קישור להעלאת מסמכים
                            </Button>
                        </div>
                    )}
                </CardHeader>
            </Card>

            <Tabs defaultValue="doctor-notes" className="w-full" dir="rtl">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-7" dir="rtl">
                    <TabsTrigger value="doctor-notes" className="text-right">הערות רופא</TabsTrigger>
                    <TabsTrigger value="appointments" className="text-right">תורים</TabsTrigger>
                    <TabsTrigger value="test-results" className="text-right">תוצאות בדיקה</TabsTrigger>
                    <TabsTrigger value="medications" className="text-right">תרופות</TabsTrigger>
                    <TabsTrigger value="referrals" className="text-right">הפניות</TabsTrigger>
                    <TabsTrigger value="documents" className="text-right">מסמכים</TabsTrigger>
                    <TabsTrigger value="questionnaires" className="text-right">שאלונים</TabsTrigger>
                </TabsList>

                <TabsContent value="doctor-notes" className="text-right">
                    <SectionCard title="הערות רופא" icon={BookMarked} onAdd={() => handleAddClick('doctorNote')} canAdd={canAddData}>
                        {data.doctorNotes.length > 0 ? (
                            <div className="space-y-4">
                                {data.doctorNotes.map(n => (
                                    <div key={n.id} className="p-4 bg-gray-50 rounded-lg border text-right">
                                        <div className="flex items-center justify-between mb-2 pb-2 border-b">
                                            <span className="font-semibold text-right">ד"ר {n.doctor}</span>
                                            <span className="text-xs text-gray-500">{format(new Date(n.date), 'PPP', { locale: he })}</span>
                                        </div>
                                        <p className="text-sm text-right">{n.note}</p>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-center text-gray-500 py-4">אין הערות רופא.</p>}
                    </SectionCard>
                </TabsContent>

                <TabsContent value="appointments" className="text-right">
                    <SectionCard title="תורים" icon={Stethoscope} canAdd={false}>
                         {data.appointments.length > 0 ? (
                            <div className="space-y-3">
                                {data.appointments.map(a => (
                                    <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-right">
                                        <div className="text-right">
                                            <h4 className="font-semibold text-right">{a.specialty}</h4>
                                            <p className="text-sm text-gray-600 text-right">ד"ר {a.doctor}</p>
                                            <p className="text-xs text-gray-500 text-right">
                                                {a.date ? format(new Date(a.date), 'dd/MM/yyyy HH:mm') : 'לא ידוע'}
                                            </p>
                                        </div>
                                        <Badge className="mr-2">{a.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-center text-gray-500 py-4">אין תורים.</p>}
                    </SectionCard>
                </TabsContent>

                <TabsContent value="test-results" className="text-right">
                    <SectionCard title="תוצאות בדיקה" icon={Beaker} onAdd={() => handleAddClick('testResult')} canAdd={canAddData}>
                        {data.testResults.length > 0 ? (
                             <div className="space-y-3">
                                {data.testResults.map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-right">
                                        <div className="text-right">
                                            <h4 className="font-semibold text-right">{t.test_name}</h4>
                                            <p className="text-xs text-gray-500 text-right">{format(new Date(t.date), 'dd/MM/yyyy')}</p>
                                        </div>
                                        <a href={t.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            צפה בקובץ
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-center text-gray-500 py-4">אין תוצאות בדיקה.</p>}
                    </SectionCard>
                </TabsContent>

                <TabsContent value="medications" className="text-right">
                    <SectionCard title="תרופות" icon={Pill} onAdd={() => handleAddClick('medication')} canAdd={canAddData}>
                        {data.medications.length > 0 ? (
                            <div className="space-y-3">
                                {data.medications.map(m => (
                                    <div key={m.id} className="p-3 bg-gray-50 rounded-lg text-right">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-right">{m.name}</h4>
                                            <Badge variant={m.status === 'פעיל' ? 'default' : 'secondary'}>{m.status}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 text-right">מינון: {m.dosage}</p>
                                        <p className="text-xs text-gray-500 text-right">תוקף: {format(new Date(m.start_date), 'dd/MM/yyyy')} - {m.end_date ? format(new Date(m.end_date), 'dd/MM/yyyy') : 'ללא הגבלה'}</p>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-center text-gray-500 py-4">אין תרופות רשומות.</p>}
                    </SectionCard>
                </TabsContent>

                <TabsContent value="referrals" className="text-right">
                    <SectionCard title="הפניות" icon={Users} onAdd={() => handleAddClick('medicalReferral')} canAdd={canAddData}>
                         {data.medicalReferrals.length > 0 ? (
                            <div className="space-y-3">
                                {data.medicalReferrals.map(r => (
                                    <div key={r.id} className="p-3 bg-gray-50 rounded-lg text-right">
                                        <h4 className="font-semibold text-right">הפניה ל{r.specialty}</h4>
                                        <p className="text-sm text-gray-600 text-right">מאת: ד"ר {r.from_doctor}</p>
                                        <p className="text-xs text-gray-500 text-right">{format(new Date(r.date), 'dd/MM/yyyy')}</p>
                                        <p className="text-sm mt-2 text-right">סיבה: {r.reason}</p>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-center text-gray-500 py-4">אין הפניות.</p>}
                    </SectionCard>
                </TabsContent>

                <TabsContent value="documents" className="text-right">
                    <SectionCard title="מסמכים" icon={Paperclip} onAdd={() => handleAddClick('medicalDocument')} canAdd={canAddData}>
                        {data.medicalDocuments.length > 0 ? (
                            <div className="space-y-3">
                                {data.medicalDocuments.map(d => (
                                    <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-right">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-gray-500" />
                                            <div className="text-right">
                                                <h4 className="font-semibold text-right">{d.name}</h4>
                                                <p className="text-xs text-gray-500 text-right">{format(new Date(d.date), 'dd/MM/yyyy')}</p>
                                            </div>
                                        </div>
                                        <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            הורד
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-center text-gray-500 py-4">אין מסמכים.</p>}
                    </SectionCard>
                </TabsContent>

                <TabsContent value="questionnaires" className="text-right">
                    <QuestionnaireResponsesTab patientId={patient.id} />
                </TabsContent>
            </Tabs>

            {isModalOpen && (
                <AddMedicalDataModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    modalType={modalType}
                    patient={patient}
                    doctor={doctor}
                    onSuccess={fetchData}
                />
            )}

            {isSendQuestionnaireOpen && (
                <SendQuestionnaireModal
                    isOpen={isSendQuestionnaireOpen}
                    onClose={() => setIsSendQuestionnaireOpen(false)}
                    patient={patient}
                />
            )}

            {isSendUploadLinkOpen && (
                <SendUploadLinkModal
                    isOpen={isSendUploadLinkOpen}
                    onClose={() => setIsSendUploadLinkOpen(false)}
                    patient={patient}
                />
            )}
        </div>
    );
}