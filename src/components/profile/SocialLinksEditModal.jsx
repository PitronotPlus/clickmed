import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@/entities/User';
import { Globe, Youtube, MessageSquare, Phone, Save } from 'lucide-react';

export default function SocialLinksEditModal({ isOpen, onClose, onSave }) {
    const [loading, setLoading] = useState(false);
    const [links, setLinks] = useState({
        website: '',
        youtube: '',
        whatsapp: '',
        telegram: '',
        phone: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadUserLinks();
        }
    }, [isOpen]);

    const loadUserLinks = async () => {
        try {
            const user = await User.me();
            setLinks({
                website: user.website || '',
                youtube: user.youtube || '',
                whatsapp: user.whatsapp || '',
                telegram: user.telegram || '',
                phone: user.phone || ''
            });
        } catch (error) {
            console.error('Error loading user links:', error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await User.updateMyUserData(links);
            onSave();
        } catch (error) {
            console.error('Error saving links:', error);
            alert('אירעה שגיאה בשמירת הקישורים');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
            <DialogContent className="max-w-md mx-auto">
                <DialogHeader>
                    {/* תיקון: הסרת כפתור הסגירה הנוסף וישור הכותרת ימינה */}
                    <DialogTitle className="text-right pr-4">עריכת קישורים</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 text-right" dir="rtl">
                    <div>
                        <Label htmlFor="website" className="text-right flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            אתר אישי
                        </Label>
                        <Input
                            id="website"
                            value={links.website}
                            onChange={(e) => setLinks(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://example.com"
                            className="mt-1 text-right"
                            dir="ltr"
                        />
                    </div>

                    <div>
                        <Label htmlFor="youtube" className="text-right flex items-center gap-2">
                            <Youtube className="w-4 h-4" />
                            ערוץ YouTube
                        </Label>
                        <Input
                            id="youtube"
                            value={links.youtube}
                            onChange={(e) => setLinks(prev => ({ ...prev, youtube: e.target.value }))}
                            placeholder="https://youtube.com/channel/..."
                            className="mt-1 text-right"
                            dir="ltr"
                        />
                    </div>

                    <div>
                        <Label htmlFor="whatsapp" className="text-right flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            WhatsApp
                        </Label>
                        <Input
                            id="whatsapp"
                            value={links.whatsapp}
                            onChange={(e) => setLinks(prev => ({ ...prev, whatsapp: e.target.value }))}
                            placeholder="https://wa.me/972501234567"
                            className="mt-1 text-right"
                            dir="ltr"
                        />
                    </div>

                    <div>
                        <Label htmlFor="telegram" className="text-right flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Telegram
                        </Label>
                        <Input
                            id="telegram"
                            value={links.telegram}
                            onChange={(e) => setLinks(prev => ({ ...prev, telegram: e.target.value }))}
                            placeholder="https://t.me/username"
                            className="mt-1 text-right"
                            dir="ltr"
                        />
                    </div>

                    <div>
                        <Label htmlFor="phone" className="text-right flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            טלפון נוסף
                        </Label>
                        <Input
                            id="phone"
                            value={links.phone}
                            onChange={(e) => setLinks(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="050-1234567"
                            className="mt-1 text-right"
                            dir="rtl"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 justify-end">
                        <Button variant="outline" onClick={onClose} type="button">
                            ביטול
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={loading}
                            className="bg-[#5932EA] hover:bg-[#4a29c1]"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            שמור קישורים
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}