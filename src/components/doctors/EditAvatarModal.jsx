import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { User } from '@/entities/User';
import { UploadFile } from '@/integrations/Core';
import { Loader2, UploadCloud } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function EditAvatarModal({ user, isOpen, onClose, onProfileUpdate }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(user?.avatar || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            setError('יש לבחור תמונה להעלאה.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const { file_url } = await UploadFile({ file: selectedFile });
            await User.updateMyUserData({ avatar: file_url });
            onProfileUpdate();
        } catch (err) {
            console.error('Error updating avatar:', err);
            setError('אירעה שגיאה בעדכון תמונת הפרופיל.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>עריכת תמונת פרופיל</DialogTitle>
                    <DialogDescription>
                        בחר תמונה חדשה עבור הפרופיל שלך. מומלץ להעלות תמונה ריבועית.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                    <div 
                        className="w-48 h-48 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
                        onClick={handleUploadClick}
                    >
                        {preview ? (
                            <img src={preview} alt="תצוגה מקדימה" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <div className="text-center text-gray-500">
                                <UploadCloud className="w-12 h-12 mx-auto" />
                                <p>לחץ לבחירת תמונה</p>
                            </div>
                        )}
                    </div>
                    <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>ביטול</Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !selectedFile}>
                        {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                        שמור תמונה
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}