import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

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

        // Create PDF
        const doc = new jsPDF();
        
        // Add Hebrew font support (using default font with RTL)
        doc.setLanguage("he");
        
        let yPosition = 20;

        // Title
        doc.setFontSize(20);
        doc.text(response.questionnaire_title, 105, yPosition, { align: 'center' });
        yPosition += 15;

        // Patient info
        doc.setFontSize(12);
        doc.text(`Patient: ${response.patient_name}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Date: ${new Date(response.completed_date).toLocaleDateString('he-IL')}`, 20, yPosition);
        yPosition += 15;

        // Responses
        doc.setFontSize(11);
        Object.entries(response.responses).forEach(([questionId, answer]) => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }

            doc.setFont(undefined, 'bold');
            doc.text(`Q: ${questionId}`, 20, yPosition);
            yPosition += 7;
            
            doc.setFont(undefined, 'normal');
            const lines = doc.splitTextToSize(`A: ${answer || 'No answer'}`, 170);
            doc.text(lines, 20, yPosition);
            yPosition += (lines.length * 7) + 5;
        });

        // Signature
        if (response.signature) {
            if (yPosition > 220) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.setFont(undefined, 'bold');
            doc.text('Signature:', 20, yPosition);
            yPosition += 10;
            
            try {
                doc.addImage(response.signature, 'PNG', 20, yPosition, 80, 30);
            } catch (e) {
                console.error('Error adding signature to PDF:', e);
            }
        }

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${response.questionnaire_title}_${response.patient_name}.pdf"`
            }
        });

    } catch (error) {
        console.error('Error generating PDF:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});