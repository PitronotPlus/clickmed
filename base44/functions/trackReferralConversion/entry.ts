import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const authenticatedUser = await base44.auth.me();
        if (!authenticatedUser) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // SECURITY: Log critical operation
        console.log(`🔒 Referral conversion tracked by: ${authenticatedUser.email}`);

        const { userId, serviceCompleted, paymentAmount } = await req.json();

        // SECURITY: Use service role to get user data (admin operation)
        const user = await base44.asServiceRole.entities.User.get(userId);
        
        // SECURITY: Log access to user data
        await base44.asServiceRole.entities.ActivityLog.create({
            user_id: authenticatedUser.id,
            user_name: authenticatedUser.full_name,
            action: 'רישום המרה של הפניה',
            target_entity: 'User',
            target_id: userId,
            details: JSON.stringify({ serviceCompleted, paymentAmount })
        });
        
        if (user.referred_by_clinic_id) {
            // חיפוש רשומת הפניה קיימת
            // SECURITY: Use service role for referral operations
            const existingReferrals = await base44.asServiceRole.entities.Referral.filter({
                clinic_id: user.referred_by_clinic_id,
                patient_id: userId
            });

            let referral;
            if (existingReferrals.length > 0) {
                referral = existingReferrals[0];
            } else {
                // יצירת רשומת הפניה חדשה (במקרה שלא נוצרה בהרשמה)
                referral = await base44.asServiceRole.entities.Referral.create({
                    clinic_id: user.referred_by_clinic_id,
                    patient_id: userId,
                    patient_name: user.full_name,
                    service: 'הרשמה למערכת',
                    status: 'registered',
                    commission: 0,
                    payment_status: 'pending',
                    date: new Date().toISOString().split('T')[0],
                    referral_link: `${req.headers.get('origin')}/Welcome?ref=${user.referred_by_clinic_id}`
                });
            }

            // אם הושלם שירות - עדכון העמלה
            if (serviceCompleted && paymentAmount) {
                // קביעת שיעור עמלה לפי סוג השירות
                let commissionRate = 0.10; // 10% ברירת מחדל
                
                const serviceCommissionRates = {
                    'ייעוץ רפואי': 0.15,
                    'אבחון רפואי': 0.12,
                    'טיפול': 0.10,
                    'בדיקות מעבדה': 0.08,
                    'הדמיה רפואית': 0.10
                };

                if (serviceCommissionRates[serviceCompleted]) {
                    commissionRate = serviceCommissionRates[serviceCompleted];
                }

                const commissionAmount = paymentAmount * commissionRate;

                // עדכון רשומת ההפניה
                await base44.asServiceRole.entities.Referral.update(referral.id, {
                    status: 'completed',
                    service: serviceCompleted,
                    commission: commissionAmount,
                    payment_status: 'pending'
                });

                // שליחת התראה למרפאה
                const clinic = await base44.asServiceRole.entities.User.get(user.referred_by_clinic_id);
                if (clinic) {
                    await base44.asServiceRole.entities.SystemNotification.create({
                        user_id: clinic.id,
                        title: 'עמלה חדשה מהפניה',
                        message: `המטופל ${user.full_name} השלים שירות "${serviceCompleted}" ונצברה עמלה של ₪${commissionAmount}`,
                        type: 'payment',
                        priority: 'medium'
                    });
                }

                return new Response(JSON.stringify({
                    success: true,
                    referralId: referral.id,
                    commissionAmount,
                    commissionRate: commissionRate * 100
                }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                });
            }

            return new Response(JSON.stringify({
                success: true,
                message: 'Referral tracked',
                referralId: referral.id
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({
            success: false,
            message: 'No referral clinic found for user'
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error('Error tracking referral conversion:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});