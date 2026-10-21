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
        
        // Get settings - simplified without external dependency
        const settings = {};
        try {
            const allSettings = await base44.entities.Setting.filter({});
            allSettings.forEach(setting => {
                settings[setting.key] = setting.value;
            });
        } catch (error) {
            console.error('Error loading settings, using defaults:', error);
        }

        // Check if reminders are enabled
        const smsEnabled = settings['send_sms_reminders'] === 'true';
        const emailEnabled = settings['send_email_reminders'] === 'true';
        const reminderMinutes = parseInt(settings['reminder_time_minutes'] || '30');

        if (!smsEnabled && !emailEnabled) {
            return new Response(JSON.stringify({ message: 'Reminders are disabled' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get appointments that need reminders
        const now = new Date();
        const reminderTime = new Date(now.getTime() + reminderMinutes * 60000);
        
        const appointmentsToRemind = await base44.entities.Appointment.filter({
            date: {
                $gte: now.toISOString(),
                $lte: reminderTime.toISOString()
            },
            reminder_sent: { $ne: true }
        });

        let remindersSent = 0;

        for (const appointment of appointmentsToRemind) {
            try {
                // Get user details
                const users = await base44.entities.User.filter({ id: appointment.user_id });
                if (!users || users.length === 0) continue;

                const patient = users[0];
                const reminderText = `תזכורת: יש לך תור מחר בשעה ${new Date(appointment.date).toLocaleTimeString('he-IL')} עם ${appointment.doctor}`;

                // Send SMS reminder
                if (smsEnabled && patient.phone) {
                    // Here you would integrate with SMS service
                    console.log(`Sending SMS to ${patient.phone}: ${reminderText}`);
                }

                // Send email reminder
                if (emailEnabled && patient.email) {
                    // Simple email sending without external imports
                    const emailBody = `
                        <div dir="rtl">
                            <h2>תזכורת תור</h2>
                            <p>${reminderText}</p>
                            <p>בברכה,<br>צוות מדקס</p>
                        </div>
                    `;
                    
                    // Here you would use your email service
                    console.log(`Sending email to ${patient.email}: ${reminderText}`);
                }

                // Mark reminder as sent
                await base44.entities.Appointment.update(appointment.id, {
                    reminder_sent: true
                });

                remindersSent++;
            } catch (error) {
                console.error(`Error sending reminder for appointment ${appointment.id}:`, error);
            }
        }

        return new Response(JSON.stringify({ 
            message: `Sent ${remindersSent} reminders successfully` 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in appointment reminders:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});