import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Copy, Mail, Loader2 } from 'lucide-react';

export default function SendUploadLinkModal({ isOpen, onClose, patient }) {
    const [loading, setLoading] = useState(false);

    const getUploadLink = () => {
        return `${window.location.origin}/UploadDocuments?patientId=${patient.id}`;
    };

    const copyLink = () => {
        const link = getUploadLink();
        navigator.clipboard.writeText(link);
        alert('הקישור הועתק ללוח');
    };

    const sendEmail = async () => {
        if (!patient.email) {
            alert('למטופל אין כתובת אימייל במערכת');
            return;
        }

        setLoading(true);
        try {
            const link = getUploadLink();
            const currentUser = await base44.auth.me();

            await base44.integrations.Core.SendEmail({
                to: patient.email,
                subject: 'בקשה להעלאת מסמכים רפואיים',
                body: `
                    <div dir="rtl" style="font-family: Arial, sans-serif;">
                        <h2>שלום ${patient.full_name},</h2>
                        <p>נשלחת אליך בקשה להעלות מסמכים רפואיים למערכת.</p>
                        <p>אנא לחץ על הכפתור למטה כדי להעלות את המסמכים:</p>
                        <p>
                            <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #5932EA; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                                העלאת מסמכים
                            </a>
                        </p>
                        <p style="color: #666; font-size: 14px;">או העתק את הקישור הבא לדפדפן:</p>
                        <p style="color: #666; font-size: 14px;">${link}</p>
                        <p style="color: #666; font-size: 14px; margin-top: 20px;">
                            המסמכים יישמרו אוטומטית בתיק הרפואי שלך ויהיו זמינים לצוות הרפואי.
                        </p>
                        <br>
                        <p>בברכה,<br>${currentUser?.full_name || 'הצוות הרפואי'}</p>
                    </div>
                `
            });

            alert('הקישור נשלח בהצלחה למייל המטופל');
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
                    <DialogTitle>שליחת קישור להעלאת מסמכים</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-2">
                            שלח ל-{patient?.full_name} קישור להעלאת מסמכים רפואיים
                        </p>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                            <p className="font-semibold mb-2">קישור להעלאה:</p>
                            <p className="text-gray-600 break-all text-xs">{getUploadLink()}</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm text-blue-800">
                            💡 המסמכים שהמטופל יעלה יישמרו אוטומטית בתיק הרפואי שלו
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={copyLink}
                            variant="outline"
                            className="flex-1"
                        >
                            <Copy className="w-4 h-4 ml-2" />
                            העתק קישור
                        </Button>
                        <Button
                            onClick={sendEmail}
                            disabled={loading}
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