import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { responseId } = await req.json();

        if (!responseId) {
            return Response.json({ error: 'Response ID required' }, { status: 400 });
        }

        // Get the questionnaire response
        const response = await base44.entities.QuestionnaireResponse.get(responseId);

        if (!response) {
            return Response.json({ error: 'Response not found' }, { status: 404 });
        }

        // Get patient details
        const patient = await base44.asServiceRole.entities.User.get(response.patient_id);

        if (!patient || !patient.email) {
            return Response.json({ error: 'Patient email not found' }, { status: 400 });
        }

        // Build email content
        let responsesHtml = '';
        Object.entries(response.responses).forEach(([questionId, answer]) => {
            responsesHtml += `
                <div style="margin-bottom: 15px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
                    <strong style="color: #333;">${questionId}</strong><br>
                    <span style="color: #666;">${answer || 'לא נענה'}</span>
                </div>
            `;
        });

        let signatureHtml = '';
        if (response.signature) {
            signatureHtml = `
                <div style="margin-top: 20px; padding: 15px; border-top: 1px solid #ddd;">
                    <strong>חתימה:</strong><br>
                    <img src="${response.signature}" alt="חתימה" style="max-width: 300px; border: 1px solid #ddd; padding: 5px; margin-top: 10px;">
                </div>
            `;
        }

        const emailBody = `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #5932EA;">${response.questionnaire_title}</h2>
                <p style="color: #666;">שלום ${patient.full_name},</p>
                <p style="color: #666;">להלן התשובות ששלחת בשאלון:</p>
                
                <div style="margin: 20px 0;">
                    ${responsesHtml}
                </div>
                
                ${signatureHtml}
                
                <p style="color: #666; margin-top: 30px; font-size: 14px;">
                    תאריך מילוי: ${new Date(response.completed_date).toLocaleDateString('he-IL')}
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">
                    מייל זה נשלח אוטומטית ממערכת Clickmed 360
                </p>
            </div>
        `;

        // Send email
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: patient.email,
            subject: `סיכום שאלון: ${response.questionnaire_title}`,
            body: emailBody
        });

        return Response.json({ 
            success: true,
            message: 'Email sent successfully'
        });

    } catch (error) {
        console.error('Error sending email:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});