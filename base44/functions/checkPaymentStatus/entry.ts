import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { session_id } = await req.json();

        // כאן תהיה בדיקת הסטטוס מול Stripe
        // בינתיים נחזיר הצלחה דמה
        const mockTransaction = {
            id: `transaction_${Date.now()}`,
            user_id: user.id,
            type: 'purchase',
            service: 'mixed',
            amount: 100,
            cost_usd: 10.50,
            description: 'רכישת קרדיטים - חבילת בסיס',
            metadata: {
                sms_credits: 50,
                email_credits: 200,
                phone_minutes: 10,
                phone_numbers: 0
            }
        };

        return new Response(JSON.stringify({
            success: true,
            transaction: mockTransaction,
            already_processed: false
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error checking payment status:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});