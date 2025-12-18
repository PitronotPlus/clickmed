import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TicketComment } from '@/entities/TicketComment';
import { ArrowRight, MessageCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

function TicketDetailsContent() {
    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const ticketId = urlParams.get('id');

        const fetchTicketData = async () => {
            try {
                // In real app, fetch by ID
                setTicket({
                    id: ticketId,
                    title: "בעיית התחברות למערכת",
                    description: "לא מצליח להתחבר למערכת כבר יומיים. מקבל שגיאה 'משתמש לא נמצא'",
                    user_type: "מטופל",
                    priority: "גבוהה",
                    status: "פתוח",
                    created_date: new Date(),
                    created_by: "ישראל ישראלי"
                });

                setComments([
                    { id: 1, comment: "קיבלנו את הפנייה ובוחנים את הבעיה", created_date: new Date(), created_by: "תמיכה" }
                ]);
            } catch (error) {
                console.error("Failed to fetch ticket:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTicketData();
    }, []);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            await TicketComment.create({
                ticket_id: ticket.id,
                comment: newComment
            });

            setComments([...comments, {
                id: Date.now(),
                comment: newComment,
                created_date: new Date(),
                created_by: "תמיכה"
            }]);

            setNewComment('');
        } catch (error) {
            console.error("Failed to add comment:", error);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-8">טוען...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <Link to={createPageUrl('AdminTickets')} className="hover:text-blue-600">
                    פניות תמיכה
                </Link>
                <ArrowRight className="w-4 h-4" />
                <span>פנייה #{ticket?.id}</span>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl">{ticket?.title}</CardTitle>
                            <p className="text-gray-600 mt-2">נפתח על ידי: {ticket?.created_by}</p>
                        </div>
                        <div className="flex gap-2">
                            <Badge className={ticket?.priority === 'גבוהה' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                                {ticket?.priority}
                            </Badge>
                            <Badge className={ticket?.status === 'פתוח' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {ticket?.status}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap">{ticket?.description}</p>
                    <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        נפתח ב-{format(new Date(ticket?.created_date), 'dd/MM/yyyy HH:mm')}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        תגובות
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {comments.map(comment => (
                        <div key={comment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                            <p className="whitespace-pre-wrap">{comment.comment}</p>
                            <div className="text-xs text-gray-500 mt-1">
                                {comment.created_by} • {format(new Date(comment.created_date), 'dd/MM/yyyy HH:mm')}
                            </div>
                        </div>
                    ))}

                    <div className="mt-6 space-y-3">
                        <Textarea
                            placeholder="כתוב תגובה..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[100px]"
                        />
                        <Button onClick={handleAddComment} className="w-full">
                            הוסף תגובה
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function TicketDetails() {
    return (
        <ProtectedRoute requiredRoles={['admin', 'תמיכה']}>
            <TicketDetailsContent />
        </ProtectedRoute>
    );
}