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

        // בדיקת הרשאות אדמין
        const isAdmin = user.permissions?.includes('admin') || user.role === 'admin';
        if (!isAdmin) {
            return new Response('Access denied - Admin only', { status: 403 });
        }

        const { credits, total_usd } = await req.json();

        // כאן תהיה האינטגרציה עם Stripe
        // בינתיים נחזיר URL דמה
        const checkoutUrl = `${req.headers.get('origin')}/Credits?success=true&session_id=mock_session_${Date.now()}`;

        return new Response(JSON.stringify({
            url: checkoutUrl
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error creating checkout:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});