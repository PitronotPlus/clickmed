import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    try {
        // בדיקה שהמשתמש מחובר
        if (!(await base44.auth.isAuthenticated())) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { specialty } = await req.json();

        if (!specialty) {
            return new Response(JSON.stringify({ error: 'Specialty is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // שימוש בהרשאות service role לטעינת רופאים
        const allActiveDoctors = await base44.asServiceRole.entities.User.filter({
            user_type: 'doctor',
            status: 'active'
        });

        // סינון רופאים שיש להם את התחום הנבחר
        const matchingDoctors = allActiveDoctors.filter(doctor => {
            return doctor.specialties && 
                   Array.isArray(doctor.specialties) && 
                   doctor.specialties.includes(specialty);
        });

        // החזרת המידע הרלוונטי בלבד (לא כל הפרטים האישיים)
        const safeDoctorData = matchingDoctors.map(doctor => ({
            id: doctor.id,
            display_name: doctor.display_name,
            full_name: doctor.full_name,
            specialties: doctor.specialties,
            avatar: doctor.avatar,
            years_of_experience: doctor.years_of_experience,
            bio: doctor.bio,
            consultation_fee: doctor.consultation_fee,
            accepts_insurance: doctor.accepts_insurance,
            working_locations: doctor.working_locations,
            languages: doctor.languages
        }));

        return new Response(JSON.stringify({ doctors: safeDoctorData }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error fetching doctors:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});