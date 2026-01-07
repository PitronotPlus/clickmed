import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MedicalNoteTemplate } from '@/entities/MedicalNoteTemplate';
import { VisitSummary } from '@/entities/VisitSummary';
import { User } from '@/entities/User';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Loader2 } from 'lucide-react';

export default function AddVisitSummaryModal({ isOpen, onClose, patient, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [formData, setFormData] = useState({
        visit_date: new Date().toISOString().split('T')[0],
        summary_content: '',
        diagnosis: '',
        treatment: '',
        followup_required: false,
        followup_date: ''
    });

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['clean']
        ]
    };

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen]);

    const loadTemplates = async () => {
        try {
            const currentUser = await User.me();
            const userTemplates = await MedicalNoteTemplate.filter({ doctor_id: currentUser.id });
            setTemplates(userTemplates);
            
            // Auto-select default template if exists
            const defaultTemplate = userTemplates.find(t => t.is_default);
            if (defaultTemplate) {
                setSelectedTemplate(defaultTemplate.id);
                setFormData(prev => ({
                    ...prev,
                    summary_content: defaultTemplate.content
                }));
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    };

    const handleTemplateChange = (templateId) => {
        setSelectedTemplate(templateId);
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setFormData(prev => ({
                ...prev,
                summary_content: template.content
            }));
        }
    };

    const handleSubmit = async () => {
        if (!formData.summary_content.trim()) {
            alert('נא למלא את תוכן הסיכום');
            return;
        }

        setLoading(true);
        try {
            const currentUser = await User.me();
            const templateUsed = templates.find(t => t.id === selectedTemplate);
            
            await VisitSummary.create({
                doctor_id: currentUser.id,
                patient_id: patient.id,
                visit_date: new Date(formData.visit_date).toISOString(),
                summary_content: formData.summary_content,
                template_used: templateUsed ? templateUsed.template_name : 'ללא תבנית',
                diagnosis: formData.diagnosis,
                treatment: formData.treatment,
                followup_required: formData.followup_required,
                followup_date: formData.followup_date || null
            });

            onSuccess?.();
            onClose();
            
            // Reset form
            setFormData({
                visit_date: new Date().toISOString().split('T')[0],
                summary_content: '',
                diagnosis: '',
                treatment: '',
                followup_required: false,
                followup_date: ''
            });
            setSelectedTemplate('');
        } catch (error) {
            console.error('Error saving visit summary:', error);
            alert('שגיאה בשמירת סיכום הביקור');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>סיכום ביקור - {patient?.full_name}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>תאריך הביקור</Label>
                            <Input
                                type="date"
                                value={formData.visit_date}
                                onChange={(e) => setFormData({...formData, visit_date: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>בחר תבנית</Label>
                            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="בחר תבנית או התחל מאפס" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={null}>ללא תבנית (התחל מאפס)</SelectItem>
                                    {templates.map(template => (
                                        <SelectItem key={template.id} value={template.id}>
                                            {template.template_name}
                                            {template.is_default && ' ⭐'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label>סיכום הביקור</Label>
                        <div className="mt-2 bg-white rounded border" dir="rtl">
                            <ReactQuill
                                theme="snow"
                                value={formData.summary_content}
                                onChange={(content) => setFormData({...formData, summary_content: content})}
                                modules={modules}
                                style={{ minHeight: '250px' }}
                                placeholder="רשום כאן את סיכום הביקור..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>אבחנה</Label>
                            <Input
                                value={formData.diagnosis}
                                onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                                placeholder="אבחנה רפואית"
                            />
                        </div>
                        <div>
                            <Label>טיפול</Label>
                            <Input
                                value={formData.treatment}
                                onChange={(e) => setFormData({...formData, treatment: e.target.value})}
                                placeholder="טיפול שניתן"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="followup"
                                checked={formData.followup_required}
                                onChange={(e) => setFormData({...formData, followup_required: e.target.checked})}
                                className="w-4 h-4"
                            />
                            <Label htmlFor="followup" className="cursor-pointer">נדרש מעקב</Label>
                        </div>
                        {formData.followup_required && (
                            <div className="flex-1">
                                <Label>תאריך מעקב מומלץ</Label>
                                <Input
                                    type="date"
                                    value={formData.followup_date}
                                    onChange={(e) => setFormData({...formData, followup_date: e.target.value})}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={onClose} disabled={loading}>
                            ביטול
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading} className="bg-[#5932EA] hover:bg-[#4a29c1]">
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    שומר...
                                </>
                            ) : (
                                'שמור סיכום'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}