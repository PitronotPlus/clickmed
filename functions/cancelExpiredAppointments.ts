import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        // Create a base44 client authenticated with the user's token from the request
        const base44 = createClientFromRequest(req);

        // Ensure the user is authenticated before proceeding
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        const now = new Date().toISOString();

        // Find appointments with 'ממתין לאישור' status that are in the past
        // Using asServiceRole to ensure we can query all appointments, not just the user's own
        const expiredAppointments = await base44.asServiceRole.entities.Appointment.filter({
            status: 'ממתין לאישור',
            date: { $lt: now }
        });

        if (expiredAppointments.length === 0) {
            return new Response(JSON.stringify({ message: 'No expired appointments to cancel.' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let cancelledCount = 0;
        const promises = expiredAppointments.map(async (appointment) => {
            try {
                // Update status to 'בוטל' using the service role for broad permissions
                await base44.asServiceRole.entities.Appointment.update(appointment.id, {
                    status: 'בוטל'
                });
                
                // Send a notification to the user
                await base44.asServiceRole.entities.SystemNotification.create({
                   user_id: appointment.user_id,
                   title: 'התור בוטל',
                   message: `התור עם ד"ר ${appointment.doctor} בתאריך ${new Date(appointment.date).toLocaleDateString('he-IL')} בוטל אוטומטית מכיוון שלא אושר על ידי המרפאה בזמן.`,
                   type: 'appointment'
                });

                cancelledCount++;
            } catch (err) {
                console.error(`Failed to process cancellation for appointment ${appointment.id}:`, err.message);
            }
        });

        await Promise.all(promises);

        return new Response(JSON.stringify({ 
            message: `Successfully processed and cancelled ${cancelledCount} expired appointments.` 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in cancelExpiredAppointments function:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});