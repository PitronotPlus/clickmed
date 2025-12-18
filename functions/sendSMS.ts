import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        if (!(await base44.auth.isAuthenticated())) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const user = await base44.auth.me();
        const { phone_number, message, sender_name } = await req.json();

        // Validate input
        if (!phone_number || !message) {
            return new Response(JSON.stringify({ 
                error: 'מספר טלפון והודעה נדרשים' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Normalize phone number (remove spaces, hyphens, etc.)
        const cleanPhone = phone_number.replace(/[-\s()]/g, '');
        
        // Check if phone starts with 0 and replace with +972
        const normalizedPhone = cleanPhone.startsWith('0') 
            ? '+972' + cleanPhone.substring(1) 
            : cleanPhone.startsWith('+') 
                ? cleanPhone 
                : '+972' + cleanPhone;

        console.log('Sending SMS:', { phone: normalizedPhone, message: message.substring(0, 50) + '...' });

        // Check user's SMS credits balance - CRITICAL: Filter by user_id for RLS
        let creditBalance;
        try {
            const balances = await base44.entities.CreditBalance.filter({ user_id: user.id });
            creditBalance = balances.length > 0 ? balances[0] : null;
        } catch (error) {
            console.log('No credit balance found, creating one');
            // RLS: user_id automatically enforced by SDK
            creditBalance = await base44.entities.CreditBalance.create({
                user_id: user.id,
                sms_credits: 0,
                email_credits: 0,
                phone_minutes: 0,
                last_updated: new Date().toISOString()
            });
        }

        // Check if user has enough SMS credits (1 SMS = 1 credit)
        if (creditBalance.sms_credits < 1) {
            return new Response(JSON.stringify({ 
                error: 'אין מספיק קרדיטים לשליחת SMS',
                required_credits: 1,
                available_credits: creditBalance.sms_credits
            }), {
                status: 402, // Payment Required
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Send SMS via TextMe API
        const textmeApiKey = Deno.env.get('TextMe_API_KEY');
        if (!textmeApiKey) {
            return new Response(JSON.stringify({ error: 'TextMe API key not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const textmeUrl = 'https://www.textme.co.il/api/send';
        const textmePayload = {
            username: 'clickmed360', // Replace with your TextMe username
            password: textmeApiKey,
            recipient: normalizedPhone,
            message: message,
            sender: sender_name || 'ClickMed360'
        };

        console.log('Calling TextMe API with payload:', { ...textmePayload, password: '[REDACTED]' });

        const textmeResponse = await fetch(textmeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(textmePayload)
        });

        const textmeResult = await textmeResponse.text();
        console.log('TextMe API response:', textmeResult);

        // Check if SMS was sent successfully
        // TextMe typically returns success codes or specific response patterns
        const isSuccess = textmeResponse.ok && !textmeResult.toLowerCase().includes('error');
        
        if (!isSuccess) {
            return new Response(JSON.stringify({ 
                error: 'שליחת SMS נכשלה',
                details: textmeResult
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Deduct 1 SMS credit from user's balance
        await base44.entities.CreditBalance.update(creditBalance.id, {
            sms_credits: creditBalance.sms_credits - 1,
            last_updated: new Date().toISOString()
        });

        // Log the transaction - RLS: user_id enforced
        await base44.entities.CreditTransaction.create({
            user_id: user.id, // CRITICAL: Always use authenticated user's ID
            type: 'usage',
            service: 'sms',
            amount: -1, // Negative for usage
            cost_usd: 0.05, // Approximate cost
            description: `SMS נשלח ל-${normalizedPhone}`,
            metadata: {
                phone_number: normalizedPhone,
                message_preview: message.substring(0, 100),
                textme_response: textmeResult,
                sender_name: sender_name || 'ClickMed360'
            }
        });

        return new Response(JSON.stringify({ 
            success: true,
            message: 'SMS נשלח בהצלחה',
            phone_number: normalizedPhone,
            remaining_credits: creditBalance.sms_credits - 1,
            textme_response: textmeResult
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in sendSMS function:', error);
        return new Response(JSON.stringify({ 
            error: 'שגיאה פנימית בשליחת SMS',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});