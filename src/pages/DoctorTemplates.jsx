import React, { useState, useEffect } from 'react';
import { MedicalNoteTemplate } from '@/entities/MedicalNoteTemplate';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Copy, Star } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function DoctorTemplates() {
    const [user, setUser] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        template_name: '',
        content: '',
        category: '',
        is_default: false
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
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const currentUser = await User.me();
            setUser(currentUser);
            
            const userTemplates = await MedicalNoteTemplate.filter({ doctor_id: currentUser.id });
            setTemplates(userTemplates);
        } catch (error) {
            console.error('Error loading templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (editingTemplate) {
                await MedicalNoteTemplate.update(editingTemplate.id, {
                    ...formData,
                    doctor_id: user.id
                });
            } else {
                await MedicalNoteTemplate.create({
                    ...formData,
                    doctor_id: user.id
                });
            }
            
            setIsDialogOpen(false);
            setEditingTemplate(null);
            setFormData({ template_name: '', content: '', category: '', is_default: false });
            loadData();
        } catch (error) {
            console.error('Error saving template:', error);
            alert('שגיאה בשמירת התבנית');
        }
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            template_name: template.template_name,
            content: template.content,
            category: template.category || '',
            is_default: template.is_default || false
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק תבנית זו?')) return;
        
        try {
            await MedicalNoteTemplate.delete(id);
            loadData();
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('שגיאה במחיקת התבנית');
        }
    };

    const handleDuplicate = async (template) => {
        try {
            await MedicalNoteTemplate.create({
                doctor_id: user.id,
                template_name: `${template.template_name} (עותק)`,
                content: template.content,
                category: template.category,
                is_default: false
            });
            loadData();
        } catch (error) {
            console.error('Error duplicating template:', error);
            alert('שגיאה בשכפול התבנית');
        }
    };

    const handleSetDefault = async (template) => {
        try {
            // Remove default from all templates
            const allTemplates = await MedicalNoteTemplate.filter({ doctor_id: user.id });
            for (const t of allTemplates) {
                if (t.is_default) {
                    await MedicalNoteTemplate.update(t.id, { is_default: false });
                }
            }
            
            // Set new default
            await MedicalNoteTemplate.update(template.id, { is_default: true });
            loadData();
        } catch (error) {
            console.error('Error setting default template:', error);
            alert('שגיאה בהגדרת תבנית ברירת מחדל');
        }
    };

    const openNewTemplateDialog = () => {
        setEditingTemplate(null);
        setFormData({ template_name: '', content: '', category: '', is_default: false });
        setIsDialogOpen(true);
    };

    if (loading) {
        return <div className="text-center p-8">טוען תבניות...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">תבניות סיכום ביקור</h1>
                    <p className="text-gray-600 mt-2">נהל את התבניות שלך לרישום רפואי מהיר ויעיל</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNewTemplateDialog} className="bg-[#5932EA] hover:bg-[#4a29c1]">
                            <Plus className="w-4 h-4 ml-2" />
                            תבנית חדשה
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingTemplate ? 'ערוך תבנית' : 'תבנית חדשה'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>שם התבנית</Label>
                                <Input
                                    value={formData.template_name}
                                    onChange={(e) => setFormData({...formData, template_name: e.target.value})}
                                    placeholder="לדוגמה: סיכום ביקור כללי"
                                />
                            </div>
                            <div>
                                <Label>קטגוריה (אופציונלי)</Label>
                                <Input
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    placeholder="לדוגמה: ילדים, אורטופדיה"
                                />
                            </div>
                            <div>
                                <Label>תוכן התבנית</Label>
                                <div className="mt-2 bg-white rounded border" dir="rtl">
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.content}
                                        onChange={(content) => setFormData({...formData, content})}
                                        modules={modules}
                                        style={{ minHeight: '300px' }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_default"
                                    checked={formData.is_default}
                                    onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                                    className="w-4 h-4"
                                />
                                <Label htmlFor="is_default" className="cursor-pointer">הגדר כתבנית ברירת מחדל</Label>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ביטול</Button>
                                <Button onClick={handleSave} className="bg-[#5932EA] hover:bg-[#4a29c1]">שמור</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {templates.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <p className="text-gray-500 text-lg mb-4">עדיין לא יצרת תבניות</p>
                        <p className="text-gray-400 mb-6">תבניות יעזרו לך לרשום סיכומי ביקור בצורה מהירה ומסודרת</p>
                        <Button onClick={openNewTemplateDialog} className="bg-[#5932EA] hover:bg-[#4a29c1]">
                            <Plus className="w-4 h-4 ml-2" />
                            צור תבנית ראשונה
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {templates.map((template) => (
                        <Card key={template.id} className={template.is_default ? 'border-2 border-[#5932EA]' : ''}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2">
                                            {template.template_name}
                                            {template.is_default && (
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            )}
                                        </CardTitle>
                                        {template.category && (
                                            <p className="text-sm text-gray-500 mt-1">{template.category}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleSetDefault(template)}
                                            title="הגדר כברירת מחדל"
                                        >
                                            <Star className={`w-4 h-4 ${template.is_default ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDuplicate(template)}
                                            title="שכפל תבנית"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(template)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(template.id)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div 
                                    className="prose prose-sm max-w-none text-right"
                                    dangerouslySetInnerHTML={{ __html: template.content }}
                                />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}