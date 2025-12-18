
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { TestResult } from '@/entities/TestResult';
import { Medication } from '@/entities/Medication';
import { DoctorNote } from '@/entities/DoctorNote';
import { MedicalReferral } from '@/entities/MedicalReferral';
import { MedicalDocument } from '@/entities/MedicalDocument';
import { SystemNotification } from '@/entities/SystemNotification';
import { UploadFile } from '@/integrations/Core';
import { Beaker, Pill, BookMarked, Users, Loader2, Upload } from 'lucide-react';

export default function AddMedicalDataModal({ patient, doctor, isOpen, onClose, onSuccess, modalType }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Test Result Form
    const [testResult, setTestResult] = useState({
        test_name: '',
        status: 'בעיבוד',
        results: '',
        urgent: false,
        category: ''
    });

    // Medication Form
    const [medication, setMedication] = useState({
        name: '',
        dosage: '',
        status: 'פעיל',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: ''
    });

    // Doctor Note Form
    const [doctorNote, setDoctorNote] = useState({
        note: '',
        priority: 'בינוני',
        specialty: doctor?.specialties?.[0] || 'רפואה כללית',
        follow_up: ''
    });

    // Medical Referral Form
    const [referral, setReferral] = useState({
        to_doctor: '',
        specialty: '',
        reason: '',
        urgency: 'רגיל',
        notes: ''
    });

    // Medical Document Form
    const [document, setDocument] = useState({
        name: '',
        type: 'מסמך',
        description: '',
        file: null,
        uploading: false
    });

    const handleFileUpload = async (file) => {
        if (!file) return null;
        
        setDocument(prev => ({ ...prev, uploading: true }));
        try {
            const { file_url } = await UploadFile({ file });
            setDocument(prev => ({ ...prev, uploading: false }));
            return file_url;
        } catch (error) {
            console.error('Error uploading file:', error);
            setDocument(prev => ({ ...prev, uploading: false }));
            throw error;
        }
    };

    const handleSubmitTestResult = async () => {
        setIsSubmitting(true);
        try {
            await TestResult.create({
                patient_id: patient.id,
                doctor: doctor.full_name,
                date: new Date().toISOString().split('T')[0],
                ...testResult
            });
            
            await SystemNotification.create({
                user_id: patient.id,
                title: 'תוצאות בדיקה חדשות',
                message: `ד"ר ${doctor.full_name} הוסיף תוצאות בדיקה: ${testResult.test_name}`,
                type: 'admin',
                priority: 'medium'
            });

            setTestResult({ test_name: '', status: 'בעיבוד', results: '', urgent: false, category: '' });
            onSuccess && onSuccess();
            alert('תוצאות הבדיקה נוספו בהצלחה!');
            onClose();
        } catch (error) {
            console.error('Error adding test result:', error);
            alert('שגיאה בהוספת תוצאות הבדיקה');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitMedication = async () => {
        setIsSubmitting(true);
        try {
            await Medication.create({
                patient_id: patient.id,
                doctor: doctor.full_name,
                ...medication
            });
            
            await SystemNotification.create({
                user_id: patient.id,
                title: 'מרשם תרופות חדש',
                message: `ד"ר ${doctor.full_name} רשם לך תרופה: ${medication.name}`,
                type: 'admin',
                priority: 'high'
            });

            setMedication({ name: '', dosage: '', status: 'פעיל', start_date: new Date().toISOString().split('T')[0], end_date: '', notes: '' });
            onSuccess && onSuccess();
            alert('התרופה נוספה למרשם בהצלחה!');
            onClose();
        } catch (error) {
            console.error('Error adding medication:', error);
            alert('שגיאה בהוספת התרופה');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitDoctorNote = async () => {
        setIsSubmitting(true);
        try {
            await DoctorNote.create({
                patient_id: patient.id,
                doctor: doctor.full_name,
                date: new Date().toISOString().split('T')[0],
                ...doctorNote
            });
            
            await SystemNotification.create({
                user_id: patient.id,
                title: 'הערה חדשה מהרופא',
                message: `ד"ר ${doctor.full_name} הוסיף הערה חדשה לתיק הרפואי שלך`,
                type: 'admin',
                priority: 'medium'
            });

            setDoctorNote({ note: '', priority: 'בינוני', specialty: doctor?.specialties?.[0] || 'רפואה כללית', follow_up: '' });
            onSuccess && onSuccess();
            alert('ההערה נוספה בהצלחה!');
            onClose();
        } catch (error) {
            console.error('Error adding doctor note:', error);
            alert('שגיאה בהוספת ההערה');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitReferral = async () => {
        setIsSubmitting(true);
        try {
            await MedicalReferral.create({
                patient_id: patient.id,
                from_doctor: doctor.full_name,
                date: new Date().toISOString().split('T')[0],
                status: 'ממתין',
                ...referral
            });
            
            await SystemNotification.create({
                user_id: patient.id,
                title: 'הפניה רפואית חדשה',
                message: `ד"ר ${doctor.full_name} הפנה אותך ל${referral.specialty} - ד"ר ${referral.to_doctor}`,
                type: 'admin',
                priority: 'high'
            });

            setReferral({ to_doctor: '', specialty: '', reason: '', urgency: 'רגיל', notes: '' });
            onSuccess && onSuccess();
            alert('ההפניה נוספה בהצלחה!');
            onClose();
        } catch (error) {
            console.error('Error adding referral:', error);
            alert('שגיאה בהוספת ההפניה');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitDocument = async () => {
        if (!document.file) {
            alert('יש לבחור קובץ');
            return;
        }

        setIsSubmitting(true);
        try {
            const fileUrl = await handleFileUpload(document.file);
            
            await MedicalDocument.create({
                patient_id: patient.id,
                name: document.name || document.file.name,
                type: document.type,
                doctor: doctor.full_name,
                date: new Date().toISOString().split('T')[0],
                file_url: fileUrl,
                file_size: `${Math.round(document.file.size / 1024)}KB`,
                file_format: document.file.type,
                description: document.description
            });
            
            await SystemNotification.create({
                user_id: patient.id,
                title: 'מסמך רפואי חדש',
                message: `ד"ר ${doctor.full_name} הוסיף מסמך רפואי חדש לתיק שלך: ${document.name || document.file.name}`,
                type: 'admin',
                priority: 'medium'
            });

            setDocument({ name: '', type: 'מסמך', description: '', file: null, uploading: false });
            onSuccess && onSuccess();
            alert('המסמך נוסף בהצלחה!');
            onClose();
        } catch (error) {
            console.error('Error adding document:', error);
            alert('שגיאה בהוספת המסמך');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getModalContent = () => {
        switch(modalType) {
            case 'testResult':
                return {
                    title: 'הוספת תוצאות בדיקה',
                    icon: <Beaker className="w-5 h-5" />,
                    content: (
                        <div className="space-y-4" dir="rtl">
                            <Input
                                placeholder="שם הבדיקה"
                                value={testResult.test_name}
                                onChange={(e) => setTestResult({...testResult, test_name: e.target.value})}
                                className="text-right"
                                dir="rtl"
                            />
                            <Input
                                placeholder="קטגוריה (למשל: דם, שתן, הדמיה)"
                                value={testResult.category}
                                onChange={(e) => setTestResult({...testResult, category: e.target.value})}
                                className="text-right"
                                dir="rtl"
                            />
                            <Select value={testResult.status} onValueChange={(value) => setTestResult({...testResult, status: value})} dir="rtl">
                                <SelectTrigger className="text-right">
                                    <SelectValue placeholder="סטטוס הבדיקה" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="בעיבוד">בעיבוד</SelectItem>
                                    <SelectItem value="הושלם">הושלם</SelectItem>
                                    <SelectItem value="בוטל">בוטל</SelectItem>
                                </SelectContent>
                            </Select>
                            <Textarea
                                placeholder="תוצאות הבדיקה"
                                value={testResult.results}
                                onChange={(e) => setTestResult({...testResult, results: e.target.value})}
                                className="h-24 text-right"
                                dir="rtl"
                            />
                            <div className="flex items-center gap-2 justify-end">
                                <label htmlFor="urgent" className="text-right">בדיקה דחופה</label>
                                <input
                                    type="checkbox"
                                    id="urgent"
                                    checked={testResult.urgent}
                                    onChange={(e) => setTestResult({...testResult, urgent: e.target.checked})}
                                />
                            </div>
                        </div>
                    ),
                    onSubmit: handleSubmitTestResult,
                    submitText: 'הוסף תוצאות בדיקה',
                    canSubmit: testResult.test_name.trim()
                };

            case 'medication':
                return {
                    title: 'מרשם תרופות',
                    icon: <Pill className="w-5 h-5" />,
                    content: (
                        <div className="space-y-4" dir="rtl">
                            <Input
                                placeholder="שם התרופה"
                                value={medication.name}
                                onChange={(e) => setMedication({...medication, name: e.target.value})}
                                className="text-right"
                                dir="rtl"
                            />
                            <Input
                                placeholder="מינון (למשל: 10mg פעמיים ביום)"
                                value={medication.dosage}
                                onChange={(e) => setMedication({...medication, dosage: e.target.value})}
                                className="text-right"
                                dir="rtl"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-right">תאריך התחלה</label>
                                    <Input
                                        type="date"
                                        value={medication.start_date}
                                        onChange={(e) => setMedication({...medication, start_date: e.target.value})}
                                        className="text-right"
                                        dir="rtl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-right">תאריך סיום (אופציונלי)</label>
                                    <Input
                                        type="date"
                                        value={medication.end_date}
                                        onChange={(e) => setMedication({...medication, end_date: e.target.value})}
                                        className="text-right"
                                        dir="rtl"
                                    />
                                </div>
                            </div>
                            <Select value={medication.status} onValueChange={(value) => setMedication({...medication, status: value})} dir="rtl">
                                <SelectTrigger className="text-right">
                                    <SelectValue placeholder="סטטוס" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="פעיל">פעיל</SelectItem>
                                    <SelectItem value="הופסק">הופסק</SelectItem>
                                    <SelectItem value="הושלם">הושלם</SelectItem>
                                </SelectContent>
                            </Select>
                            <Textarea
                                placeholder="הערות והוראות (אופציונלי)"
                                value={medication.notes}
                                onChange={(e) => setMedication({...medication, notes: e.target.value})}
                                className="text-right"
                                dir="rtl"
                            />
                        </div>
                    ),
                    onSubmit: handleSubmitMedication,
                    submitText: 'הוסף למרשם',
                    canSubmit: medication.name.trim()
                };

            case 'doctorNote':
                return {
                    title: 'הערת רופא',
                    icon: <BookMarked className="w-5 h-5" />,
                    content: (
                        <div className="space-y-4" dir="rtl">
                            <Textarea
                                placeholder="תוכן ההערה"
                                value={doctorNote.note}
                                onChange={(e) => setDoctorNote({...doctorNote, note: e.target.value})}
                                className="h-32 text-right"
                                dir="rtl"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Select value={doctorNote.priority} onValueChange={(value) => setDoctorNote({...doctorNote, priority: value})} dir="rtl">
                                    <SelectTrigger className="text-right">
                                        <SelectValue placeholder="עדיפות" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="נמוך">נמוך</SelectItem>
                                        <SelectItem value="בינוני">בינוני</SelectItem>
                                        <SelectItem value="גבוה">גבוה</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="התמחות"
                                    value={doctorNote.specialty}
                                    onChange={(e) => setDoctorNote({...doctorNote, specialty: e.target.value})}
                                    className="text-right"
                                    dir="rtl"
                                />
                            </div>
                            <Textarea
                                placeholder="מעקב נדרש (אופציונלי)"
                                value={doctorNote.follow_up}
                                onChange={(e) => setDoctorNote({...doctorNote, follow_up: e.target.value})}
                                className="text-right"
                                dir="rtl"
                            />
                        </div>
                    ),
                    onSubmit: handleSubmitDoctorNote,
                    submitText: 'הוסף הערה',
                    canSubmit: doctorNote.note.trim()
                };

            case 'medicalReferral':
                return {
                    title: 'הפניה רפואית',
                    icon: <Users className="w-5 h-5" />,
                    content: (
                        <div className="space-y-4" dir="rtl">
                            <Input
                                placeholder="שם הרופא המופנה אליו"
                                value={referral.to_doctor}
                                onChange={(e) => setReferral({...referral, to_doctor: e.target.value})}
                                className="text-right"
                                dir="rtl"
                            />
                            <Input
                                placeholder="התמחות"
                                value={referral.specialty}
                                onChange={(e) => setReferral({...referral, specialty: e.target.value})}
                                className="text-right"
                                dir="rtl"
                            />
                            <Textarea
                                placeholder="סיבת ההפניה"
                                value={referral.reason}
                                onChange={(e) => setReferral({...referral, reason: e.target.value})}
                                className="h-24 text-right"
                                dir="rtl"
                            />
                            <Select value={referral.urgency} onValueChange={(value) => setReferral({...referral, urgency: value})} dir="rtl">
                                <SelectTrigger className="text-right">
                                    <SelectValue placeholder="דחיפות" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="נמוך">נמוך</SelectItem>
                                    <SelectItem value="רגיל">רגיל</SelectItem>
                                    <SelectItem value="דחוף">דחוף</SelectItem>
                                </SelectContent>
                            </Select>
                            <Textarea
                                placeholder="הערות נוספות (אופציונלי)"
                                value={referral.notes}
                                onChange={(e) => setReferral({...referral, notes: e.target.value})}
                                className="text-right"
                                dir="rtl"
                            />
                        </div>
                    ),
                    onSubmit: handleSubmitReferral,
                    submitText: 'הוסף הפניה',
                    canSubmit: referral.to_doctor.trim() && referral.specialty.trim()
                };

            case 'medicalDocument':
                return {
                    title: 'הוספת מסמך רפואי',
                    icon: <Upload className="w-5 h-5" />,
                    content: (
                        <div className="space-y-4" dir="rtl">
                            <Input
                                placeholder="שם המסמך (אופציונלי)"
                                value={document.name}
                                onChange={(e) => setDocument({...document, name: e.target.value})}
                                className="text-right"
                                dir="rtl"
                            />
                            <Select value={document.type} onValueChange={(value) => setDocument({...document, type: value})} dir="rtl">
                                <SelectTrigger className="text-right">
                                    <SelectValue placeholder="סוג המסמך" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="בדיקה">בדיקה</SelectItem>
                                    <SelectItem value="הדמיה">הדמיה</SelectItem>
                                    <SelectItem value="מסמך">מסמך</SelectItem>
                                    <SelectItem value="מרשם">מרשם</SelectItem>
                                </SelectContent>
                            </Select>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-right">העלאת קובץ</label>
                                <input
                                    type="file"
                                    onChange={(e) => setDocument({...document, file: e.target.files[0]})}
                                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    dir="rtl"
                                />
                                {document.file && (
                                    <p className="text-sm text-gray-600 mt-1 text-right">
                                        קובץ נבחר: {document.file.name}
                                    </p>
                                )}
                            </div>
                            <Textarea
                                placeholder="תיאור המסמך (אופציונלי)"
                                value={document.description}
                                onChange={(e) => setDocument({...document, description: e.target.value})}
                                className="text-right"
                                dir="rtl"
                            />
                        </div>
                    ),
                    onSubmit: handleSubmitDocument,
                    submitText: document.uploading ? 'מעלה...' : 'הוסף מסמך',
                    canSubmit: document.file && !document.uploading
                };

            default:
                return null;
        }
    };

    if (!isOpen || !patient || !modalType) return null;

    const modalConfig = getModalContent();
    if (!modalConfig) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-right">
                        <div className="flex items-center gap-2">
                           {modalConfig.icon}
                           <span>{modalConfig.title} עבור {patient.full_name || patient.display_name}</span>
                        </div>
                    </DialogTitle>
                </DialogHeader>
                
                <Card>
                    <CardContent className="p-6">
                        {modalConfig.content}
                    </CardContent>
                </Card>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>סגור</Button>
                    <Button 
                        onClick={modalConfig.onSubmit} 
                        disabled={isSubmitting || !modalConfig.canSubmit}
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                        {modalConfig.submitText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
