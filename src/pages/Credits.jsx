
import React, { useState, useEffect } from "react";
import { CreditBalance } from "@/entities/CreditBalance";
import { CreditTransaction } from "@/entities/CreditTransaction";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CreditCard,
  Phone,
  Mail,
  MessageSquare,
  Wallet,
  Plus,
  Zap,
  Loader2
} from "lucide-react";

import CreditPurchase from "../components/credits/CreditPurchase";
import CreditHistory from "../components/credits/CreditHistory";
import SMSManager from '@/components/credits/SMSManager';
import { checkPaymentStatus } from "@/functions/checkPaymentStatus";

export default function Credits() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      // בדיקת הרשאות אדמין
      const isAdmin = user.permissions?.includes('admin') || user.role === 'admin';
      if (!isAdmin) {
        setAccessDenied(true);
        setIsLoading(false);
        return;
      }

      await loadData();
      await checkForSuccessfulPayment();
    } catch (error) {
      console.error("Error checking access:", error);
      setAccessDenied(true);
      setIsLoading(false);
    }
  };

  const checkForSuccessfulPayment = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');
    
    if (success === 'true' && sessionId) {
      setIsCheckingPayment(true);
      try {
        const response = await checkPaymentStatus({ session_id: sessionId });
        if (response.data.success) {
          window.history.replaceState({}, document.title, window.location.pathname);
          
          if (response.data.transaction) {
            const newTransaction = response.data.transaction;
            setTransactions(prev => {
              if (prev.find(t => t.id === newTransaction.id)) {
                return prev;
              }
              return [newTransaction, ...prev];
            });
          }

          const user = await User.me();
          if (user && user.id) {
            const balanceData = await CreditBalance.filter({ user_id: user.id });
            if (balanceData.length > 0) {
              setBalance(balanceData[0]);
            }
          }

          if (!response.data.already_processed) {
            alert('התשלום בוצע בהצלחה! הקרדיטים נוספו לחשבונך.');
          }
        } else {
          console.error('Payment check failed:', response.data.error);
        }
      } catch (error) {
        console.error('Error checking payment:', error);
      }
      setIsCheckingPayment(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();

      if (!user || !user.id) {
        console.error("User not found or has no ID, stopping credit data load.");
        setIsLoading(false);
        return;
      }

      let balanceData = await CreditBalance.filter({ user_id: user.id });
      let currentBalance;

      if (balanceData.length > 0) {
        currentBalance = balanceData[0];
      } else {
        currentBalance = await CreditBalance.create({
          user_id: user.id,
          sms_credits: 0,
          email_credits: 0,
          phone_minutes: 0,
          phone_numbers: [],
          last_updated: new Date().toISOString()
        });
      }

      setBalance(currentBalance);

      const transactionsData = await CreditTransaction.filter(
        { user_id: user.id },
        "-created_date",
        20
      );
      setTransactions(transactionsData);

    } catch (error) {
      console.error("שגיאה בטעינת נתוני קרדיטים:", error);
    }
    setIsLoading(false);
  };

  const pricing = {
    sms: { price: 0.035, currency: "USD", label: "SMS" },
    email: { price: 0.005, currency: "USD", label: "מייל" },
    phone_call: { price: 0.035, currency: "USD", label: "דקת שיחה" },
    phone_number: { price: 25.00, currency: "USD", label: "מספר טלפון/חודש" }
  };

  if (accessDenied) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <CreditCard className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">גישה נדחתה</h2>
            <p className="text-gray-600">אין לך הרשאות לצפות בדף הקרדיטים.</p>
            <p className="text-sm text-gray-500 mt-2">רק מנהלי מערכת יכולים לגשת לדף זה.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || isCheckingPayment) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
          <p className="text-lg text-gray-700 font-semibold">
            {isCheckingPayment ? 'מאמת תשלום...' : 'טוען נתוני קרדיטים...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-bl from-slate-50 via-teal-50 to-emerald-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="credits" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="credits">
              <Wallet className="w-5 h-5 ml-2" /> קרדיטים
            </TabsTrigger>
            <TabsTrigger value="sms">
              <MessageSquare className="w-5 h-5 ml-2" /> ניהול SMS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credits" className="space-y-6">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                  מרכז קרדיטים
                </h1>
                <p className="text-gray-600">נהל את יתרת הקרדיטים שלך למיילים, SMS ושיחות</p>
              </div>
              <Button
                onClick={() => setShowPurchase(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                <Plus className="w-5 h-5 ml-2" />
                רכישת קרדיטים
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 font-medium mb-1">SMS</p>
                      <p className="text-2xl font-bold text-blue-900">{balance?.sms_credits || 0}</p>
                      <p className="text-sm text-blue-600">קרדיטים זמינים</p>
                    </div>
                    <MessageSquare className="w-12 h-12 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 font-medium mb-1">מיילים</p>
                      <p className="text-2xl font-bold text-green-900">{balance?.email_credits || 0}</p>
                      <p className="text-sm text-green-600">קרדיטים זמינים</p>
                    </div>
                    <Mail className="w-12 h-12 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 font-medium mb-1">שיחות</p>
                      <p className="text-2xl font-bold text-purple-900">{balance?.phone_minutes || 0}</p>
                      <p className="text-sm text-purple-600">דקות זמינות</p>
                    </div>
                    <Phone className="w-12 h-12 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 font-medium mb-1">מספרי טלפון</p>
                      <p className="text-2xl font-bold text-orange-900">{balance?.phone_numbers?.length || 0}</p>
                      <p className="text-sm text-orange-600">מספרים פעילים</p>
                    </div>
                    <Zap className="w-12 h-12 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-emerald-600" />
                  מחירון שירותים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(pricing).map(([service, info]) => (
                    <div key={service} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">{info.label}</h4>
                      <div className="text-2xl font-bold text-emerald-600">
                        ${info.price}
                      </div>
                      <p className="text-sm text-gray-600">
                        {service === 'phone_number' ? 'לחודש' : 'ליחידה'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <CreditHistory transactions={transactions} />

            {showPurchase && (
              <CreditPurchase
                balance={balance}
                onClose={() => setShowPurchase(false)}
                onPurchaseComplete={loadData}
                pricing={pricing}
              />
            )}
          </TabsContent>

          <TabsContent value="sms" className="space-y-6">
            <SMSManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
