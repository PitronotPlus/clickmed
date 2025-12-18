import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DoctorPendingRequestsTable({ requests = [], onApprove, onDeny }) {
    return (
        <Card className="bg-white shadow-[0px_10px_60px_rgba(226,236,249,0.5)] border-none rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">בקשות ממתינות לאישור</CardTitle>
                <Button variant="ghost" className="text-sm text-blue-600 hover:text-blue-700" asChild>
                    <Link to={createPageUrl('DoctorRequests')} className="flex items-center">
                        כל הבקשות <ArrowLeft className="w-4 h-4 ml-1" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">מטופל</TableHead>
                            <TableHead className="text-right">שירות מבוקש</TableHead>
                            <TableHead className="text-right">הוגש</TableHead>
                            <TableHead className="text-right">סטטוס</TableHead>
                            <TableHead className="text-center">פעולות</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.length > 0 ? (
                            requests.map((req, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium text-right">{req.user_name}</TableCell>
                                    <TableCell className="text-right">{req.type}</TableCell>
                                    <TableCell className="text-right">{formatDistanceToNow(new Date(req.created_date), { addSuffix: true, locale: he })}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={req.status === 'בקשה בבדיקה' ? 'default' : 'secondary'} className={req.status === 'בקשה בבדיקה' ? "bg-yellow-100 text-yellow-800" : req.status === 'מאושר' ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                                            {req.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex gap-2 justify-center">
                                            <Button variant="outline" size="icon" className="w-8 h-8 text-green-600 border-green-600 hover:bg-green-50" onClick={() => onApprove(req)}>
                                                <Check className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="w-8 h-8 text-red-600 border-red-600 hover:bg-red-50" onClick={() => onDeny(req)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    אין בקשות ממתינות
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}