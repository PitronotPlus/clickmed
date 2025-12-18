import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export default function AdminRecentActivityTable({ activities }) {
    
    const getActivityBadge = (action) => {
        if (action.toLowerCase().includes('create') || action.toLowerCase().includes('register')) {
            return <Badge variant="default" className="bg-green-500">יצירה</Badge>;
        }
        if (action.toLowerCase().includes('update') || action.toLowerCase().includes('edit')) {
            return <Badge variant="secondary">עדכון</Badge>;
        }
        if (action.toLowerCase().includes('login')) {
            return <Badge variant="outline">התחברות</Badge>;
        }
        if (action.toLowerCase().includes('delete')) {
            return <Badge variant="destructive">מחיקה</Badge>;
        }
        return <Badge>{action}</Badge>;
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>פעילות אחרונה במערכת</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">משתמש</TableHead>
                                <TableHead className="text-right">פעולה</TableHead>
                                <TableHead className="text-right">זמן</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activities.slice(0, 5).map(activity => (
                                <TableRow key={activity.id}>
                                    <TableCell>{activity.user_name}</TableCell>
                                    <TableCell>
                                        {getActivityBadge(activity.action)}
                                        <span className="ml-2">{activity.details || activity.action}</span>
                                    </TableCell>
                                    <TableCell>
                                        {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true, locale: he })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}