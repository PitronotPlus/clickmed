
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Placeholder for User and SupportTicket models (replace with your actual imports)
const User = {
    me: async () => {
        // Replace with actual implementation to fetch current user
        return {
            id: 'user123',
            full_name: 'Test User',
            user_type: 'מטופל', // or 'doctor', 'clinic'
        };
    },
    filter: async (query) => {
        // Replace with actual implementation to fetch admin users
        return [{ id: 'admin1' }, { id: 'admin2' }];
    }
};

const SupportTicket = {
    create: async (ticketData) => {
        // Replace with actual implementation to create a support ticket
        console.log('Creating ticket:', ticketData);
        return { success: true };
    }
};

const SystemNotification = {
    create: async (notificationData) => {
        // Replace with actual implementation to create a system notification
        console.log('Creating notification:', notificationData);
        return { success: true };
    }
};

export default function TicketForm({ isOpen, onClose, onTicketSubmitted }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'בינונית'
    });
    const [user, setUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
            } catch (error) {
                console.error('Error loading user:', error);
            }
        };
        loadUser();
    }, []);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        try {
            // יצירת פניה חדשה
            await SupportTicket.create({
                title: formData.title,
                description: formData.description,
                user_type: user.user_type === 'doctor' ? 'רופא' : 
                          user.user_type === 'clinic' ? 'שותף' : 'מטופל',
                status: 'פתוח',
                priority: formData.priority
            });

            // יצירת התראה למנהלי המערכת
            const admins = await User.filter({ permissions: { $in: ['admin'] } });
            for (const admin of admins) {
                await SystemNotification.create({
                    user_id: admin.id,
                    title: `פניה חדשה מ${user.full_name}`,
                    message: formData.title,
                    type: 'admin',
                    read: false,
                    priority: formData.priority === 'גבוהה' ? 'high' : 'medium'
                });
            }

            alert('הפניה נשלחה בהצלחה! נחזור אליך בהקדם.');
            
            // איפוס הטופס
            setFormData({
                title: '',
                description: '',
                priority: 'בינונית'
            });
            
            onTicketSubmitted();
        } catch (error) {
            console.error('Error submitting ticket:', error);
            alert('שגיאה בשליחת הפניה. אנא נסה שוב.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>פניה לתמיכה</DialogTitle>
                    <DialogDescription>
                        תאר את הבעיה או השאלה שלך ואנחנו נחזור אליך בהקדם
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="title" className="text-right block mb-1">נושא הפניה *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="תאר בקצרה את הנושא..."
                            required
                            dir="rtl"
                        />
                    </div>

                    <div>
                        <Label htmlFor="priority" className="text-right block mb-1">עדיפות</Label>
                        <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                            <SelectTrigger dir="rtl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="נמוכה">נמוכה</SelectItem>
                                <SelectItem value="בינונית">בינונית</SelectItem>
                                <SelectItem value="גבוהה">גבוהה</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="description" className="text-right block mb-1">תיאור מפורט *</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="תאר את הבעיה או השאלה בפירוט..."
                            rows={5}
                            required
                            dir="rtl"
                        />
                    </div>

                    <DialogFooter className="flex gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            ביטול
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'שולח...' : 'שלח פניה'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
