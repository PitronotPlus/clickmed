import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { CreditBalance } from '@/entities/CreditBalance';
import { CreditTransaction } from '@/entities/CreditTransaction';
import { User } from '@/entities/User';
import { sendSMS } from '@/functions/sendSMS';

export default function SMSManager() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [message, setMessage] = useState('');
    const [senderName, setSenderName] = useState('ClickMed360');
    const [balance, setBalance] = useState(null);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await User.me();
            
            // Load credit balance
            const balances = await CreditBalance.filter({ user_id: user.id });
            if (balances.length > 0) {
                setBalance(balances[0]);
            } else {
                // Create initial balance
                const newBalance = await CreditBalance.create({
                    user_id: user.id,
                    sms_credits: 0,
                    email_credits: 0,
                    phone_minutes: 0,
                    last_updated: new Date().toISOString()
                });
                setBalance(newBalance);
            }

            // Load recent SMS transactions
            const transactions = await CreditTransaction.filter(
                { user_id: user.id, service: 'sms' },
                '-created_date',
                10
            );
            setRecentTransactions(transactions);

        } catch (error) {
            console.error('Error loading SMS data:', error);
            setStatusMessage('שגיאה בטעינת הנתונים');
            setMessageType('error');
        }
    };

    const handleSendSMS = async (e) => {
        e.preventDefault();
        if (!phoneNumber || !message) {
            setStatusMessage('נא למלא מספר טלפון והודעה');
            setMessageType('error');
            return;
        }

        setIsLoading(true);
        setStatusMessage('');

        try {
            const { data, status } = await sendSMS({
                phone_number: phoneNumber,
                message: message,
                sender_name: senderName
            });

            if (status === 200) {
                setStatusMessage(`SMS נשלח בהצלחה ל-${data.phone_number}`);
                setMessageType('success');
                setPhoneNumber('');
                setMessage('');
                
                // Refresh data
                await loadData();
            } else if (status === 402) {
                setStatusMessage(`אין מספיק קרדיטים. נדרשים ${data.required_credits} קרדיטים, זמינים ${data.available_credits}`);
                setMessageType('error');
            } else {
                setStatusMessage(data.error || 'שליחת SMS נכשלה');
                setMessageType('error');
            }

        } catch (error) {
            console.error('SMS sending error:', error);
            setStatusMessage('שגיאה בשליחת SMS');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const getTransactionIcon = (transaction) => {
        if (transaction.type === 'usage') return <Send className="w-4 h-4 text-red-500" />;
        if (transaction.type === 'purchase') return <CheckCircle className="w-4 h-4 text-green-500" />;
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    };

    return (
        <div className="space-y-6">
            {/* SMS Credits Balance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        יתרת קרדיטים לSMS
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6">
                        <div className="text-4xl font-bold text-[#5932EA] mb-2">
                            {balance?.sms_credits || 0}
                        </div>
                        <p className="text-gray-600">קרדיטים זמינים לשליחת SMS</p>
                        {balance?.sms_credits === 0 && (
                            <Badge variant="outline" className="mt-2 text-orange-600 border-orange-600">
                                נדרש רכישת קרדיטים נוספים
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Send SMS Form */}
            <Card>
                <CardHeader>
                    <CardTitle>שליחת SMS</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSendSMS} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">מספר טלפון</label>
                                <Input
                                    type="tel"
                                    placeholder="050-1234567"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="text-right"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">שם השולח (אופציונלי)</label>
                                <Input
                                    type="text"
                                    placeholder="ClickMed360"
                                    value={senderName}
                                    onChange={(e) => setSenderName(e.target.value)}
                                    className="text-right"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                הודעה ({message.length}/160 תווים)
                            </label>
                            <Textarea
                                placeholder="כתוב כאן את ההודעה שברצונך לשלוח..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value.substring(0, 160))}
                                className="min-h-24 text-right"
                            />
                        </div>
                        
                        {statusMessage && (
                            <div className={`p-3 rounded-lg ${
                                messageType === 'success' 
                                    ? 'bg-green-50 text-green-700 border border-green-200' 
                                    : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                                {statusMessage}
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            disabled={isLoading || !balance?.sms_credits || balance?.sms_credits < 1}
                            className="w-full"
                        >
                            {isLoading ? 'שולח...' : 'שלח SMS (1 קרדיט)'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Recent SMS Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>היסטוריית SMS</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentTransactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>עדיין לא נשלחו הודעות SMS</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentTransactions.map((transaction, index) => (
                                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {getTransactionIcon(transaction)}
                                        <div>
                                            <p className="font-medium text-sm">{transaction.description}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(transaction.created_date).toLocaleString('he-IL')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className={`font-bold text-sm ${
                                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            ${transaction.cost_usd?.toFixed(3) || '0.000'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}