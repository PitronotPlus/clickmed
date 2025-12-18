
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Eye } from 'lucide-react';

const statusConfig = {
    'פתוח': 'bg-blue-100 text-blue-800',
    'בטיפול': 'bg-yellow-100 text-yellow-800',
    'סגור': 'bg-green-100 text-green-800'
};

export default function TicketList({ tickets }) {
    if (!tickets || tickets.length === 0) {
        return <p className="text-center text-gray-500 py-8">לא נמצאו פניות.</p>;
    }

    return (
        <div className="border rounded-lg overflow-hidden bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>נושא</TableHead>
                        <TableHead>תאריך פתיחה</TableHead>
                        <TableHead>סטטוס</TableHead>
                        <TableHead>פעולות</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.title}</TableCell>
                            <TableCell>{format(new Date(ticket.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}</TableCell>
                            <TableCell>
                                <Badge className={statusConfig[ticket.status] || 'bg-gray-100'}>
                                    {ticket.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Link to={createPageUrl(`TicketDetails?id=${ticket.id}`)}>
                                    <Button variant="outline" size="sm">
                                        <Eye className="w-4 h-4 mr-2" />
                                        צפה בפנייה
                                    </Button>
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
