
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { User } from '@/entities/User';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { UploadFile } from '@/integrations/Core';

export default function EditCertificatesModal({ user, isOpen, onClose, onProfileUpdate }) {
    const [certificates, setCertificates] = useState(user?.certificates || []);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCertificateChange = (index, field, value) => {
        const newCertificates = [...certificates];
        newCertificates[index][field] = value;
        setCertificates(newCertificates);
    };

    const handleAddCertificate = () => {
        setCertificates([...certificates, { name: '', description: '', url: '', date: new Date().toISOString().split('T')[0] }]);
    };

    const handleRemoveCertificate = (index) => {
        const newCertificates = certificates.filter((_, i) => i !== index);
        setCertificates(newCertificates);
    };

    const handleFileUpload = async (index, file) => {
        if (!file) return;
        setIsLoading(true);
        try {
            const { file_url } = await UploadFile({ file });
            handleCertificateChange(index, 'url', file_url);
        } catch (err) {
            console.error("Error uploading file:", err);
            setError("שגיאה בהעלאת התמונה.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await User.updateMyUserData({ certificates });
            onProfileUpdate();
        } catch (err) {
            console.error('Error updating certificates:', err);
            setError('אירעה שגיאה בעדכון התעודות.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="text-right">עריכת תעודות והסמכות</DialogTitle>
                    <DialogDescription className="text-right">נהל את התעודות וההסמכות שיוצגו בפרופיל שלך.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pl-2" dir="rtl">
                    {certificates.map((cert, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-4 relative bg-gray-50">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 left-2 text-red-500 hover:bg-red-100"
                                onClick={() => handleRemoveCertificate(index)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            
                            <div className="space-y-2 text-right">
                                <Label htmlFor={`cert-name-${index}`} className="text-right">כותרת התעודה *</Label>
                                <Input
                                    id={`cert-name-${index}`}
                                    value={cert.name || ''}
                                    onChange={(e) => handleCertificateChange(index, 'name', e.target.value)}
                                    required
                                    className="text-right"
                                    dir="rtl"
                                />
                            </div>

                            <div className="space-y-2 text-right">
                                <Label htmlFor={`cert-desc-${index}`} className="text-right">תיאור (אופציונלי)</Label>
                                <Textarea
                                    id={`cert-desc-${index}`}
                                    value={cert.description || ''}
                                    onChange={(e) => handleCertificateChange(index, 'description', e.target.value)}
                                    placeholder="פרטים על ההסמכה, המוסד המנפיק וכו'..."
                                    className="text-right"
                                    dir="rtl"
                                />
                            </div>

                            <div className="space-y-2 text-right">
                                <Label htmlFor={`cert-date-${index}`} className="text-right">תאריך</Label>
                                <Input
                                    id={`cert-date-${index}`}
                                    type="date"
                                    value={cert.date || new Date().toISOString().split('T')[0]}
                                    onChange={(e) => handleCertificateChange(index, 'date', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2 text-right">
                                <Label className="text-right">תמונת התעודה</Label>
                                <div className="flex items-center gap-4">
                                    {cert.url && (
                                        <img src={cert.url} alt={cert.name} className="w-20 h-20 object-cover rounded border" />
                                    )}
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    handleFileUpload(index, file);
                                                }
                                            }}
                                            className="hidden"
                                            id={`file-${index}`}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => document.getElementById(`file-${index}`).click()}
                                            className="w-full"
                                        >
                                            <Upload className="w-4 h-4 ml-2" />
                                            העלה תמונה
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddCertificate}
                        className="w-full border-dashed"
                    >
                        <Plus className="w-4 h-4 ml-2" />
                        הוסף תעודה חדשה
                    </Button>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 text-right">
                            {error}
                        </div>
                    )}
                </form>
                <DialogFooter dir="rtl">
                    <Button variant="outline" onClick={onClose}>ביטול</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                        שמור שינויים
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
