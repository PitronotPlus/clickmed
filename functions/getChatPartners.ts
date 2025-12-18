import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    try {
        // Must be an authenticated user to use this function
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { userIds } = await req.json();

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return new Response(JSON.stringify({ users: [] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Use service role to bypass row-level security and fetch user details for the chat
        const partners = await base44.asServiceRole.entities.User.filter({
            id: { $in: userIds }
        });

        // Return only safe, non-sensitive data needed for the chat interface
        const safePartnerData = partners.map(user => ({
            id: user.id,
            full_name: user.full_name,
            display_name: user.display_name,
            avatar: user.avatar,
            user_type: user.user_type,
        }));

        return new Response(JSON.stringify({ users: safePartnerData }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error fetching chat partners:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});