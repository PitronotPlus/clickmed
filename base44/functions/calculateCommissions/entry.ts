import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This is a system-wide task, so we use the service role.
        // In a real scenario, you'd protect this endpoint (e.g., with a cron secret).
        const allClinics = await base44.asServiceRole.entities.User.filter({ user_type: 'clinic' });
        const allReferrals = await base44.asServiceRole.entities.Referral.list();

        const commissionData = allClinics.map(clinic => {
            const clinicReferrals = allReferrals.filter(ref => ref.clinic_id === clinic.id && ref.status === 'completed');
            const totalCommission = clinicReferrals.reduce((sum, ref) => sum + (ref.commission || 0), 0);
            
            return {
                clinic_id: clinic.id,
                clinic_name: clinic.clinic_name || clinic.full_name,
                completed_referrals: clinicReferrals.length,
                total_commission: totalCommission
            };
        });

        return new Response(JSON.stringify(commissionData), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        console.error("Error in calculateCommissions function:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});