
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X, Save, User, Shield } from 'lucide-react';

const permissionOptions = [
    { value: 'patient', label: 'מטופל', description: 'גישה לפאנל אישי, פרופיל, בקשות ותורים' },
    { value: 'doctor', label: 'רופא', description: 'גישה לפאנל רופא, ניהול תורים ומטופלים' },
    { value: 'admin', label: 'מנהל', description: 'גישה מלאה לכל המערכת' },
    { value: 'office', label: 'משרד', description: 'גישה לכלים תפעוליים, אישור משתמשים ותשלומים' }
];

export default function EditUserModal({ user, isOpen, onClose, onSave }) {
    const [formData, setFormData] = useState({
        display_name: '',
        email: '',
        permissions: ['patient'],
        status: 'pending',
        user_type: 'patient'
    });
    const isNewUser = !user;

    useEffect(() => {
        if (user) {
            setFormData({
                display_name: user.display_name || user.full_name || '',
                email: user.email || '',
                permissions: user.permissions || [],
                status: user.status || 'pending',
                user_type: user.user_type || 'patient'
            });
        } else {
            setFormData({
                display_name: '',
                email: '',
                permissions: ['patient'],
                status: 'pending',
                user_type: 'patient'
            });
        }
    }, [user]);

    const handlePermissionChange = (permission, checked) => {
        setFormData(prev => {
            const newPermissions = checked
                ? [...prev.permissions, permission]
                : prev.permissions.filter(p => p !== permission);
            return { ...prev, permissions: newPermissions };
        });
    };

    const handleSave = () => {
        const dataToUpdate = {
            display_name: formData.display_name,
            permissions: formData.permissions,
            status: formData.status,
            user_type: formData.user_type
        };
        onSave(dataToUpdate);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-6 bg-white rounded-lg shadow-xl" dir="rtl">
                <DialogHeader className="mb-4 flex-shrink-0">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-right">
                        <User className="w-6 h-6 text-[#5932EA]" />
                        {isNewUser ? 'הזמנת משתמש חדש' : 'עריכת פרטי משתמש'}
                    </DialogTitle>
                    <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={onClose}>
                        <X className="w-6 h-6 text-gray-500" />
                    </Button>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-6" dir="rtl">
                        <div className="grid gap-2 text-right">
                            <Label htmlFor="display_name">שם תצוגה</Label>
                            <Input
                                id="display_name"
                                value={formData.display_name}
                                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                className="text-right"
                                dir="rtl"
                            />
                        </div>
                        <div className="grid gap-2 text-right">
                            <Label htmlFor="email">אימייל (לא ניתן לעריכה)</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                className="text-right"
                                dir="rtl"
                                disabled
                            />
                        </div>

                        <div className="text-right">
                            <label className="block text-sm font-bold mb-2 text-right">סטטוס</label>
                            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({...prev, status: value}))}>
                                <SelectTrigger dir="rtl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">פעיל</SelectItem>
                                    <SelectItem value="inactive">לא פעיל</SelectItem>
                                    <SelectItem value="pending">ממתין לאישור</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="text-right">
                            <label className="block text-sm font-bold mb-4 flex items-center gap-2 text-right">
                                <Shield className="w-5 h-5 text-[#5932EA]" />
                                הרשאות משתמש
                            </label>
                            <div className="space-y-4 bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                                {permissionOptions.map(option => (
                                    <div key={option.value} className="flex items-start gap-3 text-right">
                                        <Checkbox
                                            checked={formData.permissions.includes(option.value)}
                                            onCheckedChange={(checked) => handlePermissionChange(option.value, checked)}
                                            id={`perm-${option.value}`}
                                        />
                                        <div className="grid gap-1.5 leading-none text-right">
                                            <label htmlFor={`perm-${option.value}`} className="font-bold text-sm cursor-pointer text-right">{option.label}</label>
                                            <p className="text-xs text-gray-600 text-right">{option.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>

                <div className="flex justify-start gap-3 pt-4 border-t flex-shrink-0">
                    <Button type="button" className="bg-[#5932EA] text-white flex items-center gap-2" onClick={handleSave}>
                        <Save className="w-4 h-4" />
                        {isNewUser ? 'שלח הזמנה' : 'שמור שינויים'}
                    </Button>
                    <Button type="button" variant="outline" onClick={onClose}>
                        ביטול
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
