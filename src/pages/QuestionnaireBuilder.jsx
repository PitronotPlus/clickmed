import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Save, Eye, Copy } from 'lucide-react';

export default function QuestionnaireBuilder() {
    const [questionnaires, setQuestionnaires] = useState([]);
    const [editingQuestionnaire, setEditingQuestionnaire] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        questions: [],
        is_active: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadQuestionnaires();
    }, []);

    const loadQuestionnaires = async () => {
        try {
            const data = await base44.entities.Questionnaire.list('-created_date');
            setQuestionnaires(data);
        } catch (error) {
            console.error('Error loading questionnaires:', error);
        }
    };

    const addQuestion = () => {
        const newQuestion = {
            id: `q_${Date.now()}`,
            type: 'text',
            label: '',
            required: false,
            options: []
        };
        setFormData({
            ...formData,
            questions: [...formData.questions, newQuestion]
        });
    };

    const updateQuestion = (index, field, value) => {
        const updatedQuestions = [...formData.questions];
        updatedQuestions[index][field] = value;
        setFormData({ ...formData, questions: updatedQuestions });
    };

    const removeQuestion = (index) => {
        const updatedQuestions = formData.questions.filter((_, i) => i !== index);
        setFormData({ ...formData, questions: updatedQuestions });
    };

    const handleSave = async () => {
        if (!formData.title || formData.questions.length === 0) {
            alert('נא למלא שם שאלון ולפחות שאלה אחת');
            return;
        }

        setLoading(true);
        try {
            if (editingQuestionnaire) {
                await base44.entities.Questionnaire.update(editingQuestionnaire.id, formData);
            } else {
                await base44.entities.Questionnaire.create(formData);
            }
            await loadQuestionnaires();
            resetForm();
        } catch (error) {
            console.error('Error saving questionnaire:', error);
            alert('שגיאה בשמירת השאלון');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            category: '',
            questions: [],
            is_active: true
        });
        setEditingQuestionnaire(null);
    };

    const handleEdit = (questionnaire) => {
        setEditingQuestionnaire(questionnaire);
        setFormData({
            title: questionnaire.title,
            description: questionnaire.description || '',
            category: questionnaire.category || '',
            questions: questionnaire.questions || [],
            is_active: questionnaire.is_active
        });
    };

    const handleDelete = async (id) => {
        if (!confirm('האם למחוק את השאלון?')) return;
        
        try {
            await base44.entities.Questionnaire.delete(id);
            await loadQuestionnaires();
        } catch (error) {
            console.error('Error deleting questionnaire:', error);
        }
    };

    const copyQuestionnaireLink = (id) => {
        const link = `${window.location.origin}/FillQuestionnaire?id=${id}`;
        navigator.clipboard.writeText(link);
        alert('הקישור הועתק ללוח');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">בניית שאלונים</h1>
                {editingQuestionnaire && (
                    <Button variant="outline" onClick={resetForm}>
                        שאלון חדש
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {editingQuestionnaire ? 'עריכת שאלון' : 'שאלון חדש'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>שם השאלון *</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="לדוגמא: אבחון פסיכיאטרי"
                                />
                            </div>

                            <div>
                                <Label>תיאור</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="תיאור השאלון..."
                                />
                            </div>

                            <div>
                                <Label>קטגוריה</Label>
                                <Input
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="לדוגמא: פסיכיאטריה, חוזה, כללי"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <Label htmlFor="is_active" className="cursor-pointer">שאלון פעיל</Label>
                            </div>

                            <hr className="my-4" />

                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold">שאלות</h3>
                                <Button onClick={addQuestion} size="sm">
                                    <Plus className="w-4 h-4 ml-2" />
                                    הוסף שאלה
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {formData.questions.map((question, index) => (
                                    <Card key={question.id} className="bg-gray-50">
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold">שאלה {index + 1}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeQuestion(index)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label>סוג שאלה</Label>
                                                    <Select
                                                        value={question.type}
                                                        onValueChange={(value) => updateQuestion(index, 'type', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="text">טקסט קצר</SelectItem>
                                                            <SelectItem value="textarea">טקסט חופשי</SelectItem>
                                                            <SelectItem value="yesno">כן/לא</SelectItem>
                                                            <SelectItem value="select">רשימה נפתחת</SelectItem>
                                                            <SelectItem value="date">תאריך</SelectItem>
                                                            <SelectItem value="signature">חתימה</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="flex items-end">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`required_${index}`}
                                                            checked={question.required}
                                                            onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                                                            className="w-4 h-4"
                                                        />
                                                        <Label htmlFor={`required_${index}`} className="cursor-pointer">שדה חובה</Label>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <Label>טקסט השאלה</Label>
                                                <Input
                                                    value={question.label}
                                                    onChange={(e) => updateQuestion(index, 'label', e.target.value)}
                                                    placeholder="לדוגמא: האם אתה סובל מאלרגיות?"
                                                />
                                            </div>

                                            {question.type === 'select' && (
                                                <div>
                                                    <Label>אפשרויות (מופרד בפסיק)</Label>
                                                    <Input
                                                        value={(question.options || []).join(', ')}
                                                        onChange={(e) => updateQuestion(index, 'options', e.target.value.split(',').map(o => o.trim()).filter(Boolean))}
                                                        placeholder="אפשרות 1, אפשרות 2, אפשרות 3"
                                                    />
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}

                                {formData.questions.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        אין שאלות עדיין. לחץ על "הוסף שאלה" להתחלה
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={resetForm}>
                                    ביטול
                                </Button>
                                <Button onClick={handleSave} disabled={loading} className="bg-[#5932EA]">
                                    <Save className="w-4 h-4 ml-2" />
                                    {loading ? 'שומר...' : 'שמור שאלון'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* List Section */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>שאלונים קיימים</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {questionnaires.map((q) => (
                                    <Card key={q.id} className="p-3 hover:shadow-md transition-shadow">
                                        <div className="space-y-2">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-semibold">{q.title}</h4>
                                                    {q.category && (
                                                        <span className="text-xs text-gray-500">{q.category}</span>
                                                    )}
                                                </div>
                                                {!q.is_active && (
                                                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">לא פעיל</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {q.questions?.length || 0} שאלות
                                            </p>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(q)}
                                                >
                                                    ערוך
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => copyQuestionnaireLink(q.id)}
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(q.id)}
                                                    className="text-red-500"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}

                                {questionnaires.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        אין שאלונים עדיין
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}