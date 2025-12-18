
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tv, Download, FileText, UserCog } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const statusStyles = {
    'בקשה בבדיקה': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    'ממתין לתשלום': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    'מאושר': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    'מאושר עבור עליה': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    'טופל': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    'בקשה נדחתה': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    'ממתין לזימון תור': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    'בוטל': { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
    'מחפש רופא': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' }
};

export default function RequestDetailsModal({ request, isOpen, onClose }) {
    if (!request) return null;

    const questionnaireAnswers = request.questionnaire_answers ? Object.entries(request.questionnaire_answers) : [];
    const documents = request.documents || [];
    const doctorNotes = request.doctor_notes;

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

    return (
        <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-8 bg-white rounded-2xl">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-bold text-black text-right">פרטי בקשה</DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                    <span>פגישה דיגיטלית</span>
                    <Tv className="w-5 h-5 text-gray-500" />
                </div>

                {/* Request Details */}
                <div className="bg-[#FAFAFA] rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-right">
                            <h3 className="text-lg font-bold text-black">{request.type}</h3>
                            <p className="text-sm text-gray-500">{request.doctor_name || 'בחירה אוטומטית'}</p>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-6 text-sm font-bold">
                            <span>{format(new Date(request.date), 'dd/MM/yyyy', { locale: he })}</span>
                            <span>{request.day_name}</span>
                            <span>{request.time}</span>
                        </div>
                        <Badge className={`${statusStyles[request.status]?.bg || 'bg-gray-100'} ${statusStyles[request.status]?.text || 'text-gray-700'} ${statusStyles[request.status]?.border || 'border-gray-200'} font-bold px-3 py-1 border`}>
                            {request.status === 'מאושר עבור עליה' ? 'מאושר' : request.status}
                        </Badge>
                    </div>
                </div>

                <hr className="border-gray-200 mb-6" />

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Questionnaire Section */}
                    <div>
                        <div className="bg-[#E0D7FF] rounded-t-lg p-3 mb-0">
                            <h4 className="text-base font-bold text-black text-center">שאלון טרם הגשת הבקשה</h4>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-b-lg p-4 space-y-4">
                            {questionnaireAnswers.length > 0 ? (
                                questionnaireAnswers.map(([question, answer], index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <Button variant="outline" className="bg-[#F6F4FF] text-[#5932EA] border-[#D9D1FA] hover:bg-[#E0D7FF] text-xs font-bold px-3 py-1 min-w-[60px]" disabled>
                                            {String(answer)}
                                        </Button>
                                        <span className="text-base font-bold text-black text-right flex-1 mr-4">
                                            {question}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">לא מולא שאלון לבקשה זו.</p>
                            )}
                        </div>
                    </div>

                    {/* Documents Section */}
                    <div>
                        <div className="bg-[#E0D7FF] rounded-t-lg p-3 mb-0">
                            <h4 className="text-base font-bold text-black text-center">מסמכים רלוונטיים</h4>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-b-lg p-4">
                             {documents.length > 0 ? (
                                <div className="flex justify-center gap-4 flex-wrap">
                                    {documents.map((doc, index) => (
                                        <div key={index} className="text-center">
                                            <button 
                                                onClick={() => handleDownload(doc.url, doc.name)}
                                                className="w-20 h-24 bg-white rounded-lg shadow-lg border flex flex-col items-center justify-center mb-2 cursor-pointer hover:shadow-xl transition-shadow"
                                            >
                                                <div className="w-10 h-10 bg-red-500 rounded-sm flex items-center justify-center mb-1">
                                                    <span className="text-white text-xs font-bold">PDF</span>
                                                </div>
                                                <Download className="w-4 h-4 text-gray-600" />
                                            </button>
                                            <p className="text-xs font-bold text-black text-center leading-tight w-20 break-words">
                                                {doc.name}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                             ) : (
                                <p className="text-center text-gray-500 py-4">לא צורפו מסמכים לבקשה זו.</p>
                             )}
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200 mb-6" />

                {/* Patient Notes (Accordion) */}
                <div className="mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg">
                        <Accordion type="single" collapsible defaultValue="item-1">
                            <AccordionItem value="item-1" className="border-b-0">
                                <AccordionTrigger className="px-4 py-3 font-bold text-green-800 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5"/>
                                        <span>ההערות שלי</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4">
                                    <p className="text-gray-700 bg-white p-3 rounded-md">
                                        {request.description || "לא נמסרו הערות."}
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>

                {/* Doctor's Notes - NEW (Accordion) */}
                {doctorNotes && (
                    <div className="mb-6">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg">
                            <Accordion type="single" collapsible defaultValue="item-1">
                                <AccordionItem value="item-1" className="border-b-0">
                                    <AccordionTrigger className="px-4 py-3 font-bold text-orange-800 hover:no-underline">
                                        <div className="flex items-center gap-2">
                                            <UserCog className="w-5 h-5"/>
                                            <span>הערות הרופא</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4">
                                        <p className="text-gray-700 bg-white p-3 rounded-md whitespace-pre-wrap">
                                            {doctorNotes}
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>
                )}
                <DialogFooter className="flex-row-reverse">
                    <Button variant="outline" onClick={onClose}>סגור</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
