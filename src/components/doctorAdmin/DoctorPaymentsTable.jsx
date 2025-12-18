import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
    'שולם': {
        icon: <CheckCircle className="w-4 h-4 ml-2 text-green-600" />,
        badge: "bg-green-100 text-green-800",
    },
    'ממתין לתשלום': {
        icon: <Clock className="w-4 h-4 ml-2 text-yellow-600" />,
        badge: "bg-yellow-100 text-yellow-800",
    },
    'באיחור': {
        icon: <AlertCircle className="w-4 h-4 ml-2 text-red-600" />,
        badge: "bg-red-100 text-red-800",
    }
};

export default function DoctorPaymentsTable({ payments = [] }) {
    return (
        <Card className="bg-white shadow-[0px_10px_60px_rgba(226,236,249,0.5)] border-none rounded-lg">
            <CardHeader>
                <CardTitle className="text-lg font-bold text-right">חשבוניות ותשלומים</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">מטופל</TableHead>
                            <TableHead className="text-right">שירות</TableHead>
                            <TableHead className="text-right">תאריך חשבונית</TableHead>
                            <TableHead className="text-right">סכום</TableHead>
                            <TableHead className="text-right">סטטוס</TableHead>
                            <TableHead className="text-center">פעולות</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.length > 0 ? (
                            payments.map((payment, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium text-right">{payment.patient}</TableCell>
                                    <TableCell className="text-right">{payment.service}</TableCell>
                                    <TableCell className="text-right">{format(payment.date, 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="font-semibold text-right">₪{payment.amount}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className={`flex items-center w-fit ${statusConfig[payment.status]?.badge || 'bg-gray-100 text-gray-700'}`}>
                                            {statusConfig[payment.status]?.icon}
                                            <span>{payment.status}</span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            disabled={payment.status === 'שולם'}
                                            className="disabled:opacity-50"
                                        >
                                            <Send className="w-4 h-4 ml-2" />
                                            שלח תזכורת
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    אין חשבוניות להצגה
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}