import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { User } from '@/entities/User';
import { Loader2 } from 'lucide-react';

export default function EditSocialLinksModal({ user, isOpen, onClose, onProfileUpdate }) {
    const [formData, setFormData] = useState({
        website: user?.website || '',
        youtube: user?.youtube || '',
        whatsapp: user?.whatsapp || '',
        telegram: user?.telegram || '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await User.updateMyUserData(formData);
            onProfileUpdate();
        } catch (err) {
            console.error('Error updating social links:', err);
            setError('אירעה שגיאה בעדכון הקישורים.');
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
                    <DialogTitle>עריכת קישורים חברתיים</DialogTitle>
                    <DialogDescription>עדכן את הקישורים לאתר האישי ולרשתות החברתיות.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="website">אתר אישי</Label>
                        <Input id="website" placeholder="https://example.com" value={formData.website} onChange={(e) => handleInputChange('website', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="youtube">ערוץ יוטיוב</Label>
                        <Input id="youtube" placeholder="https://youtube.com/channel/..." value={formData.youtube} onChange={(e) => handleInputChange('youtube', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="whatsapp">קישור לוואטסאפ</Label>
                        <Input id="whatsapp" placeholder="https://wa.me/..." value={formData.whatsapp} onChange={(e) => handleInputChange('whatsapp', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="telegram">קישור לטלגרם</Label>
                        <Input id="telegram" placeholder="https://t.me/..." value={formData.telegram} onChange={(e) => handleInputChange('telegram', e.target.value)} />
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