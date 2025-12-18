import { createClient } from 'npm:@base44/sdk@0.1.0';
import JSZip from 'npm:jszip@3.10.1';

// Initialize the client for a server-side environment
const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
    auth: {
        storage: null, // Use in-memory storage, not browser's localStorage
        autoRefreshToken: false,
        persistSession: false
    }
});

// List of all entities to back up
const ENTITIES_TO_BACKUP = [
    'User', 
    'Appointment', 
    'Activity', 
    'Request', 
    'Clinic', 
    'Referral', 
    'MedicalRecord', 
    'TestResult', 
    'Medication', 
    'DoctorNote', 
    'MedicalReferral', 
    'MedicalDocument',
    'BackupLog',
    'Specialty'
];

Deno.serve(async (req) => {
    try {
        // Step 1: Authenticate the user from the request header.
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        
        const { data: user, error: authError } = await base44.auth.me();
        
        if (authError || !user) {
            const errorDetails = authError ? authError.message : 'User could not be authenticated on the server.';
            return new Response(JSON.stringify({ 
                error: 'Forbidden: Authentication failed.', 
                details: errorDetails 
            }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        // Step 2: Verify user is an admin.
        // The user object from auth.me() contains roles and permissions.
        const isAdmin = user.role === 'admin' || (user.permissions && user.permissions.includes('admin'));
        if (!isAdmin) {
            return new Response(JSON.stringify({ error: 'Forbidden: Admin access required.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        const zip = new JSZip();
        const dataFolder = zip.folder("data");
        const filesFolder = zip.folder("files");
        let totalFileCount = 0;

        // Step 3: Backup all entity data
        for (const entityName of ENTITIES_TO_BACKUP) {
            try {
                const { data: records } = await base44.entities[entityName].filter({});
                if (records && records.length > 0) {
                    dataFolder.file(`${entityName}.json`, JSON.stringify(records, null, 2));
                }
            } catch (e) {
                console.error(`Could not back up entity ${entityName}:`, e.message);
            }
        }

        // Step 4: Backup all uploaded files from MedicalDocument
        const { data: documents } = await base44.entities.MedicalDocument.filter({});
        if (documents && documents.length > 0) {
            for (const doc of documents) {
                if (doc.file_url) {
                    try {
                        const fileResponse = await fetch(doc.file_url);
                        if (fileResponse.ok) {
                            const fileData = await fileResponse.arrayBuffer();
                            const fileName = `${doc.id}_${doc.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
                            filesFolder.file(fileName, fileData);
                            totalFileCount++;
                        }
                    } catch (fetchError) {
                        console.error(`Failed to fetch file: ${doc.file_url}`, fetchError);
                    }
                }
            }
        }

        // Step 5: Generate the zip file
        const zipContent = await zip.generateAsync({ type: "uint8array" });

        // Step 6: Log the backup operation
        await base44.entities.BackupLog.create({
            backup_date: new Date().toISOString(),
            generated_by: user.full_name || user.email,
            file_size_kb: Math.round(zipContent.length / 1024),
            file_count: totalFileCount,
            status: 'הושלם'
        });

        // Step 7: Return the zip file for download
        const backupFileName = `clickmed_backup_${new Date().toISOString().split('T')[0]}.zip`;
        return new Response(zipContent, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${backupFileName}"`
            }
        });

    } catch (error) {
        console.error("Backup process failed unexpectedly:", error);
        
        try {
            await base44.entities.BackupLog.create({
                backup_date: new Date().toISOString(),
                generated_by: 'System',
                status: 'נכשל',
                notes: error.message
            });
        } catch (logError) {
            console.error("Failed to log backup failure:", logError);
        }
        
        return new Response(JSON.stringify({ error: 'Backup process failed', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});