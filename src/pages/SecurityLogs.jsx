import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ActivityLog } from '@/entities/ActivityLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Shield, 
    Search, 
    AlertTriangle,
    User,
    Database,
    Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

function SecurityLogsContent() {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const allLogs = await ActivityLog.list('-created_date', 100);
                setLogs(allLogs);
                setFilteredLogs(allLogs);
            } catch (error) {
                console.error('Error fetching security logs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredLogs(logs);
        } else {
            const filtered = logs.filter(log => 
                log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.target_entity?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredLogs(filtered);
        }
    }, [searchTerm, logs]);

    const getActionIcon = (action) => {
        if (action.includes('גישה') || action.includes('צפייה')) {
            return <Eye className="w-4 h-4 text-blue-500" />;
        }
        if (action.includes('עדכון') || action.includes('שינוי')) {
            return <Database className="w-4 h-4 text-orange-500" />;
        }
        return <User className="w-4 h-4 text-gray-500" />;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir="rtl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-6 h-6" />
                        לוג אבטחה ופעילות
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            כל פעולה קריטית במערכת נרשמת כאן למטרות ביקורת ואבטחה
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="חיפוש לפי משתמש, פעולה או ישות..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-10 text-right"
                            />
                        </div>
                        <Badge variant="outline">
                            {filteredLogs.length} רשומות
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {filteredLogs.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                לא נמצאו רשומות
                            </div>
                        ) : (
                            filteredLogs.map((log) => (
                                <Card key={log.id} className="border">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                {getActionIcon(log.action)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="font-semibold text-gray-900">
                                                        {log.user_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {format(new Date(log.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-700 mb-2">
                                                    <span className="font-medium">פעולה:</span> {log.action}
                                                </div>
                                                {log.target_entity && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Badge variant="outline" className="text-xs">
                                                            {log.target_entity}
                                                        </Badge>
                                                        {log.target_id && (
                                                            <span className="text-gray-500">
                                                                ID: {log.target_id.substring(0, 8)}...
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {log.details && (
                                                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 font-mono">
                                                        {log.details}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SecurityLogs() {
    return (
        <ProtectedRoute requiredRoles={['admin']}>
            <SecurityLogsContent />
        </ProtectedRoute>
    );
}