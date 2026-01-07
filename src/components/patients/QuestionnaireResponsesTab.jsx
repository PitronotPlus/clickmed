import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { FileText, Download, Mail, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function QuestionnaireResponsesTab({ patientId }) {
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedResponse, setSelectedResponse] = useState(null);

    useEffect(() => {
        loadResponses();
    }, [patientId]);

    const loadResponses = async () => {
        try {
            const data = await base44.entities.QuestionnaireResponse.filter({ 
                patient_id: patientId 
            });
            setResponses(data.sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date)));
        } catch (error) {
            console.error('Error loading questionnaire responses:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async (response) => {
        try {
            const result = await base44.functions.invoke('downloadQuestionnairePDF', {
                responseId: response.id
            });
            
            const blob = new Blob([result.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${response.questionnaire_title}_${response.patient_name}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('שגיאה בהורדת הקובץ');
        }
    };

    const sendEmail = async (response) => {
        try {
            await base44.functions.invoke('sendQuestionnaireEmail', {
                responseId: response.id
            });
            alert('השאלון נשלח למייל המטופל בהצלחה');
        } catch (error) {
            console.error('Error sending email:', error);
            alert('שגיאה בשליחת האימייל');
        }
    };

    const viewResponse = (response) => {
        setSelectedResponse(selectedResponse?.id === response.id ? null : response);
    };

    if (loading) {
        return <div className="text-center p-4">טוען שאלונים...</div>;
    }

    return (
        <div className="space-y-4">
            {responses.length > 0 ? (
                responses.map((response) => (
                    <Card key={response.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{response.questionnaire_title}</CardTitle>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => viewResponse(response)}
                                    >
                                        <Eye className="w-4 h-4 ml-2" />
                                        {selectedResponse?.id === response.id ? 'הסתר' : 'צפה'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadPDF(response)}
                                    >
                                        <Download className="w-4 h-4 ml-2" />
                                        PDF
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => sendEmail(response)}
                                    >
                                        <Mail className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">
                                הושלם ב-{format(new Date(response.completed_date), 'PPP', { locale: he })}
                            </p>
                        </CardHeader>

                        {selectedResponse?.id === response.id && (
                            <CardContent className="border-t">
                                <div className="space-y-4 pt-4">
                                    {Object.entries(response.responses).map(([questionId, answer]) => {
                                        // Try to find the question label from the original questionnaire
                                        const questionLabel = questionId;
                                        
                                        return (
                                            <div key={questionId} className="space-y-1">
                                                <p className="font-semibold text-sm">{questionLabel}</p>
                                                <p className="text-gray-700">{answer || 'לא נענה'}</p>
                                            </div>
                                        );
                                    })}

                                    {response.signature && (
                                        <div className="space-y-1 pt-4 border-t">
                                            <p className="font-semibold text-sm">חתימה:</p>
                                            <img 
                                                src={response.signature} 
                                                alt="חתימה" 
                                                className="border rounded p-2 bg-white max-w-md"
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        )}
                    </Card>
                ))
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>אין שאלונים שהושלמו</p>
                </div>
            )}
        </div>
    );
}