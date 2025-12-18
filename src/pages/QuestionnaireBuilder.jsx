import React, { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash, Plus, Save } from 'lucide-react';
import { FormTemplate } from '@/entities/FormTemplate';

const fieldTypes = [
    { value: 'text', label: 'שדה טקסט' },
    { value: 'textarea', label: 'תיבת טקסט' },
    { value: 'number', label: 'מספר' },
    { value: 'select', label: 'בחירה מרובה' },
    { value: 'checkbox', label: 'תיבת סימון' },
    { value: 'date', label: 'תאריך' },
];

function QuestionnaireBuilderContent() {
    const [formName, setFormName] = useState('');
    const [fields, setFields] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const addField = () => {
        setFields([...fields, { id: Date.now(), label: '', type: 'text', options: [] }]);
    };

    const removeField = (id) => {
        setFields(fields.filter(field => field.id !== id));
    };

    const updateField = (id, prop, value) => {
        setFields(fields.map(field => field.id === id ? { ...field, [prop]: value } : field));
    };

    const handleSave = async () => {
        if (!formName) {
            alert("יש להזין שם לשאלון");
            return;
        }
        setIsSaving(true);
        try {
            await FormTemplate.create({
                name: formName,
                type: 'questionnaire',
                fields: JSON.stringify(fields)
            });
            alert('השאלון נשמר בהצלחה!');
            setFormName('');
            setFields([]);
        } catch (error) {
            console.error("Failed to save form template:", error);
            alert('שגיאה בשמירת השאלון.');
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>בונה שאלונים דינמי</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="formName">שם השאלון</Label>
                        <Input id="formName" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="לדוגמה: שאלון פסיכיאטריה ראשוני" />
                    </div>
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="w-4 h-4 ml-2" />
                        {isSaving ? 'שומר...' : 'שמור תבנית'}
                    </Button>
                </CardContent>
            </Card>

            {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input placeholder={`תווית שדה ${index + 1}`} value={field.label} onChange={(e) => updateField(field.id, 'label', e.target.value)} />
                        <Select onValueChange={(value) => updateField(field.id, 'type', value)} defaultValue={field.type}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {fieldTypes.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button variant="destructive" onClick={() => removeField(field.id)}><Trash className="w-4 h-4" /></Button>
                    </div>
                    {field.type === 'select' && (
                        <div className="mt-2">
                             <Input placeholder="אפשרויות (מופרדות בפסיק)" onChange={(e) => updateField(field.id, 'options', e.target.value.split(','))} />
                        </div>
                    )}
                </Card>
            ))}

            <Button onClick={addField}>
                <Plus className="w-4 h-4 ml-2" /> הוסף שדה
            </Button>
        </div>
    );
}

export default function QuestionnaireBuilder() {
    return (
        <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <QuestionnaireBuilderContent />
        </ProtectedRoute>
    );
}