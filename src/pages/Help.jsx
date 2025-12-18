
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupportTicket } from '@/entities/SupportTicket';
import { TicketComment } from '@/entities/TicketComment';
import { User } from '@/entities/User';
import { SystemNotification } from '@/entities/SystemNotification';
import { 
    HelpCircle, 
    Plus, 
    MessageSquare, 
    Clock, 
    CheckCircle,
    Send,
    Loader2,
    Phone,
    Mail,
    MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';

const statusMap = {
    'פתוח': { bg: 'bg-green-100', text: 'text-green-800', icon: Clock },
    'בטיפול': { bg: 'bg-purple-100', text: 'text-purple-800', icon: MessageSquare },
    'סגור': { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle },
};

export default function HelpPage() {
    const [activeTab, setActiveTab] = useState('new-ticket');
    const [currentUser, setCurrentUser] = useState(null);
    const [userTickets, setUserTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    
    // טופס פנייה חדשה
    const [newTicket, setNewTicket] = useState({
        title: '',
        description: '',
        priority: 'בינונית'
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const impersonatedUserId = sessionStorage.getItem('impersonatedUserId');
                let user;
                if (impersonatedUserId) {
                    user = await User.get(impersonatedUserId);
                } else {
                    user = await User.me();
                }
                setCurrentUser(user);
                
                // Load user tickets after getting current user
                if (user) {
                    await loadUserTickets(user);
                }
            } catch (error) {
                console.error('Error loading current user:', error);
            }
        };
        
        init();
    }, []);

    const loadUserTickets = async (user) => {
        if (!user) return;
        
        setIsLoading(true);
        try {
            const tickets = await SupportTicket.filter({ created_by: user.email });
            setUserTickets(tickets.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
        } catch (error) {
            console.error('Error loading user tickets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadTicketComments = async (ticketId) => {
        try {
            const ticketComments = await TicketComment.filter({ ticket_id: ticketId });
            setComments(ticketComments.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
        } catch (error) {
            console.error('Error loading ticket comments:', error);
        }
    };

    const handleCreateTicket = async () => {
        if (!newTicket.title.trim() || !newTicket.description.trim()) {
            alert('יש למלא את כל השדות החובה');
            return;
        }

        setIsSaving(true);
        try {
            const ticket = await SupportTicket.create({
                title: newTicket.title.trim(),
                description: newTicket.description.trim(),
                priority: newTicket.priority,
                user_type: currentUser.user_type === 'admin' ? 'אדמין' : 
                          currentUser.user_type === 'doctor' ? 'רופא' :
                          currentUser.user_type === 'clinic' ? 'שותף' : 'מטופל',
                status: 'פתוח'
            });

            // שליחת התראות לכל המנהלים והמשרד
            const allUsers = await User.list();
            const adminUsers = allUsers.filter(user => 
                user.role === 'admin' || 
                user.user_type === 'admin' ||
                user.user_type === 'office' ||
                (user.permissions && (user.permissions.includes('admin') || user.permissions.includes('office')))
            );

            const notificationPromises = adminUsers.map(admin => 
                SystemNotification.create({
                    user_id: admin.id,
                    title: 'פנייה חדשה לתמיכה',
                    message: `פנייה חדשה מ-${currentUser.full_name}: ${newTicket.title}`,
                    type: 'admin',
                    read: false,
                    priority: newTicket.priority === 'גבוהה' ? 'high' : 'medium'
                })
            );
            await Promise.all(notificationPromises);

            // איפוס הטופס
            setNewTicket({ title: '', description: '', priority: 'בינונית' });
            
            // מעבר לטאב הפניות שלי
            setActiveTab('my-tickets');
            await loadUserTickets(currentUser);
            
            alert('הפנייה נשלחה בהצלחה!');
        } catch (error) {
            console.error('Error creating ticket:', error);
            alert('שגיאה ביצירת הפנייה');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTicketClick = async (ticket) => {
        setSelectedTicket(ticket);
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

            // שליחת התראות למנהלים על תגובה חדשה
            const allUsers = await User.list();
            const adminUsers = allUsers.filter(user => 
                user.role === 'admin' || 
                user.user_type === 'admin' ||
                user.user_type === 'office' ||
                (user.permissions && (user.permissions.includes('admin') || user.permissions.includes('office')))
            );

            const notificationPromises = adminUsers.map(admin => 
                SystemNotification.create({
                    user_id: admin.id,
                    title: 'תגובה חדשה לפנייה',
                    message: `${currentUser.full_name} הגיב לפנייה: ${selectedTicket.title}`,
                    type: 'admin',
                    read: false,
                    priority: 'medium'
                })
            );
            await Promise.all(notificationPromises);

            setNewComment('');
            await loadTicketComments(selectedTicket.id);
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('שגיאה בהוספת התגובה');
        } finally {
            setIsSaving(false);
        }
    };

    const getUserTypeDisplay = () => {
        if (!currentUser) return '';
        switch (currentUser.user_type) {
            case 'admin': return 'אדמין';
            case 'doctor': return 'רופא';
            case 'clinic': return 'שותף';
            case 'office': return 'משרד';
            default: return 'מטופל';
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6" dir="rtl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <HelpCircle className="w-6 h-6" />
                        מרכז עזרה ותמיכה
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
                        <TabsList className="w-full mb-6" dir="rtl">
                            <TabsTrigger value="new-ticket" className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                פנייה חדשה
                            </TabsTrigger>
                            <TabsTrigger value="my-tickets" className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                הפניות שלי
                            </TabsTrigger>
                            <TabsTrigger value="contact" className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                פרטי יצירת קשר
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="new-ticket">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-right">יצירת פנייה חדשה</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-right">נושא הפנייה *</label>
                                        <Input
                                            placeholder="תאר בקצרה את הבעיה או השאלה"
                                            value={newTicket.title}
                                            onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                                            className="text-right"
                                            dir="rtl"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-right">תיאור מפורט *</label>
                                        <Textarea
                                            placeholder="פרט על הבעיה, מה קרה, איך ניסית לפתור וכו'..."
                                            value={newTicket.description}
                                            onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                                            className="text-right h-32"
                                            dir="rtl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-right">עדיפות</label>
                                        <div className="flex justify-start">
                                            <Select 
                                                value={newTicket.priority} 
                                                onValueChange={(value) => setNewTicket({...newTicket, priority: value})}
                                            >
                                                <SelectTrigger className="w-48 text-right" dir="rtl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent dir="rtl">
                                                    <SelectItem value="נמוכה">נמוכה</SelectItem>
                                                    <SelectItem value="בינונית">בינונית</SelectItem>
                                                    <SelectItem value="גבוהה">גבוהה</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-start">
                                        <Button 
                                            onClick={handleCreateTicket}
                                            disabled={isSaving || !newTicket.title.trim() || !newTicket.description.trim()}
                                            className="flex items-center gap-2"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                            שלח פנייה
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="my-tickets">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-right">הפניות שלי</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        </div>
                                    ) : userTickets.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>עדיין לא פתחת פניות תמיכה</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {userTickets.map(ticket => {
                                                const StatusIcon = statusMap[ticket.status]?.icon || Clock;
                                                return (
                                                    <div 
                                                        key={ticket.id}
                                                        className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                                        onClick={() => handleTicketClick(ticket)}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-sm text-gray-500">
                                                                {format(new Date(ticket.created_date), 'dd/MM/yyyy HH:mm')}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <StatusIcon className="w-4 h-4" />
                                                                <Badge className={`${statusMap[ticket.status]?.bg} ${statusMap[ticket.status]?.text}`}>
                                                                    {ticket.status}
                                                                </Badge>
                                                                <Badge variant="outline">{ticket.priority}</Badge>
                                                            </div>
                                                        </div>
                                                        <h3 className="font-semibold text-right mb-2">{ticket.title}</h3>
                                                        <p className="text-gray-600 text-sm text-right line-clamp-2">
                                                            {ticket.description}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* מודל פרטי פנייה */}
                            {selectedTicket && (
                                <Card className="mt-6">
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-right">
                                                פנייה #{selectedTicket.id}: {selectedTicket.title}
                                            </CardTitle>
                                            <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                                                סגור
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-gray-700 text-right">{selectedTicket.description}</p>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-2 text-right">תגובות:</h4>
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {comments.length === 0 ? (
                                                    <p className="text-gray-500 text-sm text-right">אין תגובות עדיין</p>
                                                ) : (
                                                    comments.map(comment => (
                                                        <div key={comment.id} className="bg-blue-50 p-3 rounded-lg">
                                                            <p className="text-sm text-gray-600 mb-1 text-right">
                                                                {format(new Date(comment.created_date), 'dd/MM/yyyy HH:mm')} - {comment.created_by}
                                                            </p>
                                                            <p className="text-right">{comment.comment}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2" dir="rtl">
                                            <Input
                                                placeholder="הוסף תגובה..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                className="flex-1 text-right"
                                                dir="rtl"
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                                            />
                                            <Button 
                                                onClick={handleAddComment} 
                                                disabled={!newComment.trim() || isSaving}
                                                size="sm"
                                            >
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'הוסף'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="contact">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-right">פרטי יצירת קשר</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                                            <Phone className="w-6 h-6 text-blue-600" />
                                            <div className="text-right flex-1">
                                                <h3 className="font-semibold">טלפון</h3>
                                                <p className="text-gray-600">03-1234567</p>
                                                <p className="text-sm text-gray-500">זמינים א'-ה' 08:00-18:00</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                                            <Mail className="w-6 h-6 text-green-600" />
                                            <div className="text-right flex-1">
                                                <h3 className="font-semibold">אימייל</h3>
                                                <p className="text-gray-600">support@clickmed360.co.il</p>
                                                <p className="text-sm text-gray-500">מענה תוך 24 שעות</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                                            <MessageCircle className="w-6 h-6 text-purple-600" />
                                            <div className="text-right flex-1">
                                                <h3 className="font-semibold">צ'אט מקוון</h3>
                                                <p className="text-gray-600">זמין במערכת</p>
                                                <p className="text-sm text-gray-500">מענה מיידי בשעות העבודה</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                                            <MessageCircle className="w-6 h-6 text-green-600" />
                                            <div className="text-right flex-1">
                                                <h3 className="font-semibold">וואטסאפ</h3>
                                                <p className="text-gray-600">050-1234567</p>
                                                <p className="text-sm text-gray-500">זמינים א'-ה' 08:00-18:00</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h3 className="font-semibold mb-2 text-right">שעות התמיכה</h3>
                                        <ul className="text-sm space-y-1 text-right">
                                            <li>ראשון - חמישי: 08:00 - 18:00</li>
                                            <li>שישי: 08:00 - 13:00</li>
                                            <li>שבת וחגים: סגור</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
