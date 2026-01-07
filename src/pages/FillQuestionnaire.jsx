import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { CheckCircle } from 'lucide-react';

export default function FillQuestionnaire() {
    const [questionnaire, setQuestionnaire] = useState(null);
    const [responses, setResponses] = useState({});
    const [signature, setSignature] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [user, setUser] = useState(null);
    const signatureCanvasRef = useRef(null);
    const isDrawing = useRef(false);

    useEffect(() => {
        loadQuestionnaire();
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
        } catch (error) {
            console.error('User not logged in:', error);
        }
    };

    const loadQuestionnaire = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const questionnaireId = urlParams.get('id');
            
            if (!questionnaireId) {
                alert('קישור לא תקין');
                return;
            }

            const data = await base44.entities.Questionnaire.get(questionnaireId);
            setQuestionnaire(data);
            
            // Initialize responses
            const initialResponses = {};
            data.questions.forEach(q => {
                initialResponses[q.id] = '';
            });
            setResponses(initialResponses);
        } catch (error) {
            console.error('Error loading questionnaire:', error);
            alert('שגיאה בטעינת השאלון');
        } finally {
            setLoading(false);
        }
    };

    const initSignatureCanvas = (canvas) => {
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        const startDrawing = (e) => {
            isDrawing.current = true;
            const rect = canvas.getBoundingClientRect();
            ctx.beginPath();
            ctx.moveTo(
                e.clientX - rect.left,
                e.clientY - rect.top
            );
        };

        const draw = (e) => {
            if (!isDrawing.current) return;
            const rect = canvas.getBoundingClientRect();
            ctx.lineTo(
                e.clientX - rect.left,
                e.clientY - rect.top
            );
            ctx.stroke();
        };

        const stopDrawing = () => {
            if (isDrawing.current) {
                isDrawing.current = false;
                setSignature(canvas.toDataURL());
            }
        };

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);
    };

    const clearSignature = () => {
        const canvas = signatureCanvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setSignature('');
        }
    };

    const handleSubmit = async () => {
        // Validate required fields
        const missingFields = questionnaire.questions
            .filter(q => q.required && !responses[q.id])
            .map(q => q.label);

        if (missingFields.length > 0) {
            alert(`נא למלא את השדות הבאים:\n${missingFields.join('\n')}`);
            return;
        }

        // Check if signature is required and missing
        const hasSignatureField = questionnaire.questions.some(q => q.type === 'signature');
        if (hasSignatureField && !signature) {
            alert('נא לחתום על השאלון');
            return;
        }

        if (!user) {
            alert('יש להתחבר למערכת כדי לשלוח את השאלון');
            return;
        }

        setLoading(true);
        try {
            await base44.entities.QuestionnaireResponse.create({
                questionnaire_id: questionnaire.id,
                questionnaire_title: questionnaire.title,
                patient_id: user.id,
                patient_name: user.full_name,
                responses: responses,
                signature: signature,
                completed_date: new Date().toISOString(),
                status: 'הושלם'
            });

            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting questionnaire:', error);
            alert('שגיאה בשליחת השאלון');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center p-8">טוען שאלון...</div>;
    }

    if (!questionnaire) {
        return <div className="text-center p-8">שאלון לא נמצא</div>;
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="p-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">השאלון נשלח בהצלחה!</h2>
                        <p className="text-gray-600 mb-6">
                            תודה שמילאת את השאלון. התשובות שלך נשמרו במערכת.
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
            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">{questionnaire.title}</CardTitle>
                        {questionnaire.description && (
                            <p className="text-gray-600 mt-2">{questionnaire.description}</p>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {questionnaire.questions.map((question, index) => (
                            <div key={question.id} className="space-y-2">
                                <Label className="text-base">
                                    {index + 1}. {question.label}
                                    {question.required && <span className="text-red-500 mr-1">*</span>}
                                </Label>

                                {question.type === 'text' && (
                                    <Input
                                        value={responses[question.id] || ''}
                                        onChange={(e) => setResponses({
                                            ...responses,
                                            [question.id]: e.target.value
                                        })}
                                        placeholder="תשובתך..."
                                    />
                                )}

                                {question.type === 'textarea' && (
                                    <Textarea
                                        value={responses[question.id] || ''}
                                        onChange={(e) => setResponses({
                                            ...responses,
                                            [question.id]: e.target.value
                                        })}
                                        placeholder="תשובתך..."
                                        rows={4}
                                    />
                                )}

                                {question.type === 'yesno' && (
                                    <Select
                                        value={responses[question.id] || ''}
                                        onValueChange={(value) => setResponses({
                                            ...responses,
                                            [question.id]: value
                                        })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="בחר..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="כן">כן</SelectItem>
                                            <SelectItem value="לא">לא</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}

                                {question.type === 'select' && (
                                    <Select
                                        value={responses[question.id] || ''}
                                        onValueChange={(value) => setResponses({
                                            ...responses,
                                            [question.id]: value
                                        })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="בחר..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {question.options?.map((option, i) => (
                                                <SelectItem key={i} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                {question.type === 'date' && (
                                    <Input
                                        type="date"
                                        value={responses[question.id] || ''}
                                        onChange={(e) => setResponses({
                                            ...responses,
                                            [question.id]: e.target.value
                                        })}
                                    />
                                )}

                                {question.type === 'signature' && (
                                    <div className="space-y-2">
                                        <canvas
                                            ref={(el) => {
                                                signatureCanvasRef.current = el;
                                                if (el) initSignatureCanvas(el);
                                            }}
                                            width={600}
                                            height={150}
                                            className="border border-gray-300 rounded w-full cursor-crosshair"
                                            style={{ touchAction: 'none' }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={clearSignature}
                                        >
                                            נקה חתימה
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="pt-6 border-t">
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-[#5932EA] hover:bg-[#4a29c1]"
                                size="lg"
                            >
                                {loading ? 'שולח...' : 'שלח שאלון'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}