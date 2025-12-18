
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
// import { createBackup } from '@/functions/createBackup'; // Removed as backup button is removed
import { MedicalDocument } from '@/entities/MedicalDocument';
import { User } from '@/entities/User';
import {
    Download,
    Database,
    FileText,
    Image,
    Video,
    Archive,
    Server,
    Users,
    Eye,
    Search,
    Code,
    AlertTriangle,
    CheckCircle,
    Clock,
    Folder,
    Terminal,
    Wrench
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const BackupLogsTab = () => {
    const [backupLogs, setBackupLogs] = useState([]);

    React.useEffect(() => {
        const demoLogs = [
            {
                id: 1,
                backup_date: new Date(Date.now() - 86400000),
                generated_by: 'אדמין ראשי',
                file_size_kb: 15420,
                file_count: 1250,
                status: 'הושלם',
                notes: null
            },
            {
                id: 2,
                backup_date: new Date(Date.now() - 2 * 86400000),
                generated_by: 'מערכת אוטומטית',
                file_size_kb: 14890,
                file_count: 1205,
                status: 'הושלם',
                notes: null
            },
            {
                id: 3,
                backup_date: new Date(Date.now() - 3 * 86400000),
                generated_by: 'תמיכה טכנית',
                file_size_kb: 0,
                file_count: 0,
                status: 'נכשל',
                notes: 'שגיאת גישה לקבצים'
            }
        ];
        setBackupLogs(demoLogs);
    }, []);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'הושלם': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'נכשל': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'בתהליך': return <Clock className="w-4 h-4 text-yellow-500" />;
            default: return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const formatFileSize = (sizeInKB) => {
        if (sizeInKB === 0) return '0 KB';
        if (sizeInKB < 1024) return `${sizeInKB} KB`;
        const sizeInMB = (sizeInKB / 1024).toFixed(1);
        if (sizeInMB < 1024) return `${sizeInMB} MB`;
        const sizeInGB = (sizeInMB / 1024).toFixed(1);
        return `${sizeInGB} GB`;
    };

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">היסטוריית גיבויים</h2>
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {backupLogs.map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    {getStatusIcon(log.status)}
                                    <div>
                                        <p className="font-semibold">
                                            {format(log.backup_date, 'dd/MM/yyyy HH:mm', { locale: he })}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            נוצר על ידי: {log.generated_by}
                                        </p>
                                        {log.notes && (
                                            <p className="text-sm text-red-600 mt-1">{log.notes}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge className={log.status === 'הושלם' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                        {log.status}
                                    </Badge>
                                    {log.status === 'הושלם' && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {formatFileSize(log.file_size_kb)} • {log.file_count} קבצים
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const SystemFilesTab = () => {
    const [files, setFiles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                // במערכת אמיתית, היינו קוראים כאן לשרת לקבל את כל הקבצים.
                // לצורך הדגמה, אנו יוצרים רשימה מקיפה של קבצים.
                const systemFiles = [
                    // לוגואים של קופות חולים
                    {
                        id: '1',
                        name: 'כללית_לוגו.png',
                        type: 'לוגו',
                        file_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b0418f046_cdb68a33e6cd9a426e2c179b7f8531be47d4a87e.png',
                        file_size: '45.2 KB',
                        file_format: 'PNG',
                        date: '2024-01-15',
                        category: 'קופות חולים'
                    },
                    {
                        id: '2',
                        name: 'מכבי_לוגו.png',
                        type: 'לוגו',
                        file_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a28c5aa5e_Maccabi_Health_Care_Services_2011_logosvg.png',
                        file_size: '52.1 KB',
                        file_format: 'PNG',
                        date: '2024-01-15',
                        category: 'קופות חולים'
                    },
                    {
                        id: '3',
                        name: 'מאוחדת_לוגo.png',
                        type: 'לוגו',
                        file_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/702b6f392_MeuhedetLogosvg.png',
                        file_size: '38.4 KB',
                        file_format: 'PNG',
                        date: '2024-01-15',
                        category: 'קופות חולים'
                    },
                    {
                        id: '4',
                        name: 'לאומית_לוגו.png',
                        type: 'לוגו',
                        file_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/f6a9948c1_Leumit-Logo.png',
                        file_size: '41.7 KB',
                        file_format: 'PNG',
                        date: '2024-01-15',
                        category: 'קופות חולים'
                    },
                    // לוגו המערכת
                    {
                        id: '5',
                        name: 'clickmed_לוגו.png',
                        type: 'לוגו מערכת',
                        file_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/8bfb54141_CLICKMEDLOGO.png',
                        file_size: '89.3 KB',
                        file_format: 'PNG',
                        date: '2024-01-10',
                        category: 'מערכת'
                    },
                    // אווטארים
                    {
                        id: '6',
                        name: 'אווטאר_ברירת_מחדל.png',
                        type: 'אווטאר',
                        file_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/03e9ff525_6d1f028bc30367a84e0b1efd8a8742d7e99fd62a.png',
                        file_size: '12.8 KB',
                        file_format: 'PNG',
                        date: '2024-01-08',
                        category: 'אווטארים'
                    },
                    // מסמכים רפואיים דוגמא
                    {
                        id: '7',
                        name: 'בדיקת_דם_יוחנן.pdf',
                        type: 'בדיקה רפואית',
                        file_url: 'https://www.africau.edu/images/default/sample.pdf', // Updated to a valid URL for demo
                        file_size: '2.3 MB',
                        file_format: 'PDF',
                        date: '2024-01-15',
                        category: 'מסמכים רפואיים'
                    },
                    {
                        id: '8',
                        name: 'צילום_רנטגן_שרה.jpg',
                        type: 'הדמיה רפואית',
                        file_url: 'https://www.nasa.gov/sites/default/files/thumbnails/image/main_image_deep_field_smacs0723-5mb.jpg', // Updated to a valid URL for demo
                        file_size: '5.1 MB',
                        file_format: 'JPG',
                        date: '2024-01-14',
                        category: 'מסמכים רפואיים'
                    },
                    // קבצי מערכת נוספים
                    {
                        id: '9',
                        name: 'הוראות_שימוש.pdf',
                        type: 'מדריך',
                        file_url: 'https://www.africau.edu/images/default/sample.pdf', // Updated to a valid URL for demo
                        file_size: '1.2 MB',
                        file_format: 'PDF',
                        date: '2024-01-05',
                        category: 'מדריכים'
                    },
                    {
                        id: '10',
                        name: 'וידאו_הדרכה.mp4',
                        type: 'וידאו הדרכה',
                        file_url: 'http://techslides.com/demos/sample-videos/small.mp4', // Updated to a valid URL for demo
                        file_size: '45.8 MB',
                        file_format: 'MP4',
                        date: '2024-01-03',
                        category: 'מדריכים'
                    }
                ];
                setFiles(systemFiles);
            } catch (error) {
                console.error('Error fetching files:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFiles();
    }, []);

    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getFileIcon = (format) => {
        switch (format?.toLowerCase()) {
            case 'pdf':
                return <FileText className="w-5 h-5 text-red-500" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return <Image className="w-5 h-5 text-blue-500" />;
            case 'mp4':
            case 'avi':
            case 'mov':
                return <Video className="w-5 h-5 text-purple-500" />;
            default:
                return <FileText className="w-5 h-5 text-gray-500" />;
        }
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'קופות חולים': return 'bg-blue-100 text-blue-800';
            case 'מערכת': return 'bg-purple-100 text-purple-800';
            case 'אווטארים': return 'bg-green-100 text-green-800';
            case 'מסמכים רפואיים': return 'bg-red-100 text-red-800';
            case 'מדריכים': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handlePreview = async (file) => {
        try {
            if (file.file_format?.toLowerCase() === 'png' || file.file_format?.toLowerCase() === 'jpg' || file.file_format?.toLowerCase() === 'jpeg' || file.file_format?.toLowerCase() === 'gif') {
                // עבור תמונות - הצג בחלון חדש
                window.open(file.file_url, '_blank');
            } else if (file.type === 'text' || file.type === 'log') {
                // עבור קבצי טקסט - הצג בתצוגה מקדימה
                const response = await fetch(file.file_url);
                const text = await response.text();

                // יצירת חלון תצוגה מקדימה
                const previewWindow = window.open('', '_blank', 'width=800,height=600');
                previewWindow.document.write(`
                    <html dir="rtl">
                        <head>
                            <title>תצוגה מקדימה - ${file.name}</title>
                            <style>
                                body { 
                                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                                    padding: 20px; 
                                    background: #f5f5f5; 
                                    margin: 0;
                                    direction: rtl;
                                }
                                .header { 
                                    background: white; 
                                    padding: 15px; 
                                    border-radius: 8px; 
                                    margin-bottom: 20px;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                }
                                .content { 
                                    background: white; 
                                    padding: 20px; 
                                    border-radius: 8px;
                                    white-space: pre-wrap; 
                                    font-family: monospace; 
                                    font-size: 14px;
                                    line-height: 1.5;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                    max-height: calc(100vh - 150px);
                                    overflow-y: auto;
                                }
                                .close-btn {
                                    background: #5932EA;
                                    color: white;
                                    border: none;
                                    padding: 8px 16px;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    float: left;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <h2>תצוגה מקדימה: ${file.name}</h2>
                                <p>גודל: ${file.file_size} | תאריך: ${file.date}</p>
                                <button class="close-btn" onclick="window.close()">סגור</button>
                            </div>
                            <div class="content">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                        </body>
                    </html>
                `);
            } else {
                // עבור קבצים אחרים - הורד
                handleDownload(file.file_url, file.name);
            }
        } catch (error) {
            console.error('Error previewing file:', error);
            alert('שגיאה בפתיחת התצוגה המקדימה');
        }
    };

    const handleDownload = async (url, filename) => {
        if (!url || !url.startsWith('http')) {
            alert('הורדה זמינה רק עבור קבצים עם קישור מלא.');
            return;
        }
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok.');
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Download failed:', error);
            alert('ההורדה נכשלה. אנא נסה שוב.');
        }
    };

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">קבצי המערכת</h2>
                <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="חיפוש קבצים..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>טוען קבצים...</p>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-6">
                        <div className="grid gap-4">
                            {filteredFiles.map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                                    <div className="flex items-center gap-4">
                                        {getFileIcon(file.file_format)}
                                        <div>
                                            <p className="font-semibold">{file.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-sm text-gray-600">
                                                    {file.type} • {file.file_size} • {format(new Date(file.date), 'dd/MM/yyyy')}
                                                </p>
                                                {file.category && (
                                                    <Badge className={getCategoryColor(file.category)}>
                                                        {file.category}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handlePreview(file)} disabled={!file.file_url || !file.file_url.startsWith('http')}>
                                            <Eye className="w-4 h-4 ml-2" />
                                            תצוגה מקדימה
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleDownload(file.file_url, file.name)} disabled={!file.file_url || !file.file_url.startsWith('http')}>
                                            <Download className="w-4 h-4 ml-2" />
                                            הורדה
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

const SystemFiles = () => {
    const [systemFiles, setSystemFiles] = useState([
        {
            id: '1',
            name: 'config.json',
            type: 'config',
            size: '12KB',
            date: '2024-01-01',
            url: 'https://example.com/config.json',
        },
        {
            id: '2',
            name: 'app.log',
            type: 'log',
            size: '256KB',
            date: '2024-01-05',
            url: 'https://example.com/app.log',
        },
        {
            id: '3',
            name: 'backup.zip',
            type: 'backup',
            size: '10MB',
            date: '2024-01-10',
            url: 'https://example.com/backup.zip',
        },
        {
            id: '4',
            name: 'image.png',
            type: 'image',
            size: '1MB',
            date: '2024-01-15',
            url: 'https://www.nasa.gov/sites/default/files/thumbnails/image/main_image_deep_field_smacs0723-5mb.jpg',
        },
        {
            id: '5',
            name: 'document.txt',
            type: 'text',
            size: '5KB',
            date: '2024-01-20',
            url: 'https://example.com/document.txt',
        },
    ]);

    const handlePreview = async (file) => {
        try {
            if (file.type === 'image') {
                // עבור תמונות - הצג בחלון חדש
                window.open(file.url, '_blank');
            } else if (file.type === 'text' || file.type === 'log') {
                // עבור קבצי טקסט - הצג בתצוגה מקדימה
                const response = await fetch(file.url);
                const text = await response.text();

                // יצירת חלון תצוגה מקדימה
                const previewWindow = window.open('', '_blank', 'width=800,height=600');
                previewWindow.document.write(`
                    <html dir="rtl">
                        <head>
                            <title>תצוגה מקדימה - ${file.name}</title>
                            <style>
                                body { 
                                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                                    padding: 20px; 
                                    background: #f5f5f5; 
                                    margin: 0;
                                    direction: rtl;
                                }
                                .header { 
                                    background: white; 
                                    padding: 15px; 
                                    border-radius: 8px; 
                                    margin-bottom: 20px;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                }
                                .content { 
                                    background: white; 
                                    padding: 20px; 
                                    border-radius: 8px;
                                    white-space: pre-wrap; 
                                    font-family: monospace; 
                                    font-size: 14px;
                                    line-height: 1.5;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                    max-height: calc(100vh - 150px);
                                    overflow-y: auto;
                                }
                                .close-btn {
                                    background: #5932EA;
                                    color: white;
                                    border: none;
                                    padding: 8px 16px;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    float: left;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <h2>תצוגה מקדימה: ${file.name}</h2>
                                <p>גודל: ${file.size} | תאריך: ${file.date}</p>
                                <button class="close-btn" onclick="window.close()">סגור</button>
                            </div>
                            <div class="content">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                        </body>
                    </html>
                `);
            } else {
                // עבור קבצים אחרים - הורד
                handleDownload(file);
            }
        } catch (error) {
            console.error('Error previewing file:', error);
            alert('שגיאה בפתיחת התצוגה המקדימה');
        }
    };

    const handleDownload = (file) => {
        // יצירת קישור הורדה
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6" dir="rtl">

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">שם הקובץ</TableHead>
                            <TableHead className="text-right">סוג</TableHead>
                            <TableHead className="text-right">גודל</TableHead>
                            <TableHead className="text-right">תאריך יצירה</TableHead>
                            <TableHead className="text-center">פעולות</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {systemFiles.map((file) => (
                            <TableRow key={file.id}>
                                <TableCell className="font-medium text-right">{file.name}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="outline">
                                        {file.type === 'config' && 'הגדרות'}
                                        {file.type === 'log' && 'יומן'}
                                        {file.type === 'backup' && 'גיבוי'}
                                        {file.type === 'image' && 'תמונה'}
                                        {file.type === 'text' && 'טקסט'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">{file.size}</TableCell>
                                <TableCell className="text-right">{file.date}</TableCell>
                                <TableCell>
                                    <div className="flex justify-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePreview(file)}
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            תצוגה מקדימה
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownload(file)}
                                        >
                                            <Download className="w-4 h-4 mr-1" />
                                            הורדה
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

const ClientFilesTab = () => {
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientFiles, setClientFiles] = useState([]);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const users = await User.filter({ user_type: 'patient' });
                setClients(users);
            } catch (error) {
                setClients([
                    { id: '1', full_name: 'יוחנן כהן', email: 'yohanan@example.com' },
                    { id: '2', full_name: 'שרה לוי', email: 'sarah@example.com' },
                    { id: '3', full_name: 'דוד ישראלי', email: 'david@example.com' }
                ]);
            }
        };
        fetchClients();
    }, []);

    const handleClientSelect = async (client) => {
        setSelectedClient(client);
        try {
            const files = await MedicalDocument.filter({ patient_id: client.id });
            setClientFiles(files);
        } catch (error) {
            setClientFiles([
                {
                    id: '1',
                    name: `תוצאות_בדיקה_${client.full_name}.pdf`,
                    type: 'בדיקה',
                    file_size: '1.2 MB',
                    date: '2024-01-10',
                    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
                }
            ]);
        }
    };

    const handlePreview = (url) => {
        if (!url) {
            alert('תצוגה מקדימה לא זמינה עבור קובץ זה.');
            return;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleDownload = async (url, filename) => {
        if (!url) {
            alert('הורדה לא זמינה עבור קובץ זה.');
            return;
        }
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok.');
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Download failed:', error);
            alert('ההורדה נכשלה. אנא נסה שוב.');
        }
    };

    return (
        <div className="space-y-6" dir="rtl">
            <h2 className="text-2xl font-bold">קבצי לקוחות</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            רשימת לקוחות
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {clients.map((client) => (
                                <div
                                    key={client.id}
                                    onClick={() => handleClientSelect(client)}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                        selectedClient?.id === client.id
                                            ? 'bg-blue-100 border-blue-300'
                                            : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                                >
                                    <p className="font-semibold">{client.full_name}</p>
                                    <p className="text-sm text-gray-600">{client.email}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Folder className="w-5 h-5" />
                            {selectedClient ? `קבצי ${selectedClient.full_name}` : 'בחר לקוח'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedClient ? (
                            <div className="space-y-2">
                                {clientFiles.length > 0 ? (
                                    clientFiles.map((file) => (
                                        <div key={file.id} className="p-3 bg-gray-50 rounded-lg">
                                            <p className="font-semibold">{file.name}</p>
                                            <p className="text-sm text-gray-600">
                                                {file.type} • {file.file_size} • {format(new Date(file.date), 'dd/MM/yyyy')}
                                            </p>
                                            <div className="flex gap-2 mt-2">
                                                <Button size="sm" variant="outline" onClick={() => handlePreview(file.file_url)} disabled={!file.file_url}>
                                                    <Eye className="w-4 h-4 ml-2" />
                                                    צפייה
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleDownload(file.file_url, file.name)} disabled={!file.file_url}>
                                                    <Download className="w-4 h-4 ml-2" />
                                                    הורדה
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-4">אין קבצים עבור לקוח זה</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">בחר לקוח כדי לראות את הקבצים שלו</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const SystemBackupTab = () => {
    // The state and handler for the backup button are removed as it's no longer needed.

    return (
        <div className="space-y-6" dir="rtl">
            <h2 className="text-2xl font-bold">גיבוי מלא של המערכת</h2>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            גיבוי מלא
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2">הגיבוי כולל:</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• כל נתוני המשתמשים והמטופלים</li>
                                <li>• כל התורים והבקשות</li>
                                <li>• כל המסמכים הרפואיים והקבצים</li>
                                <li>• הגדרות המערכת והרשאות</li>
                                <li>• נתוני מרפאות ושותפים</li>
                            </ul>
                        </div>

                        {/* The backup button and its logic have been removed as per the request. */}

                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Code className="w-5 h-5" />
                            הדרכה מפורטת למפתחים
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Alert>
                            <Server className="h-4 w-4" />
                            <AlertTitle>העברה לשרת חיצוני</AlertTitle>
                            <AlertDescription>
                                המדריך הבא מיועד למפתחים מנוסים שרוצים להעביר את מערכת ClickMed 360 לשרת חיצוני מחוץ לפלטפורמת Base44.
                            </AlertDescription>
                        </Alert>

                        <div className="bg-gray-50 p-6 rounded-lg space-y-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Wrench className="w-5 h-5" />
                                שלבי ההעברה המפורטים:
                            </h3>

                            <div className="space-y-6">
                                {/* שלב 1 */}
                                <div className="border-r-4 border-blue-500 pr-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
                                        <h4 className="text-lg font-semibold">קבלת הגיבוי המלא</h4>
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-700 mr-11">
                                        <p>• פנה למנהל האתר ובקש ממנו לספק לך קובץ ZIP של הגיבוי המלא. הקובץ יכיל:</p>
                                        <ul className="mr-4 space-y-1">
                                            <li>- כל הקוד של האפליקציה (React components, pages, layouts)</li>
                                            <li>- נתוני מסד הנתונים בפורמט JSON</li>
                                            <li>- כל הקבצים שהועלו (תמונות, מסמכים, לוגואים)</li>
                                            <li>- קבצי הגדרות והרשאות</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* שלב 2 */}
                                <div className="border-r-4 border-green-500 pr-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
                                        <h4 className="text-lg font-semibold">הכנת סביבת הפיתוח</h4>
                                    </div>
                                    <div className="space-y-3 text-sm text-gray-700 mr-11">
                                        <div>
                                            <p className="font-semibold">דרישות שרת:</p>
                                            <ul className="mr-4 space-y-1">
                                                <li>- Node.js גרסה 18+ עם npm/yarn</li>
                                                <li>- מסד נתונים: PostgreSQL 13+ או MySQL 8+</li>
                                                <li>- Redis לניהול sessions</li>
                                                <li>- Nginx או Apache לwebserver</li>
                                                <li>- SSL certificate לHTTPS</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="font-semibold">התקנת תלויות:</p>
                                            <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-xs mt-2">
                                                npm install express react react-dom<br />
                                                npm install tailwindcss @shadcn/ui<br />
                                                npm install pg sequelize redis<br />
                                                npm install jsonwebtoken bcrypt
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* שלב 3 */}
                                <div className="border-r-4 border-orange-500 pr-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
                                        <h4 className="text-lg font-semibold">התאמת הקוד</h4>
                                    </div>
                                    <div className="space-y-3 text-sm text-gray-700 mr-11">
                                        <div>
                                            <p className="font-semibold">שינויים נדרשים:</p>
                                            <ul className="mr-4 space-y-2">
                                                <li>
                                                    <strong>החלפת Base44 SDK:</strong>
                                                    <div className="bg-gray-800 text-green-400 p-2 rounded font-mono text-xs mt-1">
                                                        // במקום: import {"{User}"} from '@/entities/User';<br />
                                                        // השתמש ב: import api from './api/userAPI';
                                                    </div>
                                                </li>
                                                <li>
                                                    <strong>ניהול אימות:</strong> החלף User.login() בGoogle OAuth או Auth0
                                                </li>
                                                <li>
                                                    <strong>העלאת קבצים:</strong> החלף UploadFile integration ב-Multer או AWS S3
                                                </li>
                                                <li>
                                                    <strong>מסד נתונים:</strong> כתוב models עבור Sequelize/TypeORM
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* שלב 4 */}
                                <div className="border-r-4 border-purple-500 pr-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
                                        <h4 className="text-lg font-semibold">העלאת הנתונים</h4>
                                    </div>
                                    <div className="space-y-3 text-sm text-gray-700 mr-11">
                                        <div>
                                            <p className="font-semibold">יצירת טבלאות:</p>
                                            <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-xs mt-2">
                                                CREATE DATABASE clickmed360;<br />
                                                CREATE TABLE users (...); <br />
                                                CREATE TABLE appointments (...);
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-semibold">ייבוא נתונים:</p>
                                            <ul className="mr-4 space-y-1">
                                                <li>- פרוק קבצי JSON מהגיבוי</li>
                                                <li>- כתוב סקריפט migration לייבוא למסד הנתונים</li>
                                                <li>- העלה קבצים לתיקיית uploads</li>
                                                <li>- בדוק שלמות הנתונים</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* שלב 5 */}
                                <div className="border-r-4 border-red-500 pr-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">5</span>
                                        <h4 className="text-lg font-semibold">בדיקות ופריסה</h4>
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-700 mr-11">
                                        <p>• בדוק שכל הפונקציונליות עובדת כהלכה</p>
                                        <p>• הגדר גיבויים אוטומטיים</p>
                                        <p>• הגדר SSL וCDN לביצועים מיטביים</p>
                                        <p>• בצע בדיקות עומס</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-yellow-800 mb-2">הערות חשובות:</p>
                                    <ul className="text-yellow-700 text-sm space-y-1">
                                        <li>• תהליך ההעברה מורכב ודורש ידע מעמיק בפיתוח FullStack</li>
                                        <li>• מומלץ לבצע העברה הדרגתית עם בדיקות מקיפות</li>
                                        <li>• שמור על גיבויי Base44 כגיבוי עד להשלמת ההעברה</li>
                                        <li>• פנה לצוות Base44 לקבלת תמיכה טכנית במידת הצורך</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Terminal className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-blue-800 mb-2">עזרה טכנית:</p>
                                    <p className="text-blue-700 text-sm">
                                        לתמיכה טכנית מתקדמת או לקבלת הדרכה אישית, צור קשר עם צוות הפיתוח של Base44
                                        או שכור מפתח מנוסה שמכיר את פלטפורמת Base44.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

function BackupsPageContent() {
    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Archive className="w-8 h-8 text-blue-600" />
                    גיבויים ונתונים
                </h1>
                <Badge className="bg-red-100 text-red-800 font-semibold">
                    גישה מוגבלת לאדמין
                </Badge>
            </div>

            <Tabs defaultValue="system_backup" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="backup_logs">היסטוריה</TabsTrigger>
                    <TabsTrigger value="client_files">קבצי לקוחות</TabsTrigger>
                    <TabsTrigger value="system_files">קבצי מערכת</TabsTrigger>
                    <TabsTrigger value="system_backup">גיבוי מערכת</TabsTrigger>
                </TabsList>

                <TabsContent value="system_backup">
                    <SystemBackupTab />
                </TabsContent>

                <TabsContent value="system_files">
                    <SystemFiles />
                </TabsContent>

                <TabsContent value="client_files">
                    <ClientFilesTab />
                </TabsContent>

                <TabsContent value="backup_logs">
                    <BackupLogsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function BackupsPage() {
    return (
        <ProtectedRoute requiredRoles={['admin']}>
            <BackupsPageContent />
        </ProtectedRoute>
    );
}
