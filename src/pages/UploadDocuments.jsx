import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Upload, CheckCircle, Loader2, FileText } from 'lucide-react';

export default function UploadDocuments() {
    const [patientId, setPatientId] = useState('');
    const [patient, setPatient] = useState(null);
    const [files, setFiles] = useState([]);
    const [documentType, setDocumentType] = useState('מסמך');
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('patientId');
        if (id) {
            setPatientId(id);
            loadPatient(id);
        } else {
            setLoading(false);
        }
    }, []);

    const loadPatient = async (id) => {
        try {
            const patientData = await base44.entities.User.get(id);
            setPatient(patientData);
        } catch (error) {
            console.error('Error loading patient:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
    };

    const handleUpload = async () => {
        if (files.length === 0 || !patientId) {
            alert('נא לבחור קבצים להעלאה');
            return;
        }

        setUploading(true);
        try {
            for (const file of files) {
                const { file_url } = await base44.integrations.Core.UploadFile({ file });

                await base44.entities.MedicalDocument.create({
                    patient_id: patientId,
                    name: file.name,
                    type: documentType,
                    doctor: 'העלאה עצמית',
                    date: new Date().toISOString(),
                    file_url: file_url,
                    file_size: `${(file.size / 1024).toFixed(2)} KB`,
                    file_format: file.type,
                    description: `הועלה על ידי המטופל`
                });
            }

            setUploaded(true);
            setFiles([]);
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('שגיאה בהעלאת הקבצים');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return <div className="text-center p-8">טוען...</div>;
    }

    if (!patientId || !patient) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="p-8">
                        <p className="text-red-500">קישור לא תקין או פג תוקף</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (uploaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="p-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">הקבצים הועלו בהצלחה!</h2>
                        <p className="text-gray-600 mb-6">
                            המסמכים שלך נשמרו בתיק הרפואי ויהיו זמינים לצוות הרפואי.
                        </p>
                        <Button onClick={() => window.close()}>
                            סגור חלון
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">העלאת מסמכים רפואיים</CardTitle>
                        {patient && (
                            <p className="text-gray-600 mt-2">
                                שלום {patient.full_name}, נא להעלות את המסמכים שביקשו ממך
                            </p>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label>סוג המסמך</Label>
                            <Select value={documentType} onValueChange={setDocumentType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="בדיקה">תוצאות בדיקה</SelectItem>
                                    <SelectItem value="הדמיה">הדמיה</SelectItem>
                                    <SelectItem value="מסמך">מסמך כללי</SelectItem>
                                    <SelectItem value="מרשם">מרשם</SelectItem>
                                    <SelectItem value="אחר">אחר</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>בחר קבצים להעלאה</Label>
                            <div className="mt-2">
                                <Input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                />
                            </div>
                            {files.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-sm font-semibold">קבצים נבחרו:</p>
                                    {files.map((file, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                            <FileText className="w-4 h-4" />
                                            <span>{file.name}</span>
                                            <span className="text-xs">({(file.size / 1024).toFixed(2)} KB)</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-800">
                                ℹ️ ניתן להעלות קבצים בפורמטים: PDF, JPG, PNG, DOC, DOCX
                            </p>
                        </div>

                        <Button
                            onClick={handleUpload}
                            disabled={uploading || files.length === 0}
                            className="w-full bg-[#5932EA] hover:bg-[#4a29c1]"
                            size="lg"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                                    מעלה קבצים...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5 ml-2" />
                                    העלה מסמכים
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}