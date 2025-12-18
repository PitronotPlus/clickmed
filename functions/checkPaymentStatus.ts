import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response('Unauthorized', { status: 401 });
        }
        
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        
        const user = await base44.auth.me();
        if (!user) {
            return new Response('User not found', { status: 404 });
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