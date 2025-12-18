
import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    try {
        const sender = await base44.auth.me();
        if (!sender) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const { targetUserId, targetRole, messageContent } = await req.json();

        if (!messageContent || messageContent.trim() === "") {
            return new Response(JSON.stringify({ error: 'Message content cannot be empty' }), { status: 400 });
        }

        let actualTargetId = null;
        let recipientName = '';

        if (targetRole === 'representative') {
            const allUsers = await base44.asServiceRole.entities.User.list();
            const admins = allUsers.filter(user => 
                user.role === 'admin' ||
                user.user_type === 'admin' ||
                user.user_type === 'office' || // Added this line to include 'office' user_type
                (user.permissions && (user.permissions.includes('admin') || user.permissions.includes('office')))
            );

            if (admins.length === 0) {
                return new Response(JSON.stringify({ error: 'No support representatives found' }), { status: 404 });
            }
            
            actualTargetId = admins[0].id;
            recipientName = 'נציג מערכת';

            const notificationPromises = admins.map(admin => 
                base44.asServiceRole.entities.SystemNotification.create({
                    user_id: admin.id,
                    title: `פנייה חדשה מ${sender.full_name}`,
                    message: messageContent.substring(0, 100),
                    type: 'chat_message',
                    read: false,
                    priority: 'medium'
                })
            );
            await Promise.all(notificationPromises);

        } else if (targetUserId) {
            let targetUser = null;
            
            try {
                // First attempt: get by ID, assuming it's a valid UUID
                targetUser = await base44.asServiceRole.entities.User.get(targetUserId);
            } catch { 
                console.log(`Could not get user by ID: ${targetUserId}. Will try to find by other means.`);
            }

            if (!targetUser) {
                // Second attempt: find by email, full_name, or ID from a full list.
                const users = await base44.asServiceRole.entities.User.list();
                targetUser = users.find(u => 
                    u.id === targetUserId || 
                    u.email === targetUserId || 
                    u.full_name === targetUserId
                );
            }

            if (!targetUser) {
                return new Response(JSON.stringify({ error: `User with identifier ${targetUserId} not found.` }), { status: 404 });
            }

            actualTargetId = targetUser.id;
            recipientName = targetUser.full_name;

            await base44.asServiceRole.entities.SystemNotification.create({
                user_id: actualTargetId,
                title: `הודעה חדשה מ${sender.full_name}`,
                message: messageContent.substring(0, 100),
                type: 'chat_message',
                read: false,
                priority: 'medium'
            });
        } else {
            return new Response(JSON.stringify({ error: 'No target specified' }), { status: 400 });
        }
        
        const chatMessage = await base44.entities.ChatMessage.create({
            sender_id: sender.id,
            receiver_id: actualTargetId,
            message: messageContent,
            read: false,
            message_type: 'text'
        });

        return new Response(JSON.stringify({ success: true, message: chatMessage, recipientName: recipientName }), { status: 200 });

    } catch (error) {
        console.error('Error in sendChatMessage function:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
