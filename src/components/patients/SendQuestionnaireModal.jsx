import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Copy, Mail, Loader2 } from 'lucide-react';

export default function SendQuestionnaireModal({ isOpen, onClose, patient }) {
    const [questionnaires, setQuestionnaires] = useState([]);
    const [selectedQuestionnaire, setSelectedQuestionnaire] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadQuestionnaires();
            loadUser();
        }
    }, [isOpen]);

    const loadUser = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
        } catch (error) {
            console.error('Error loading user:', error);
        }
    };

    const loadQuestionnaires = async () => {
        try {
            const data = await base44.entities.Questionnaire.filter({ is_active: true });
            setQuestionnaires(data);
        } catch (error) {
            console.error('Error loading questionnaires:', error);
        }
    };

    const getQuestionnaireLink = () => {
        if (!selectedQuestionnaire) return '';
        return `${window.location.origin}/FillQuestionnaire?id=${selectedQuestionnaire}`;
    };

    const copyLink = () => {
        const link = getQuestionnaireLink();
        navigator.clipboard.writeText(link);
        alert('הקישור הועתק ללוח');
    };

    const sendEmail = async () => {
        if (!selectedQuestionnaire) {
            alert('נא לבחור שאלון');
            return;
        }

        if (!patient.email) {
            alert('למטופל אין כתובת אימייל במערכת');
            return;
        }

        setLoading(true);
        try {
            const questionnaire = questionnaires.find(q => q.id === selectedQuestionnaire);
            const link = getQuestionnaireLink();

            await base44.integrations.Core.SendEmail({
                to: patient.email,
                subject: `שאלון לחתימה: ${questionnaire.title}`,
                body: `
                    <div dir="rtl" style="font-family: Arial, sans-serif;">
                        <h2>שלום ${patient.full_name},</h2>
                        <p>נשלח אליך שאלון למילוי: <strong>${questionnaire.title}</strong></p>
                        ${questionnaire.description ? `<p>${questionnaire.description}</p>` : ''}
                        <p>
                            <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #5932EA; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                                למילוי השאלון לחץ כאן
                            </a>
                        </p>
                        <p style="color: #666; font-size: 14px;">או העתק את הקישור הבא לדפדפן:</p>
                        <p style="color: #666; font-size: 14px;">${link}</p>
                        <br>
                        <p>בברכה,<br>${user?.full_name || 'הצוות הרפואי'}</p>
                    </div>
                `
            });

            alert('השאלון נשלח בהצלחה למייל המטופל');
            onClose();
        } catch (error) {
            console.error('Error sending email:', error);
            alert('שגיאה בשליחת האימייל');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>שליחת שאלון ל-{patient?.full_name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>בחר שאלון</Label>
                        <Select value={selectedQuestionnaire} onValueChange={setSelectedQuestionnaire}>
                            <SelectTrigger>
                                <SelectValue placeholder="בחר שאלון..." />
                            </SelectTrigger>
                            <SelectContent>
                                {questionnaires.map(q => (
                                    <SelectItem key={q.id} value={q.id}>
                                        {q.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedQuestionnaire && (
                        <div className="bg-gray-50 p-3 rounded text-sm">
                            <p className="font-semibold mb-2">קישור לשאלון:</p>
                            <p className="text-gray-600 break-all text-xs">{getQuestionnaireLink()}</p>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            onClick={copyLink}
                            disabled={!selectedQuestionnaire}
                            variant="outline"
                            className="flex-1"
                        >
                            <Copy className="w-4 h-4 ml-2" />
                            העתק קישור
                        </Button>
                        <Button
                            onClick={sendEmail}
                            disabled={!selectedQuestionnaire || loading}
                            className="flex-1 bg-[#5932EA]"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            ) : (
                                <Mail className="w-4 h-4 ml-2" />
                            )}
                            שלח למייל
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}