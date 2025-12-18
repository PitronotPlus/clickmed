
import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SupportTicket } from '@/entities/SupportTicket';
import { TicketComment } from '@/entities/TicketComment';
import { User } from '@/entities/User';
import { SystemNotification } from '@/entities/SystemNotification';
import { Headset, Eye, Loader2, MessageSquare, Clock, CheckCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';

const priorityMap = {
    'נמוכה': 'bg-blue-100 text-blue-800',
    'בינונית': 'bg-yellow-100 text-yellow-800',
    'גבוהה': 'bg-red-100 text-red-800',
};

const statusMap = {
    'פתוח': 'bg-green-100 text-green-800',
    'בטיפול': 'bg-purple-100 text-purple-800',
    'סגור': 'bg-gray-100 text-gray-800',
};

function AdminTicketsContent() {
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        loadTickets();
        loadCurrentUser();
    }, []);

    const loadCurrentUser = async () => {
        try {
            const user = await User.me();
            setCurrentUser(user);
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    };

    const loadTickets = async () => {
        try {
            const fetchedTickets = await SupportTicket.list('-created_date');
            setTickets(fetchedTickets);
        } catch (error) {
            console.error("Failed to fetch support tickets:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadTicketComments = async (ticketId) => {
        try {
            const ticketComments = await TicketComment.filter({ ticket_id: ticketId });
            setComments(ticketComments);
        } catch (error) {
            console.error("Failed to fetch ticket comments:", error);
        }
    };

    const handleTicketClick = async (ticket) => {
        setSelectedTicket(ticket);
        setNewStatus(ticket.status);
        await loadTicketComments(ticket.id);
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        setIsSaving(true);
        try {
            await TicketComment.create({
                ticket_id: selectedTicket.id,
                comment: newComment.trim()
            });

            // שליחת התראה למשתמש שפתח את הפניה
            await SystemNotification.create({
                user_id: selectedTicket.created_by,
                title: 'תגובה חדשה לפנייה שלך',
                message: `נוספה תגובה לפנייה "${selectedTicket.title}"`,
                type: 'admin',
                read: false,
                priority: 'medium'
            });

            setNewComment('');
            await loadTicketComments(selectedTicket.id);
        } catch (error) {
            console.error("Failed to add comment:", error);
            alert('שגיאה בהוספת התגובה');
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!selectedTicket || newStatus === selectedTicket.status) return;

        setIsSaving(true);
        try {
            await SupportTicket.update(selectedTicket.id, { status: newStatus });

            // שליחת התראה למשתמש על שינוי סטטוס
            await SystemNotification.create({
                user_id: selectedTicket.created_by,
                title: 'עדכון סטטוס פניה',
                message: `סטטוס הפנייה "${selectedTicket.title}" שונה ל-${newStatus}`,
                type: 'admin',
                read: false,
                priority: 'medium'
            });

            // עדכון מקומי
            setSelectedTicket({...selectedTicket, status: newStatus});
            await loadTickets();
        } catch (error) {
            console.error("Failed to update status:", error);
            alert('שגיאה בעדכון הסטטוס');
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'פתוח': return <Clock className="w-4 h-4" />;
            case 'בטיפול': return <MessageSquare className="w-4 h-4" />;
            case 'סגור': return <CheckCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-6" dir="rtl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl justify-start">
                        <Headset className="w-6 h-6" />
                        ניהול פניות תמיכה
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>אין פניות תמיכה עדיין</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">נושא</TableHead>
                                    <TableHead className="text-right">סוג משתמש</TableHead>
                                    <TableHead className="text-right">תאריך פתיחה</TableHead>
                                    <TableHead className="text-right">עדיפות</TableHead>
                                    <TableHead className="text-right">סטטוס</TableHead>
                                    <TableHead className="text-center">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tickets.map(ticket => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium text-right">{ticket.title}</TableCell>
                                        <TableCell className="text-right">{ticket.user_type}</TableCell>
                                        <TableCell className="text-right">{format(new Date(ticket.created_date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge className={priorityMap[ticket.priority]}>{ticket.priority}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center gap-2 justify-start">
                                                {getStatusIcon(ticket.status)}
                                                <Badge className={statusMap[ticket.status]}>{ticket.status}</Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="flex items-center gap-2"
                                                onClick={() => handleTicketClick(ticket)}
                                            >
                                                <Eye className="w-4 h-4" />
                                                צפה בפניה
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* מודל פרטי פנייה */}
            {selectedTicket && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-right">פרטי פנייה: {selectedTicket.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-right">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">תיאור הפנייה:</h4>
                            <p className="text-gray-700">{selectedTicket.description}</p>
                        </div>

                        <div className="flex justify-start gap-4 items-center">
                            <Select value={newStatus} onValueChange={setNewStatus} dir="rtl">
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="פתוח">פתוח</SelectItem>
                                    <SelectItem value="בטיפול">בטיפול</SelectItem>
                                    <SelectItem value="סגור">סגור</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleStatusUpdate} disabled={isSaving || newStatus === selectedTicket.status}>
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'עדכן סטטוס'}
                            </Button>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">תגובות:</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {comments.length === 0 ? (
                                    <p className="text-gray-500 text-sm">אין תגובות עדיין</p>
                                ) : (
                                    comments.map(comment => (
                                        <div key={comment.id} className="bg-blue-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-600 mb-1">
                                                {format(new Date(comment.created_date), 'dd/MM/yyyy HH:mm')} - {comment.created_by}
                                            </p>
                                            <p>{comment.comment}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="flex justify-start gap-2">
                            <input
                                type="text"
                                placeholder="הוסף תגובה..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="flex-1 p-2 border rounded-lg text-right"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                            />
                            <Button onClick={handleAddComment} disabled={!newComment.trim() || isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </Button>
                        </div>
                        <div className="flex justify-start">
                            <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                                סגור
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default function AdminTickets() {
    return (
        <ProtectedRoute requiredRoles={['admin', 'office']}>
            <AdminTicketsContent />
        </ProtectedRoute>
    );
}
