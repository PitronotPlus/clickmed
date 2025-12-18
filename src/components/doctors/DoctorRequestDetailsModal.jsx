
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check, X, MessageSquare, Download, Send, BookMarked } from 'lucide-react';
import { Request } from '@/entities/Request';
import { Appointment } from '@/entities/Appointment';
import { settingsManager } from '@/components/utils/SettingsManager';
import { sendChatMessage } from '@/functions/sendChatMessage';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { SystemNotification } from '@/entities/SystemNotification';
import AddMedicalDataModal from './AddMedicalDataModal';

export default function DoctorRequestDetailsModal({ request, doctor, isOpen, onClose, onUpdateRequest }) {
    const [permissions, setPermissions] = useState(null);
    const [loadingPermissions, setLoadingPermissions] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectionInput, setShowRejectionInput] = useState(false);
    const [doctorNote, setDoctorNote] = useState('');
    
    // New states for chat functionality
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    
    // New state for medical data functionality
    const [isAddMedicalDataModalOpen, setIsAddMedicalDataModalOpen] = useState(false);

    // New state for appointment approval process
    const [isApproving, setIsApproving] = useState(false);

    useEffect(() => {
        const fetchPermissions = async () => {
            if (doctor?.id) {
                try {
                    const perms = await settingsManager.getDoctorPermissions(doctor.id);
                    setPermissions(perms);
                } catch (error) {
                    console.error("Failed to fetch doctor permissions:", error);
                } finally {
                    setLoadingPermissions(false);
                }
            } else {
                setLoadingPermissions(false);
            }
        };

        if (isOpen) {
            fetchPermissions();
            setShowRejectionInput(false);
            setRejectionReason('');
            setDoctorNote(request?.doctor_notes || '');
        }
    }, [isOpen, doctor, request]);

    // פונקציה לאישור תור - מעדכנת סטטוס ל"ממתין לתשלום"
    const handleApproveAppointment = async () => {
        // Validation check for doctor's consultation fee
        if (!doctor?.consultation_fee || doctor.consultation_fee < 10) {
            alert('⚠️ לא ניתן לאשר תור!\n\nעליך להגדיר מחיר ייעוץ בפרופיל שלך לפני אישור תורים.\nמחיר מינימום: 10 ש"ח\n\nעבור לפרופיל שלך ועדכן את המחיר בקטע "מידע מקצועי".');
            return;
        }

        if (!isApproving) {
            setIsApproving(true);
            
            try {
                // Calculate final price with potential premium discount
                const basePrice = doctor.consultation_fee;
                let finalPrice = basePrice;
                let discountApplied = 0;

                // Apply premium discount if patient is premium
                if (request.is_premium) {
                    discountApplied = 20; // 20% discount for premium users
                    finalPrice = Math.round(basePrice * 0.8);
                }

                // Update appointment status to "waiting for payment" and set prices
                await Appointment.update(request.id, { 
                    status: 'ממתין לתשלום',
                    original_price: basePrice,
                    final_price: finalPrice,
                    discount_applied: discountApplied,
                    updated_date: new Date().toISOString()
                });

                // Send notification to patient
                await SystemNotification.create({
                    user_id: request.user_id,
                    title: 'התור אושר - נדרש תשלום',
                    message: `התור שלך עם ד"ר ${doctor.display_name || doctor.full_name} אושר! עלות התור: ${finalPrice}₪${request.is_premium ? ' (כולל הנחת פרמיום)' : ''}. אנא בצע תשלום לאישור סופי של התור. תור שלא ישולם עד ${format(new Date(request.date), 'dd/MM/yyyy HH:mm', { locale: he })} יבוטל אוטומטית.`,
                    type: 'appointment',
                    priority: 'high'
                });

                alert('✅ התור אושר ונשלחה הודעה למטופל לביצוע התשלום.');
                onUpdateRequest && onUpdateRequest();
                onClose();
            } catch (error) {
                console.error('Error approving appointment:', error);
                alert('שגיאה באישור התור.');
            } finally {
                setIsApproving(false);
            }
        }
    };

    // פונקציה לאישור בקשה לייעוץ - מיועד לבקשות (לא תורים)
    const handleApproveConsultationRequest = async () => {
        // Validation check for doctor's consultation fee
        if (!doctor?.consultation_fee || doctor.consultation_fee < 10) {
            alert('⚠️ לא ניתן לאשר בקשה!\n\nעליך להגדיר מחיר ייעוץ בפרופיל שלך לפני אישור בקשות.\nמחיר מינימום: 10 ש"ח\n\nעבור לפרופיל שלך ועדכן את המחיר בקטע "מידע מקצועי".');
            return;
        }

        setIsUpdating(true);
        try {
            // Calculate final price with potential premium discount
            const basePrice = doctor.consultation_fee;
            let finalPrice = basePrice;
            let discountApplied = 0;

            // Apply premium discount if patient is premium
            if (request.is_premium) {
                discountApplied = 20; // 20% discount for premium users
                finalPrice = Math.round(basePrice * 0.8);
            }

            await Request.update(request.id, { 
                status: 'ממתין לתשלום',
                doctor_id: doctor.id,
                doctor_name: doctor.full_name,
                original_price: basePrice,
                final_price: finalPrice,
                discount_applied: discountApplied,
                updated_date: new Date().toISOString()
            });

            await SystemNotification.create({
                user_id: request.user_id,
                title: 'בקשתך אושרה!',
                message: `בקשתך לייעוץ עם ד"ר ${doctor.full_name} בתאריך ${format(new Date(request.date), 'dd/MM/yyyy', { locale: he })} בשעה ${request.time} אושרה. עלות הייעוץ: ${finalPrice}₪${request.is_premium ? ' (כולל הנחת פרמיום)' : ''}. כעת ממתינה לתשלום.`,
                type: 'appointment',
                priority: 'high'
            });

            alert('✅ הבקשה אושרה בהצלחה והמטופל קיבל התראה!');
            onUpdateRequest && onUpdateRequest();
            onClose();
        } catch (error) {
            console.error('Error approving request:', error);
            alert('שגיאה באישור.');
        } finally {
            setIsUpdating(false);
        }
    };

    // פונקציה לדחיית הבקשה או התור
    const handleRejectRequest = async () => {
        if (!rejectionReason.trim()) {
            alert('יש למלא סיבת דחייה.');
            return;
        }

        setIsUpdating(true);
        try {
            const isAppointment = request.record_type === 'appointment';
            
            if (isAppointment) {
                // Update Appointment entity
                await Appointment.update(request.id, { 
                    status: 'בוטל',
                    updated_date: new Date().toISOString()
                });
                
                await SystemNotification.create({
                    user_id: request.user_id,
                    title: 'התור בוטל',
                    message: `לצערנו, התור שלך עם ד"ר ${doctor.full_name} בוטל. סיבה: ${rejectionReason}`,
                    type: 'admin',
                    priority: 'medium'
                });
            } else {
                // Update Request entity
                await Request.update(request.id, { 
                    status: 'בקשה נדחתה',
                    rejection_reason: rejectionReason,
                    updated_date: new Date().toISOString()
                });

                await SystemNotification.create({
                    user_id: request.user_id,
                    title: 'בקשתך נדחתה',
                    message: `לצערנו, בקשתך לייעוץ עם ד"ר ${doctor.full_name} נדחתה. סיבה: ${rejectionReason}`,
                    type: 'admin',
                    priority: 'medium'
                });
            }

            alert(isAppointment ? 'התור בוטל והמטופל קיבל התראה!' : 'הבקשה נדחתה והמטופל קיבל התראה!');
            onUpdateRequest && onUpdateRequest();
            onClose();
        } catch (error) {
            console.error('Error rejecting request/appointment:', error);
            alert('שגיאה בדחיית הפריט.');
        } finally {
            setIsUpdating(false);
        }
    };

    // פונקציה להוספת הערת רופא - רק לבקשות במקור
    const handleAddDoctorNote = async () => {
        if (!doctorNote.trim()) {
            alert('יש למלא הערה.');
            return;
        }

        if (request.record_type === 'appointment') {
            alert('הוספת הערות רופא זמינה רק לבקשות ייעוץ (לא לתורים).');
            return;
        }

        setIsUpdating(true);
        try {
            await Request.update(request.id, { 
                doctor_notes: doctorNote.trim(),
                updated_date: new Date().toISOString()
            });

            await SystemNotification.create({
                user_id: request.user_id,
                title: 'הערה חדשה מהרופא',
                message: `ד"ר ${doctor.full_name} הוסיף הערה חדשה לבקשה שלך בנושא ${request.type}.`,
                type: 'admin',
                priority: 'medium'
            });

            alert('ההערה נשמרה בהצלחה והמטופל קיבל התראה!');
            onUpdateRequest && onUpdateRequest();
        } catch (error) {
            console.error('Error adding doctor note:', error);
            alert('שגיאה בשמירת ההערה.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDownload = (docUrl, docName) => {
        const link = document.createElement('a');
        link.href = docUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.download = docName || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSendMessage = async () => {
        if (!chatMessage.trim()) return;

        setIsSendingMessage(true);
        try {
            await sendChatMessage({
                targetUserId: request.user_id,
                messageContent: chatMessage
            });
            alert('ההודעה נשלחה בהצלחה!');
            setChatMessage('');
            setIsChatModalOpen(false);
        } catch (error) {
            console.error('Error sending message:', error);
            alert('שגיאה בשליחת ההודעה.');
        } finally {
            setIsSendingMessage(false);
        }
    };

    if (!isOpen || !request) return null;
    
    const statusStyles = {
        'בקשה בבדיקה': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
        'ממתין לתשלום': { bg: 'bg-orange-100', text: 'text-orange-700' },
        'מאושר': { bg: 'bg-green-100', text: 'text-green-700' },
        'טופל': { bg: 'bg-blue-100', text: 'text-blue-700' },
        'בקשה נדחתה': { bg: 'bg-red-100', text: 'text-red-700' },
        'ממתין לזימון תור': { bg: 'bg-purple-100', text: 'text-purple-700' },
        'בוטל': { bg: 'bg-gray-100', text: 'text-gray-500' },
        'מחפש רופא': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
        'ממתין לאישור': { bg: 'bg-yellow-100', text: 'text-yellow-700' }
    };
    
    const isArenaRequest = request.status === 'מחפש רופא';
    const isAppointment = request.record_type === 'appointment';
    const questionnaireAnswers = request.questionnaire_answers ? Object.entries(request.questionnaire_answers) : [];
    const documents = request.documents || [];
    const isPastDue = new Date(request.date) < new Date();

    const getActionButtons = () => {
        if (isAppointment) {
            if (request.status === 'ממתין לאישור') {
                return (
                    <div className="flex gap-2 w-full sm:w-auto justify-center">
                        <Button 
                            onClick={handleApproveAppointment} 
                            disabled={isApproving || isPastDue} 
                            className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            title={isPastDue ? "לא ניתן לאשר תור מתאריך עבר" : ""}
                        >
                            {isApproving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Check className="w-4 h-4 ml-2" />}
                            {isApproving ? 'מאשר...' : 'אשר תור'}
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={() => setShowRejectionInput(true)} 
                            disabled={isApproving}
                            className="flex-1"
                        >
                            <X className="w-4 h-4 ml-2" />
                            דחה תור
                        </Button>
                    </div>
                );
            } else if (request.status === 'ממתין לתשלום') {
                return (
                    <div className="text-center w-full sm:w-auto">
                        <Badge className="bg-orange-100 text-orange-800 p-2 text-base">ממתין לתשלום מהמטופל</Badge>
                    </div>
                );
            } else if (request.status === 'מאושר') {
                return (
                    <div className="text-center w-full sm:w-auto">
                        <Badge className="bg-green-100 text-green-800 p-2 text-base">התור מאושר ושולם</Badge>
                    </div>
                );
            } else {
                return null;
            }
        } else {
            if (!isArenaRequest) {
                return (
                    <div className="flex gap-2 w-full sm:w-auto justify-center">
                        <Button 
                            onClick={handleApproveConsultationRequest} 
                            disabled={isUpdating || isPastDue}
                            className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            title={isPastDue ? "לא ניתן לאשר בקשה מתאריך עבר" : ""}
                        >
                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Check className="w-4 h-4 ml-2" />}
                            אשר וקבע תור
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={() => setShowRejectionInput(true)} 
                            disabled={isUpdating}
                            className="flex-1"
                        >
                            <X className="w-4 h-4 ml-2"/>
                            דחה בקשה
                        </Button>
                    </div>
                );
            }
            return null;
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" dir="rtl">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">
                                {request.record_type === 'appointment' ? 'פרטי התור' : 'פרטי הבקשה'}
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">מטופל</label>
                                    <p className="text-gray-900">{request.user_name || request.patient_name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">תחום</label>
                                    <p className="text-gray-900">{request.type || request.specialty}</p>
                                </div>
                            </div>

                            {request.record_type === 'appointment' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">תאריך התור</label>
                                        <p className="text-gray-900">{format(new Date(request.date), 'dd/MM/yyyy', { locale: he })}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">שעת התור</label>
                                        <p className="text-gray-900">{format(new Date(request.date), 'HH:mm')}</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
                                <Badge className={`${statusStyles[request.status]?.bg || 'bg-gray-100'} ${statusStyles[request.status]?.text || 'text-gray-700'} font-semibold`}>
                                    {request.status}
                                </Badge>
                            </div>

                            {request.notes && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">הערות המטופל</label>
                                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-right">{request.notes}</p>
                                </div>
                            )}

                            {request.description && request.record_type !== 'appointment' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">תיאור הבעיה</label>
                                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-right">{request.description}</p>
                                </div>
                            )}

                            {!isAppointment && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <div className="bg-purple-100 rounded-t-lg p-3 text-center">
                                            <h4 className="font-bold text-purple-800">שאלון טרם הגשת הבקשה</h4>
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-b-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                                            {questionnaireAnswers.length > 0 ? (
                                                questionnaireAnswers.map(([question, answer], index) => (
                                                    <div key={index} className="flex justify-between items-start">
                                                        <Badge variant="secondary">{String(answer)}</Badge>
                                                        <span className="text-sm font-semibold text-right flex-1 mr-2">{question}</span>
                                                    </div>
                                                ))
                                            ) : <p className="text-center text-gray-500 py-4">לא מולא שאלון לבקשה זו.</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="bg-blue-100 rounded-t-lg p-3 text-center">
                                            <h4 className="font-bold text-blue-800">מסמכים רלוונטיים</h4>
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-b-lg p-4">
                                            {documents && documents.length > 0 ? (
                                                <div className="flex justify-center gap-4 flex-wrap">
                                                    {documents.map((doc, index) => (
                                                        <div key={index} className="text-center w-24">
                                                            <button 
                                                                onClick={() => handleDownload(doc.url, doc.name)}
                                                                className="w-20 h-24 bg-gray-50 rounded-lg border flex flex-col items-center justify-center mb-1 cursor-pointer hover:shadow-md transition-shadow"
                                                            >
                                                                <Download className="w-6 h-6 text-gray-600 mb-1" />
                                                                <span className="text-xs text-red-500 font-bold">PDF</span>
                                                            </button>
                                                            <p className="text-xs text-black break-words">{doc.name}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (<p className="text-center text-gray-500 py-4">לא צורפו מסמכים.</p>)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isArenaRequest && !isAppointment && (
                                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">הערות רופא למטופל</label>
                                    <Textarea
                                        value={doctorNote}
                                        onChange={(e) => setDoctorNote(e.target.value)}
                                        placeholder="הוסף הערות שיהיו גלויות למטופל..."
                                        className="w-full min-h-[100px] text-right"
                                    />
                                    <Button onClick={handleAddDoctorNote} disabled={isUpdating || !doctorNote.trim()} className="mt-2">
                                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin ml-2"/> : <Send className="w-4 h-4 ml-2" />}
                                        שמור הערה
                                    </Button>
                                </div>
                            )}

                            {showRejectionInput && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <h4 className="font-bold text-red-700 mb-2">סיבת הדחייה:</h4>
                                    <Textarea
                                        className="w-full h-24 text-right resize-none mb-2"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="נא פרט את סיבת הדחייה..."
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleRejectRequest}
                                            disabled={isUpdating || !rejectionReason.trim()}
                                            variant="destructive"
                                        >
                                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                                            אשר דחייה
                                        </Button>
                                        <Button
                                            onClick={() => setShowRejectionInput(false)}
                                            variant="outline"
                                        >
                                            ביטול
                                        </Button>
                                    </div>
                                </div>
                            )}
                            
                            <div className="pt-4 flex-col-reverse sm:flex-row sm:justify-between w-full">
                                {getActionButtons()}
                            </div>
                        </div>
                        
                        <div className="pt-6 mt-6 border-t flex flex-col sm:flex-row sm:justify-end gap-2 w-full">
                            <Button variant="outline" onClick={onClose}>סגור</Button>
                            <Button variant="outline" onClick={() => setIsChatModalOpen(true)}>
                                    <MessageSquare className="w-4 h-4 ml-2"/>
                                    שלח הודעה למטופל
                            </Button>
                            <Button variant="outline" onClick={() => setIsAddMedicalDataModalOpen(true)}>
                                    <BookMarked className="w-4 h-4 ml-2"/>
                                    הוסף מידע רפואי
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Modal */}
            <Dialog open={isChatModalOpen} onOpenChange={setIsChatModalOpen} dir="rtl">
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{`שליחת הודעה אל ${request.user_name || request.patient_name}`}</DialogTitle>
                        <DialogDescription>ההודעה תשלח למטופל ותופיע באזור ההודעות האישי שלו.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Textarea 
                            placeholder="כתוב את הודעתך כאן..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            className="min-h-[120px] text-right"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsChatModalOpen(false)}>ביטול</Button>
                        <Button onClick={handleSendMessage} disabled={isSendingMessage || !chatMessage.trim()}>
                            {isSendingMessage ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Send className="w-4 h-4 ml-2" />}
                            שלח הודעה
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Medical Data Modal */}
            <AddMedicalDataModal
                patient={{ id: request.user_id, full_name: request.user_name }}
                doctor={doctor}
                isOpen={isAddMedicalDataModalOpen}
                onClose={() => setIsAddMedicalDataModalOpen(false)}
                onSuccess={() => {
                    setIsAddMedicalDataModalOpen(false);
                    onUpdateRequest && onUpdateRequest();
                }}
            />
        </>
    );
}
