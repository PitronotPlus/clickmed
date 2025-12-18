import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  MessageSquare, 
  Mail, 
  Phone, 
  Zap, 
  Plus,
  Minus,
  X
} from "lucide-react";
import { createStripeCheckout } from "@/functions/createStripeCheckout";

export default function CreditPurchase({ balance, onClose, onPurchaseComplete, pricing }) {
  const [selectedCredits, setSelectedCredits] = useState({
    sms: 0,
    email: 0,
    phone_minutes: 0,
    phone_numbers: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCreditChange = (service, change) => {
    setSelectedCredits(prev => ({
      ...prev,
      [service]: Math.max(0, prev[service] + change)
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    total += selectedCredits.sms * pricing.sms.price;
    total += selectedCredits.email * pricing.email.price;
    total += selectedCredits.phone_minutes * pricing.phone_call.price;
    total += selectedCredits.phone_numbers * pricing.phone_number.price;
    return total;
  };

  const handlePurchase = async () => {
    const total = calculateTotal();
    if (total <= 0) {
      alert("בחר לפחות קרדיט אחד לרכישה");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await createStripeCheckout({
        credits: selectedCredits,
        total_usd: total
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("לא התקבל קישור לתשלום");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("שגיאה ביצירת תשלום. נסה שוב.");
    }
    setIsProcessing(false);
  };

  const presetPackages = [
    {
      name: "חבילת בסיס",
      description: "מתאים למשלחי הודעות קטנים",
      credits: { sms: 100, email: 500, phone_minutes: 0, phone_numbers: 0 },
      popular: false
    },
    {
      name: "חבילת עסקים",
      description: "מתאים לעסקים בגודל בינוני",
      credits: { sms: 500, email: 2000, phone_minutes: 60, phone_numbers: 0 },
      popular: true
    },
    {
      name: "חבילת פרימיום",
      description: "מתאים לעסקים גדולים",
      credits: { sms: 2000, email: 10000, phone_minutes: 300, phone_numbers: 1 },
      popular: false
    }
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold">רכישת קרדיטים</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom">בחירה מותאמת</TabsTrigger>
            <TabsTrigger value="packages">חבילות מוכנות</TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SMS */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      <Label className="text-base font-semibold">SMS</Label>
                    </div>
                    <Badge variant="outline">${pricing.sms.price} ליחידה</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCreditChange('sms', -10)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      value={selectedCredits.sms}
                      onChange={(e) => setSelectedCredits(prev => ({ ...prev, sms: parseInt(e.target.value) || 0 }))}
                      className="text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCreditChange('sms', 10)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    עלות: ${(selectedCredits.sms * pricing.sms.price).toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              {/* Email */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-green-500" />
                      <Label className="text-base font-semibold">מיילים</Label>
                    </div>
                    <Badge variant="outline">${pricing.email.price} ליחידה</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCreditChange('email', -50)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      value={selectedCredits.email}
                      onChange={(e) => setSelectedCredits(prev => ({ ...prev, email: parseInt(e.target.value) || 0 }))}
                      className="text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCreditChange('email', 50)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    עלות: ${(selectedCredits.email * pricing.email.price).toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              {/* Phone Minutes */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-purple-500" />
                      <Label className="text-base font-semibold">דקות שיחה</Label>
                    </div>
                    <Badge variant="outline">${pricing.phone_call.price} לדקה</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCreditChange('phone_minutes', -5)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      value={selectedCredits.phone_minutes}
                      onChange={(e) => setSelectedCredits(prev => ({ ...prev, phone_minutes: parseInt(e.target.value) || 0 }))}
                      className="text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCreditChange('phone_minutes', 5)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    עלות: ${(selectedCredits.phone_minutes * pricing.phone_call.price).toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              {/* Phone Numbers */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-orange-500" />
                      <Label className="text-base font-semibold">מספרי טלפון</Label>
                    </div>
                    <Badge variant="outline">${pricing.phone_number.price} לחודש</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCreditChange('phone_numbers', -1)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      value={selectedCredits.phone_numbers}
                      onChange={(e) => setSelectedCredits(prev => ({ ...prev, phone_numbers: parseInt(e.target.value) || 0 }))}
                      className="text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCreditChange('phone_numbers', 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    עלות: ${(selectedCredits.phone_numbers * pricing.phone_number.price).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="packages" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {presetPackages.map((pkg, index) => {
                const packageTotal = 
                  pkg.credits.sms * pricing.sms.price +
                  pkg.credits.email * pricing.email.price +
                  pkg.credits.phone_minutes * pricing.phone_call.price +
                  pkg.credits.phone_numbers * pricing.phone_number.price;

                return (
                  <Card key={index} className={`relative ${pkg.popular ? 'border-emerald-500 border-2' : ''}`}>
                    {pkg.popular && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-emerald-500 text-white">פופולרי</Badge>
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2">{pkg.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
                      
                      <div className="space-y-2 mb-4 text-sm">
                        {pkg.credits.sms > 0 && (
                          <div className="flex justify-between">
                            <span>SMS:</span>
                            <span>{pkg.credits.sms.toLocaleString()}</span>
                          </div>
                        )}
                        {pkg.credits.email > 0 && (
                          <div className="flex justify-between">
                            <span>מיילים:</span>
                            <span>{pkg.credits.email.toLocaleString()}</span>
                          </div>
                        )}
                        {pkg.credits.phone_minutes > 0 && (
                          <div className="flex justify-between">
                            <span>דקות:</span>
                            <span>{pkg.credits.phone_minutes}</span>
                          </div>
                        )}
                        {pkg.credits.phone_numbers > 0 && (
                          <div className="flex justify-between">
                            <span>מספרים:</span>
                            <span>{pkg.credits.phone_numbers}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-center border-t pt-4">
                        <div className="text-2xl font-bold text-emerald-600 mb-2">
                          ${packageTotal.toFixed(2)}
                        </div>
                        <Button
                          onClick={() => setSelectedCredits(pkg.credits)}
                          className="w-full"
                          variant={pkg.popular ? "default" : "outline"}
                        >
                          בחר חבילה
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Total and Purchase */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-semibold">
              סה"כ לתשלום: <span className="text-2xl text-emerald-600">${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              ביטול
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={calculateTotal() <= 0 || isProcessing}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              <CreditCard className="w-4 h-4 ml-2" />
              {isProcessing ? "מעבד..." : "מעבר לתשלום"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}