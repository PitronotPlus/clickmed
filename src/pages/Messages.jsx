
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from '@/entities/ChatMessage';
import { User } from '@/entities/User';
import { getChatPartners } from '@/functions/getChatPartners';
import { Send, MessageCircle, Plus } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import NewConversationModal from '@/components/messages/NewConversationModal';

const ConversationList = ({ conversations, selectedConversation, onSelect, searchTerm }) => {
    const formatTimestamp = (date) => {
        if (!date) return '';
        if (isToday(date)) return format(date, 'HH:mm');
        if (isYesterday(date)) return 'אתמול';
        return format(date, 'dd/MM/yy');
    };
    
    if (conversations.length === 0) {
        return <div className="text-center text-gray-500 p-4">לא נמצאו שיחות.</div>;
    }

    return (
        <div className="space-y-1">
            {conversations.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(conv => (
                <button
                    key={conv.id}
                    onClick={() => onSelect(conv)}
                    className={`w-full text-right p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedConversation?.id === conv.id ? 'bg-[#5932EA] text-white' : 'hover:bg-gray-100'}`}
                >
                    <Avatar className="w-11 h-11 border-2 border-white">
                        <AvatarImage src={conv.avatar} />
                        <AvatarFallback>{conv.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-sm truncate">{conv.name}</h4>
                            <span className={`text-xs ${selectedConversation?.id === conv.id ? 'text-gray-300' : 'text-gray-500'}`}>
                                {formatTimestamp(conv.lastMessageTime)}
                            </span>
                        </div>
                        <div className="flex justify-between items-start">
                            <p className={`text-xs truncate ${selectedConversation?.id === conv.id ? 'text-gray-200' : 'text-gray-600'}`}>
                                {conv.lastMessage}
                            </p>
                            {conv.unreadCount > 0 && (
                                <Badge className="bg-red-500 text-white w-5 h-5 flex items-center justify-center p-0 text-xs shrink-0">
                                    {conv.unreadCount}
                                </Badge>
                            )}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
};

const ChatWindow = ({ conversation, messages, currentUser, onSendMessage }) => {
    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage);
            setNewMessage('');
        }
    };

    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center text-center text-gray-500">
                <div>
                    <MessageCircle className="w-16 h-16 mx-auto text-gray-300" />
                    <p className="mt-2">בחר שיחה כדי להתחיל</p>
                    <p className="text-sm text-gray-400">או התחל שיחה חדשה</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback>{conversation.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-base font-bold">{conversation.name}</CardTitle>
                        <p className="text-sm text-gray-500">{conversation.role}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                    {messages.map((msg) => {
                        const isFromMe = msg.sender_id === currentUser?.id;
                        return (
                            <div key={msg.id} className={`flex items-end gap-2 ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                                {!isFromMe && (
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={conversation?.avatar} />
                                        <AvatarFallback>{conversation?.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`p-3 rounded-lg max-w-sm ${isFromMe ? 'bg-[#5932EA] text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                    <p className="text-sm">{msg.message}</p>
                                    <p className={`text-xs mt-1 text-right ${isFromMe ? 'text-purple-200' : 'text-gray-500'}`}>
                                        {format(new Date(msg.created_date), 'HH:mm')}
                                    </p>
                                </div>
                                {isFromMe && (
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={currentUser?.avatar} />
                                        <AvatarFallback>{currentUser?.full_name?.[0]}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
            <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Button type="submit" size="icon" className="bg-[#5932EA] hover:bg-[#4a29c1]">
                        <Send className="w-5 h-5" />
                    </Button>
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="הקלד הודעה..."
                        className="flex-1"
                        dir="rtl"
                    />
                </form>
            </div>
        </>
    );
};

export default function MessagesPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadConversationsInitial = useCallback(async (user, currentSelectedConv) => {
        try {
            // Get all messages for user with delays to prevent rate limiting
            const [sent, received] = await Promise.all([
                ChatMessage.filter({ sender_id: user.id }, '-created_date'),
                new Promise(resolve => setTimeout(async () => {
                    const msgs = await ChatMessage.filter({ receiver_id: user.id }, '-created_date');
                    resolve(msgs);
                }, 200))
            ]);

            const allMessages = [...sent, ...received];
            if (allMessages.length === 0) {
                setConversations([]);
                // If there's no selected conversation and no messages, clear messages too
                if (!currentSelectedConv) { // This `currentSelectedConv` is the `selectedConversation` from the `useEffect` closure
                    setMessages([]);
                }
                return;
            }

            // Group messages by conversation partner
            const convMap = new Map();
            allMessages.forEach(msg => {
                const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
                if (!partnerId) return;

                if (!convMap.has(partnerId)) {
                    convMap.set(partnerId, { 
                        messages: [],
                        unreadCount: 0,
                        lastMessage: '',
                        lastMessageTime: new Date(0)
                    });
                }

                const conv = convMap.get(partnerId);
                conv.messages.push(msg);
                
                if (msg.receiver_id === user.id && !msg.read) {
                    conv.unreadCount++;
                }

                const msgTime = new Date(msg.created_date);
                if (msgTime > conv.lastMessageTime) {
                    conv.lastMessageTime = msgTime;
                    conv.lastMessage = msg.message;
                }
            });

            // Get partner details with delay
            const partnerIds = Array.from(convMap.keys());
            if (partnerIds.length === 0) {
                setConversations([]);
                if (!currentSelectedConv) {
                    setMessages([]);
                }
                return;
            }

            await new Promise(resolve => setTimeout(resolve, 300));
            const partnersResponse = await getChatPartners({ userIds: partnerIds });
            const partners = partnersResponse?.data?.users || [];

            // Build conversations list
            const roleMapping = { 'doctor': 'רופא', 'patient': 'מטופל', 'clinic': 'מרפאה', 'admin': 'מנהל' };
            const convList = partners.map(partner => {
                const convData = convMap.get(partner.id);
                // Ensure convData exists, filter out partners without messages
                if (!convData) return null; 
                return {
                    id: partner.id,
                    name: partner.full_name,
                    avatar: partner.avatar,
                    role: roleMapping[partner.user_type] || partner.user_type,
                    lastMessage: convData.lastMessage,
                    lastMessageTime: convData.lastMessageTime,
                    unreadCount: convData.unreadCount,
                    messages: convData.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                };
            }).filter(Boolean).sort((a, b) => b.lastMessageTime - a.lastMessageTime); // Filter out nulls before sorting

            setConversations(convList);

            // Auto-select first conversation only on initial load
            if (convList.length > 0 && !currentSelectedConv) {
                const firstConv = convList[0];
                setSelectedConversation(firstConv);
                
                const formattedMessages = firstConv.messages.map(msg => ({
                    ...msg,
                    isFromMe: msg.sender_id === user.id
                }));
                
                setMessages(formattedMessages);

                // Mark messages as read for first conversation
                if (firstConv.unreadCount > 0) {
                    const unreadIds = firstConv.messages.filter(m => m.receiver_id === user.id && !m.read).map(m => m.id);
                    
                    try {
                        await Promise.all(unreadIds.map((id, index) => 
                            new Promise(resolve => setTimeout(async () => {
                                await ChatMessage.update(id, { read: true });
                                resolve();
                            }, index * 50))
                        ));
                        
                        setConversations(prevConvs => 
                            prevConvs.map(c => 
                                c.id === firstConv.id ? { ...c, unreadCount: 0 } : c
                            )
                        );
                    } catch (error) {
                        console.error("Failed to mark messages as read:", error);
                    }
                }
            }

        } catch (error) {
            console.error('[pages/Messages.js] Error loading conversations:', error);
            if (error.response?.status === 429) {
                console.log('Rate limited, please try refreshing in a moment');
            }
        }
    }, []); // Empty dependencies for useCallback because all state setters are stable and other values are passed as arguments or are stable imports.

    // Load initial data once
    useEffect(() => {
        const loadData = async () => {
            try {
                const impersonatedUserId = sessionStorage.getItem('impersonatedUserId');
                let user;
                if (impersonatedUserId) {
                    user = await User.get(impersonatedUserId);
                } else {
                    user = await User.me();
                }
                setCurrentUser(user);
                await loadConversationsInitial(user, selectedConversation);
            } catch (error) {
                console.error('[pages/Messages.js] Error loading messages:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadData();
    }, [loadConversationsInitial, selectedConversation]); // Added loadConversationsInitial and selectedConversation to dependencies

    // Manual refresh function - separate from initial load
    const handleRefresh = async () => {
        if (isRefreshing || !currentUser) return;
        
        setIsRefreshing(true);
        try {
            const user = currentUser; // Use current user from state

            // Same logic as loadConversations but for refresh
            const [sent, received] = await Promise.all([
                ChatMessage.filter({ sender_id: user.id }, '-created_date'),
                new Promise(resolve => setTimeout(async () => {
                    const msgs = await ChatMessage.filter({ receiver_id: user.id }, '-created_date');
                    resolve(msgs);
                }, 200))
            ]);

            const allMessages = [...sent, ...received];
            if (allMessages.length === 0) {
                setConversations([]);
                if (!selectedConversation) { // Clear messages only if nothing is selected
                    setMessages([]);
                }
                return;
            }

            const convMap = new Map();
            allMessages.forEach(msg => {
                const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
                if (!partnerId) return;

                if (!convMap.has(partnerId)) {
                    convMap.set(partnerId, { 
                        messages: [],
                        unreadCount: 0,
                        lastMessage: '',
                        lastMessageTime: new Date(0)
                    });
                }

                const conv = convMap.get(partnerId);
                conv.messages.push(msg);
                
                if (msg.receiver_id === user.id && !msg.read) {
                    conv.unreadCount++;
                }

                const msgTime = new Date(msg.created_date);
                if (msgTime > conv.lastMessageTime) {
                    conv.lastMessageTime = msgTime;
                    conv.lastMessage = msg.message;
                }
            });

            const partnerIds = Array.from(convMap.keys());
            if (partnerIds.length === 0) {
                setConversations([]);
                if (!selectedConversation) { // Clear messages only if nothing is selected
                    setMessages([]);
                }
                return;
            }

            await new Promise(resolve => setTimeout(resolve, 300));
            const partnersResponse = await getChatPartners({ userIds: partnerIds });
            const partners = partnersResponse?.data?.users || [];

            const roleMapping = { 'doctor': 'רופא', 'patient': 'מטופל', 'clinic': 'מרפאה', 'admin': 'מנהל' };
            const convList = partners.map(partner => {
                const convData = convMap.get(partner.id);
                if (!convData) return null; // Filter out partners without messages
                return {
                    id: partner.id,
                    name: partner.full_name,
                    avatar: partner.avatar,
                    role: roleMapping[partner.user_type] || partner.user_type,
                    lastMessage: convData.lastMessage,
                    lastMessageTime: convData.lastMessageTime,
                    unreadCount: convData.unreadCount,
                    messages: convData.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                };
            }).filter(Boolean).sort((a, b) => b.lastMessageTime - a.lastMessageTime);

            setConversations(convList);

            // If we had a selected conversation, try to update it with new data
            if (selectedConversation) {
                const updatedConv = convList.find(c => c.id === selectedConversation.id);
                if (updatedConv) {
                    setSelectedConversation(updatedConv);
                    const formattedMessages = updatedConv.messages.map(msg => ({
                        ...msg,
                        isFromMe: msg.sender_id === currentUser.id
                    }));
                    setMessages(formattedMessages);
                } else {
                    // If previously selected conversation no longer exists (e.g., all messages deleted)
                    setSelectedConversation(null);
                    setMessages([]);
                }
            } else if (convList.length > 0) {
                // If nothing was selected before, but now there are conversations, select the first one.
                const firstConv = convList[0];
                setSelectedConversation(firstConv);
                
                const formattedMessages = firstConv.messages.map(msg => ({
                    ...msg,
                    isFromMe: user.id === user.id // Should be currentUser.id
                }));
                
                setMessages(formattedMessages);

                // Mark messages as read for first conversation
                if (firstConv.unreadCount > 0) {
                    const unreadIds = firstConv.messages.filter(m => m.receiver_id === user.id && !m.read).map(m => m.id);
                    
                    try {
                        await Promise.all(unreadIds.map((id, index) => 
                            new Promise(resolve => setTimeout(async () => {
                                await ChatMessage.update(id, { read: true });
                                resolve();
                            }, index * 50))
                        ));
                        
                        setConversations(prevConvs => 
                            prevConvs.map(c => 
                                c.id === firstConv.id ? { ...c, unreadCount: 0 } : c
                            )
                        );
                    } catch (error) {
                        console.error("Failed to mark messages as read:", error);
                    }
                }
            }
            
        } catch (error) {
            console.error('Error refreshing conversations:', error);
            if (error.response?.status === 429) {
                console.log('Rate limited, please try refreshing in a moment');
            }
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleSelectConversation = async (conv) => {
        if (!currentUser) return;

        setSelectedConversation(conv);
        
        const formattedMessages = conv.messages.map(msg => ({
            ...msg,
            isFromMe: msg.sender_id === currentUser.id
        }));
        
        setMessages(formattedMessages);

        if (conv.unreadCount > 0) {
            const unreadIds = conv.messages.filter(m => m.receiver_id === currentUser.id && !m.read).map(m => m.id);
            
            if (unreadIds.length > 0) {
                try {
                    await Promise.all(unreadIds.map((id, index) => 
                        new Promise(resolve => setTimeout(async () => {
                            await ChatMessage.update(id, { read: true });
                            resolve();
                        }, index * 50))
                    ));
                    
                    setConversations(prevConvs => 
                        prevConvs.map(c => 
                            c.id === conv.id ? { ...c, unreadCount: 0 } : c
                        )
                    );
                } catch (error) {
                    console.error("Failed to mark messages as read:", error);
                }
            }
        }
    };

    const handleSendMessage = async (messageText) => {
        if (!selectedConversation || !currentUser) return;

        try {
            const newMsg = await ChatMessage.create({
                sender_id: currentUser.id,
                receiver_id: selectedConversation.id,
                message: messageText,
                read: false
            });

            const formattedMsg = {
                ...newMsg,
                isFromMe: true
            };
            setMessages(prev => [...prev, formattedMsg]);

            setConversations(prevConvs => prevConvs.map(c => {
                if (c.id === selectedConversation.id) {
                    return {
                        ...c,
                        lastMessage: messageText,
                        lastMessageTime: new Date(),
                        messages: [...c.messages, newMsg] // Add the new message to the conversation's message array
                    }
                }
                return c;
            }).sort((a, b) => b.lastMessageTime - a.lastMessageTime));

        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleNewConversation = async () => {
        setIsModalOpen(false);
        // Refresh conversations after creating new one, and attempt to select the new one if possible
        if (currentUser) {
            await handleRefresh(); // Use handleRefresh to re-fetch and update current state properly
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-64">טוען הודעות...</div>;
    }

    const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

    return (
        <div className="h-[calc(100vh-200px)] flex gap-6" dir="rtl">
            <Card className="w-1/3 flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-3">
                        <CardTitle>הודעות</CardTitle>
                        {totalUnread > 0 && (
                            <Badge className="bg-red-500 text-white">
                                {totalUnread}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={handleRefresh} 
                            size="sm" 
                            variant="outline"
                            disabled={isRefreshing}
                            className="text-xs"
                        >
                            {isRefreshing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    מרענן...
                                </>
                            ) : (
                                '🔄 בדוק הודעות'
                            )}
                        </Button>
                        <Button onClick={() => setIsModalOpen(true)} size="icon" variant="outline">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex-1 overflow-hidden flex flex-col">
                    <div className="mb-4">
                        <Input
                            type="search"
                            placeholder="חיפוש שיחות..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                            dir="rtl"
                        />
                    </div>
                    <div className="overflow-y-auto flex-1">
                        <ConversationList 
                            conversations={conversations}
                            selectedConversation={selectedConversation}
                            onSelect={handleSelectConversation}
                            searchTerm={searchTerm}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="flex-1 flex flex-col">
                <ChatWindow 
                    conversation={selectedConversation}
                    messages={messages}
                    currentUser={currentUser}
                    onSendMessage={handleSendMessage}
                />
            </Card>

            {isModalOpen && (
                <NewConversationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConversationCreated={handleNewConversation}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
}
