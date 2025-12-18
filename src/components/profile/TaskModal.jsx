import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TaskModal({ isOpen, onClose, onSave, task }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                priority: task.priority || 'medium',
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            });
        } else {
            // Reset for new task
            setFormData({
                title: '',
                description: '',
                priority: 'medium',
                dueDate: new Date().toISOString().split('T')[0]
            });
        }
    }, [task, isOpen]);

    const handleSave = () => {
        if (!formData.title) {
            alert('כותרת המשימה היא שדה חובה.');
            return;
        }
        onSave(formData);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{task ? 'עריכת משימה' : 'הוספת משימה חדשה'}</DialogTitle>
                    <DialogDescription>
                        {task ? 'עדכן את פרטי המשימה.' : 'מלא את פרטי המשימה החדשה.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">כותרת</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="לדוגמה: קביעת תור לרופא עיניים"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">תיאור (אופציונלי)</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="הוסף פרטים נוספים על המשימה"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priority">עדיפות</Label>
                            <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="high">גבוהה</SelectItem>
                                    <SelectItem value="medium">בינונית</SelectItem>
                                    <SelectItem value="low">נמוכה</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">תאריך יעד</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>ביטול</Button>
                    <Button onClick={handleSave}>שמור משימה</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}