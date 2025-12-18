import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { sendChatMessage } from '@/functions/sendChatMessage';

const statusStyles = {
    'בקשה בבדיקה': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    'ממתין לתשלום': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    'מאושר': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    'מאושר עבור עליה': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    'טופל': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    'בקשה נדחתה': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
    'ממתין לזימון תור': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    'בוטל': { bg: 'bg-gray-200', text: 'text-gray-600', border: 'border-gray-400' }
};

export default function ChatModal({ request, isOpen, onClose }) {
    const [recipient, setRecipient] = useState('representative');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    if (!request) return null;

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        setIsSending(true);
        try {
            const payload = {
                messageContent: message.trim()
            };

            if (recipient === 'representative') {
                payload.targetRole = 'representative';
            } else {
                payload.targetUserId = request.doctor_id;
            }
            
            const response = await sendChatMessage(payload);

            if (response && response.data && response.data.success) {
                alert(`הודעתך נשלחה בהצלחה אל ${recipient === 'representative' ? 'נציג המערכת' : request.doctor_name}`);
                setMessage('');
                onClose();
            } else {
                const errorMessage = (response && response.data && response.data.error) || 'Unknown error occurred';
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            alert(`שגיאה בשליחת ההודעה: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl p-8 bg-white rounded-lg shadow-xl" dir="rtl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-bold text-center">פתיחת פנייה</DialogTitle>
                </DialogHeader>

                <div className="bg-[#FAFAFA] p-4 rounded-lg mb-6">
                    <div className="flex justify-between items-center flex-wrap">
                        <div className="text-right">
                            <p className="font-bold text-base">{`${request.type}`}</p>
                            <p className="text-sm text-gray-500">{request.doctor_name || 'טרם שויך רופא'}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-medium">
                            <Badge className={`${statusStyles[request.status]?.bg} ${statusStyles[request.status]?.text} ${statusStyles[request.status]?.border} font-bold text-xs px-3 py-1 border rounded-md`}>
                                {request.status === 'מאושר עבור עליה' ? 'מאושר' : request.status}
                            </Badge>
                             <span>{request.time}</span>
                            <span>{format(new Date(request.date), 'dd/MM/yy')}</span>
                            <span>{request.day_name}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#FBFBFB] p-6 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="text-lg font-bold">שלח אל:</h3>
                         <Select value={recipient} onValueChange={setRecipient}>
                            <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder="בחר נמען" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="representative">נציג מערכת</SelectItem>
                                {request.doctor_id && request.doctor_name && (
                                    <SelectItem value={request.doctor_id}>{request.doctor_name}</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <Textarea 
                        placeholder="כתוב את תוכן פנייתך כאן..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="h-32 text-right bg-white border-gray-200"
                    />
                </div>

                <div className="flex justify-center mt-8">
                     <Button 
                        onClick={handleSendMessage}
                        disabled={isSending || !message.trim()}
                        className="text-white font-bold text-base py-3 px-12 rounded-lg shadow-lg w-48"
                        style={{background: 'linear-gradient(82.48deg, #5932EA -42.14%, #A188FF 77.37%)'}}
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="w-5 h-5 ml-2 animate-spin"/>
                                שולח...
                            </>
                        ) : (
                           'שליחת הודעה'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}