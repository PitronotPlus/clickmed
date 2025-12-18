import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { User } from '@/entities/User';
import { Loader2 } from 'lucide-react';

export default function EditContactInfoModal({ user, isOpen, onClose, onProfileUpdate }) {
    const [formData, setFormData] = useState({
        address: user?.address || '',
        working_locations: user?.working_locations?.join(', ') || ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const dataToUpdate = {
                ...formData,
                working_locations: formData.working_locations.split(',').map(s => s.trim()).filter(Boolean)
            };
            await User.updateMyUserData(dataToUpdate);
            onProfileUpdate();
        } catch (err) {
            console.error('Error updating contact info:', err);
            setError('אירעה שגיאה בעדכון פרטי הקשר.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>עריכת פרטי קשר ומיקום</DialogTitle>
                    <DialogDescription>עדכן את כתובתך ומקומות העבודה שלך.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="address">כתובת</Label>
                        <Input id="address" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="working_locations">מקומות עבודה (מופרדים בפסיק)</Label>
                        <Textarea id="working_locations" placeholder="בית חולים איכילוב, מרפאה פרטית רמת אביב..." value={formData.working_locations} onChange={(e) => handleInputChange('working_locations', e.target.value)} />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>ביטול</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        שמור שינויים
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}