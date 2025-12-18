
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from '@/entities/User';
import { ChatMessage } from '@/entities/ChatMessage';
import { SystemNotification } from '@/entities/SystemNotification';
import { Search, Users, UserCheck, Building2, ShieldCheck, Loader2 } from 'lucide-react';

export default function NewConversationModal({ isOpen, onClose, currentUser, onConversationCreated }) {
    const [availableUsers, setAvailableUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [inputValue, setInputValue] = useState(''); // New state for input field
    const [selectedUser, setSelectedUser] = useState(null);
    const [initialMessage, setInitialMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (isOpen && currentUser) {
            loadAvailableUsers();
        }
    }, [isOpen, currentUser]);

    useEffect(() => {
        // If searchQuery is empty, display all available users.
        // Otherwise, filter based on searchQuery.
        if (!searchQuery) {
            setFilteredUsers(availableUsers);
            return;
        }
        const filtered = availableUsers.filter(user =>
            user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredUsers(filtered);
    }, [searchQuery, availableUsers]);

    const loadAvailableUsers = async () => {
        setIsLoading(true);
        try {
            let users = [];
            
            // בהתאם לסוג המשתמש, נקבע עם מי הוא יכול לשוחח
            if (currentUser.user_type === 'patient') {
                // מטופל יכול לשוחח עם: רופאים, מנהלה, משרד
                const [doctors, admins] = await Promise.all([
                    User.filter({ user_type: 'doctor', status: 'active' }),
                    User.filter({ 
                        $or: [
                            { permissions: { $in: ['admin'] } },
                            { permissions: { $in: ['office'] } },
                            { user_type: 'admin' }
                        ]
                    })
                ]);
                users = [...doctors, ...admins];
            } else if (currentUser.user_type === 'doctor') {
                // רופא יכול לשוחח עם: מטופלים, רופאים אחרים, מנהלה, משרד
                const [patients, doctors, admins] = await Promise.all([
                    User.filter({ user_type: 'patient', status: 'active' }),
                    User.filter({ user_type: 'doctor', status: 'active', id: { $ne: currentUser.id } }),
                    User.filter({ 
                        $or: [
                            { permissions: { $in: ['admin'] } },
                            { permissions: { $in: ['office'] } },
                            { user_type: 'admin' }
                        ]
                    })
                ]);
                users = [...patients, ...doctors, ...admins];
            } else if (currentUser.user_type === 'clinic') {
                // מרפאה יכול לשוחח עם: מנהלה, משרד
                users = await User.filter({ 
                    $or: [
                        { permissions: { $in: ['admin'] } },
                        { permissions: { $in: ['office'] } },
                        { user_type: 'admin' }
                        ]
                    });
            } else if (currentUser.permissions?.includes('admin') || currentUser.permissions?.includes('office')) {
                // מנהלה/משרד יכולים לשוחח עם כולם
                users = await User.filter({ 
                    status: 'active',
                    id: { $ne: currentUser.id }
                });
            }

            setAvailableUsers(users);
        } catch (error) {
            console.error('Error loading available users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault(); // Prevent form default submission
        setSearchQuery(inputValue); // Update the actual search query
    };

    const getUserIcon = (user) => {
        if (user.permissions?.includes('admin') || user.user_type === 'admin') {
            return <ShieldCheck className="w-4 h-4 text-orange-500" />;
        }
        switch (user.user_type) {
            case 'patient': return <Users className="w-4 h-4 text-blue-500" />;
            case 'doctor': return <UserCheck className="w-4 h-4 text-green-500" />;
            case 'clinic': return <Building2 className="w-4 h-4 text-purple-500" />;
            default: return <Users className="w-4 h-4 text-gray-500" />;
        }
    };

    const getUserRoleDisplay = (user) => {
        if (user.permissions?.includes('admin') || user.user_type === 'admin') return 'מנהל';
        if (user.permissions?.includes('office')) return 'משרד';
        
        const roleMapping = {
            'doctor': 'רופא',
            'patient': 'מטופל',
            'clinic': 'מרפאה'
        };
        return roleMapping[user.user_type] || 'משתמש';
    };

    const handleStartConversation = async () => {
        if (!selectedUser || !initialMessage.trim()) {
            console.log('Missing data for conversation creation');
            return;
        }

        setIsSending(true);
        try {
            console.log('[NewConversation] Creating message from:', currentUser.id, 'to:', selectedUser.id);
            
            // יצירת הודעה ראשונה
            const newMessage = await ChatMessage.create({
                sender_id: currentUser.id,
                receiver_id: selectedUser.id,
                message: initialMessage.trim(),
                read: false,
                message_type: 'text'
            });

            console.log('[NewConversation] Message created:', newMessage.id);

            // יצירת התראה עבור המקבל
            await SystemNotification.create({
                user_id: selectedUser.id,
                title: `הודעה חדשה מ${currentUser.full_name}`,
                message: initialMessage.trim(),
                type: 'chat_message',
                read: false
            });

            console.log('[NewConversation] Notification created for user:', selectedUser.id);

            // קריאה לפונקציה שיוצרת שיחה חדשה
            onConversationCreated(selectedUser, newMessage);
            
            // איפוס הטופס וסגירת המודל
            setSelectedUser(null);
            setInitialMessage('');
            setSearchQuery('');
            setInputValue(''); // Reset input value
            onClose();
        } catch (error) {
            console.error('Error creating conversation:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleClose = () => {
        setSelectedUser(null);
        setInitialMessage('');
        setSearchQuery('');
        setInputValue(''); // Reset input value
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>שיחה חדשה</DialogTitle>
                    <DialogDescription>
                        בחר משתמש כדי להתחיל שיחה חדשה
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <Input
                            placeholder="חפש משתמש..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                         <Button type="submit" size="icon">
                            <Search className="w-4 h-4" />
                        </Button>
                    </form>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>לא נמצאו משתמשים</p>
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                        selectedUser?.id === user.id ? 'bg-blue-50 border border-blue-200' : ''
                                    }`}
                                >
                                    <div className="relative">
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback className="text-xs">{user.full_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                            {getUserIcon(user)}
                                        </div>
                                    </div>
                                    <div className="flex-1 text-right">
                                        <h4 className="font-semibold text-sm">{user.full_name}</h4>
                                        <p className="text-xs text-gray-500">{getUserRoleDisplay(user)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {selectedUser && (
                        <div className="space-y-3">
                            <Label>הודעה ראשונה</Label>
                            <Input
                                placeholder="כתוב הודעה..."
                                value={initialMessage}
                                onChange={(e) => setInitialMessage(e.target.value)}
                                className="text-right"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={handleClose}>
                            ביטול
                        </Button>
                        <Button 
                            onClick={handleStartConversation}
                            disabled={!selectedUser || !initialMessage.trim() || isSending}
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    שולח...
                                </>
                            ) : (
                                'התחל שיחה'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
