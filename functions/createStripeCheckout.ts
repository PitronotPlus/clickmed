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