import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, File, X, AlertTriangle } from 'lucide-react';
import { UploadFile } from '@/integrations/Core';

export default function FileUploadSection({ 
    specialty, 
    uploadedFiles, 
    onFilesChange, 
    isRequired = false 
}) {
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        setUploading(true);
        setUploadError(null);

        try {
            const uploadPromises = files.map(async (file) => {
                // Validate file type
                const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
                if (!allowedTypes.includes(file.type)) {
                    throw new Error(`סוג קובץ לא נתמך: ${file.name}. מותרים רק PDF, JPG, PNG`);
                }

                // Validate file size (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    throw new Error(`קובץ גדול מדי: ${file.name}. מקסימום 10MB`);
                }

                const result = await UploadFile({ file });
                return {
                    name: file.name,
                    url: result.file_url,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date().toISOString()
                };
            });

            const uploadedResults = await Promise.all(uploadPromises);
            const newFiles = [...uploadedFiles, ...uploadedResults];
            onFilesChange(newFiles);

        } catch (error) {
            setUploadError(error.message);
        } finally {
            setUploading(false);
        }
    };

    const removeFile = (index) => {
        const newFiles = uploadedFiles.filter((_, i) => i !== index);
        onFilesChange(newFiles);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getRequiredFileText = () => {
        if (!specialty) return '';
        
        const specialtyRequirements = {
            'פסיכיאטריה ילדים': 'נדרש להעלות: המלצה מרופא ילדים, דוח פסיכולוגי (אם קיים)',
            'נוירולוגיה': 'נדרש להעלות: בדיקות דימות קודמות (CT/MRI), תוצאות בדיקות דם',
            'רופא שיניים': 'נדרש להעלות: צילומי רנטגן קודמים (אם קיימים)',
        };

        return specialtyRequirements[specialty.name] || 'נדרש להעלות מסמכים רפואיים רלוונטיים';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    העלאת מסמכים רפואיים
                    {isRequired && <Badge variant="destructive">חובה</Badge>}
                </CardTitle>
                {specialty && (
                    <p className="text-sm text-gray-600 mt-2">
                        {getRequiredFileText()}
                    </p>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {isRequired && uploadedFiles.length === 0 && (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            יש להעלות לפחות קובץ אחד כדי להמשיך
                        </AlertDescription>
                    </Alert>
                )}

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        disabled={uploading}
                    />
                    <Label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                            <Upload className="w-8 h-8 text-gray-400" />
                            <p className="text-lg font-medium">
                                {uploading ? 'מעלה קבצים...' : 'לחץ כדי להעלות קבצים'}
                            </p>
                            <p className="text-sm text-gray-500">
                                PDF, JPG, PNG עד 10MB
                            </p>
                        </div>
                    </Label>
                </div>

                {uploadError && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{uploadError}</AlertDescription>
                    </Alert>
                )}

                {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-medium">קבצים שהועלו:</h4>
                        {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <File className="w-4 h-4 text-blue-500" />
                                    <div>
                                        <p className="text-sm font-medium">{file.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(index)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}