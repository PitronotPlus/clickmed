import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormTemplate } from '@/entities/FormTemplate';
import { AlertTriangle } from 'lucide-react';

export default function DynamicQuestionnaire({ 
    specialty, 
    responses, 
    onResponsesChange 
}) {
    const [questionnaire, setQuestionnaire] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadQuestionnaire = async () => {
            if (!specialty?.default_questionnaire_id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const template = await FormTemplate.filter({ 
                    id: specialty.default_questionnaire_id,
                    type: 'questionnaire'
                });

                if (template.length > 0) {
                    const parsedFields = JSON.parse(template[0].fields);
                    setQuestionnaire({
                        ...template[0],
                        fields: parsedFields
                    });
                }
            } catch (err) {
                setError('שגיאה בטעינת השאלון');
                console.error('Error loading questionnaire:', err);
            } finally {
                setLoading(false);
            }
        };

        loadQuestionnaire();
    }, [specialty]);

    const handleResponseChange = (fieldId, value) => {
        const newResponses = {
            ...responses,
            [fieldId]: value
        };
        onResponsesChange(newResponses);
    };

    const renderField = (field) => {
        const currentValue = responses[field.id] || '';

        switch (field.type) {
            case 'text':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                            {field.label}
                            {field.required && <span className="text-red-500 mr-1">*</span>}
                        </Label>
                        <Input
                            id={field.id}
                            value={currentValue}
                            onChange={(e) => handleResponseChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                        />
                        {field.description && (
                            <p className="text-sm text-gray-500">{field.description}</p>
                        )}
                    </div>
                );

            case 'textarea':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                            {field.label}
                            {field.required && <span className="text-red-500 mr-1">*</span>}
                        </Label>
                        <Textarea
                            id={field.id}
                            value={currentValue}
                            onChange={(e) => handleResponseChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            rows={field.rows || 3}
                        />
                        {field.description && (
                            <p className="text-sm text-gray-500">{field.description}</p>
                        )}
                    </div>
                );

            case 'select':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                            {field.label}
                            {field.required && <span className="text-red-500 mr-1">*</span>}
                        </Label>
                        <Select onValueChange={(value) => handleResponseChange(field.id, value)}>
                            <SelectTrigger>
                                <SelectValue placeholder={field.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {field.description && (
                            <p className="text-sm text-gray-500">{field.description}</p>
                        )}
                    </div>
                );

            case 'radio':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label>
                            {field.label}
                            {field.required && <span className="text-red-500 mr-1">*</span>}
                        </Label>
                        <RadioGroup 
                            value={currentValue} 
                            onValueChange={(value) => handleResponseChange(field.id, value)}
                        >
                            {field.options.map((option) => (
                                <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                                    <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                                    <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                        {field.description && (
                            <p className="text-sm text-gray-500">{field.description}</p>
                        )}
                    </div>
                );

            case 'checkbox':
                const checkboxValues = Array.isArray(currentValue) ? currentValue : [];
                return (
                    <div key={field.id} className="space-y-2">
                        <Label>
                            {field.label}
                            {field.required && <span className="text-red-500 mr-1">*</span>}
                        </Label>
                        {field.options.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox
                                    id={`${field.id}-${option.value}`}
                                    checked={checkboxValues.includes(option.value)}
                                    onCheckedChange={(checked) => {
                                        let newValues;
                                        if (checked) {
                                            newValues = [...checkboxValues, option.value];
                                        } else {
                                            newValues = checkboxValues.filter(v => v !== option.value);
                                        }
                                        handleResponseChange(field.id, newValues);
                                    }}
                                />
                                <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
                            </div>
                        ))}
                        {field.description && (
                            <p className="text-sm text-gray-500">{field.description}</p>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <p>טוען שאלון...</p>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!questionnaire) {
        return null; // No questionnaire required for this specialty
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{questionnaire.name}</CardTitle>
                <p className="text-sm text-gray-600">
                    אנא מלא את השאלון הבא כדי לעזור לרופא להכין את הטיפול המתאים
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {questionnaire.fields.map(renderField)}
            </CardContent>
        </Card>
    );
}