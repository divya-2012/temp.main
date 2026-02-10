import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/server/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { type, title, caseId, content, templateData } = body;

    if (!type || !title) {
      return NextResponse.json({ success: false, error: 'Type and title are required' }, { status: 400 });
    }

    // Get case context if provided
    let caseContext = '';
    let clientName = '';
    if (caseId) {
      const caseData = await prisma.case.findFirst({
        where: { id: caseId, firmId: user.firmId },
        include: { client: true },
      });
      if (caseData) {
        clientName = caseData.client
          ? caseData.client.type === 'COMPANY'
            ? caseData.client.companyName || ''
            : `${caseData.client.firstName} ${caseData.client.lastName}`
          : '';
        caseContext = `Case: ${caseData.caseNumber} - ${caseData.title}\nClient: ${clientName}\nCourt: ${caseData.courtName || 'N/A'}`;
      }
    }

    // If content is provided directly (from document editor), save it
    if (content) {
      const document = await prisma.document.create({
        data: {
          name: `${title}.html`,
          originalName: `${title}.html`,
          mimeType: 'text/html',
          size: Buffer.byteLength(content, 'utf8'),
          storagePath: `generated/${Date.now()}-${title.toLowerCase().replace(/\s+/g, '-')}.html`,
          status: 'ANALYZED',
          tags: ['generated', type],
          caseId: caseId || null,
          firmId: user.firmId,
          uploadedById: user.id,
          aiSummary: `Generated ${type} document: ${title}`,
        },
      });
      return NextResponse.json({ success: true, data: { document, content } }, { status: 201 });
    }

    // Generate document content using AI
    const geminiKey = process.env.GEMINI_API_KEY;
    let generatedContent = '';

    const prompt = `Generate a professional legal document with the following specifications:
Type: ${type}
Title: ${title}
${caseContext ? `Context: ${caseContext}` : ''}
${templateData ? `Additional Details: ${JSON.stringify(templateData)}` : ''}

Generate a complete, professional legal document in HTML format. Include proper formatting, sections, dates, and placeholder fields marked with [PLACEHOLDER] where specific information needs to be filled in. Use professional legal language.`;

    if (geminiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          // Strip markdown code fences if present
          generatedContent = generatedContent.replace(/^```html\n?/, '').replace(/\n?```$/, '');
        }
      } catch { /* fall through */ }
    }

    if (!generatedContent) {
      // Template fallback
      generatedContent = getTemplate(type, title, clientName, templateData || {});
    }

    // Save document
    const document = await prisma.document.create({
      data: {
        name: `${title}.html`,
        originalName: `${title}.html`,
        mimeType: 'text/html',
        size: Buffer.byteLength(generatedContent, 'utf8'),
        storagePath: `generated/${Date.now()}-${title.toLowerCase().replace(/\s+/g, '-')}.html`,
        status: 'ANALYZED',
        tags: ['generated', type],
        caseId: caseId || null,
        firmId: user.firmId,
        uploadedById: user.id,
        aiSummary: `AI-generated ${type} document`,
      },
    });

    return NextResponse.json({
      success: true,
      data: { document, content: generatedContent },
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

function getTemplate(type: string, title: string, clientName: string, data: Record<string, unknown>): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const firm = 'Legal AI & Associates';

  const templates: Record<string, string> = {
    'engagement-letter': `<h1 style="text-align:center;color:#1a365d;">ENGAGEMENT LETTER</h1>
<p style="text-align:center;color:#666;">${date}</p>
<hr/>
<p>Dear ${clientName || '[CLIENT NAME]'},</p>
<p>Thank you for selecting <strong>${firm}</strong> to represent you in the matter of <strong>${title}</strong>. This letter confirms the terms of our engagement.</p>
<h2>1. Scope of Representation</h2>
<p>${data.scope || '[Describe the scope of legal services to be provided]'}</p>
<h2>2. Fees and Billing</h2>
<p>Our fees for this engagement will be billed at the following rates:</p>
<ul><li>Partner: $[RATE]/hour</li><li>Associate: $[RATE]/hour</li><li>Paralegal: $[RATE]/hour</li></ul>
<h2>3. Retainer</h2>
<p>An initial retainer of $[AMOUNT] is required before we commence work.</p>
<h2>4. Communication</h2>
<p>We will keep you informed of all significant developments in your matter.</p>
<h2>5. Termination</h2>
<p>Either party may terminate this engagement upon written notice.</p>
<br/><p>Sincerely,</p><p><strong>${firm}</strong></p>
<br/><br/><p>Agreed and Accepted:</p>
<p>_________________________<br/>Client Signature &amp; Date</p>`,

    'motion': `<h1 style="text-align:center;color:#1a365d;">IN THE [COURT NAME]</h1>
<h2 style="text-align:center;">CASE NO. [CASE NUMBER]</h2>
<hr/>
<table style="width:100%;"><tr><td style="width:45%;vertical-align:top;"><strong>${clientName || '[PLAINTIFF]'}</strong><br/>Plaintiff,</td><td style="width:10%;text-align:center;vertical-align:middle;">v.</td><td style="width:45%;vertical-align:top;"><strong>[DEFENDANT]</strong><br/>Defendant.</td></tr></table>
<hr/>
<h2 style="text-align:center;">${title}</h2>
<p>COMES NOW the ${data.movingParty || 'Plaintiff'}, by and through undersigned counsel, and respectfully moves this Honorable Court for the following relief:</p>
<h3>I. STATEMENT OF FACTS</h3>
<p>[State the relevant facts supporting this motion]</p>
<h3>II. ARGUMENT</h3>
<p>[Present legal arguments with citations to relevant authority]</p>
<h3>III. CONCLUSION</h3>
<p>WHEREFORE, ${data.movingParty || 'Plaintiff'} respectfully requests that this Court grant this motion.</p>
<br/><p>Respectfully submitted,</p><p><strong>${firm}</strong></p>
<p>By: _________________________<br/>Attorney for ${data.movingParty || 'Plaintiff'}</p>
<p>Date: ${date}</p>`,

    'contract': `<h1 style="text-align:center;color:#1a365d;">${title}</h1>
<p style="text-align:center;">Effective Date: ${date}</p>
<hr/>
<p>This Agreement ("Agreement") is entered into as of ${date} by and between:</p>
<p><strong>Party A:</strong> ${clientName || '[PARTY A NAME]'} ("First Party")</p>
<p><strong>Party B:</strong> [PARTY B NAME] ("Second Party")</p>
<h2>1. PURPOSE</h2>
<p>[Describe the purpose and intent of this agreement]</p>
<h2>2. TERMS AND CONDITIONS</h2>
<p>[Specify the terms and conditions]</p>
<h2>3. COMPENSATION</h2>
<p>[Describe payment terms, amounts, and schedule]</p>
<h2>4. TERM AND TERMINATION</h2>
<p>This Agreement shall commence on the Effective Date and continue for a period of [DURATION], unless earlier terminated.</p>
<h2>5. CONFIDENTIALITY</h2>
<p>Both parties agree to maintain the confidentiality of all proprietary information exchanged.</p>
<h2>6. GOVERNING LAW</h2>
<p>This Agreement shall be governed by the laws of [STATE/JURISDICTION].</p>
<br/><table style="width:100%;"><tr><td style="width:50%;"><p>_________________________<br/>Party A Signature<br/>Date: ____________</p></td><td style="width:50%;"><p>_________________________<br/>Party B Signature<br/>Date: ____________</p></td></tr></table>`,

    'memo': `<h1 style="text-align:center;color:#1a365d;">LEGAL MEMORANDUM</h1>
<hr/>
<table style="width:100%;"><tr><td><strong>TO:</strong></td><td>[RECIPIENT]</td></tr><tr><td><strong>FROM:</strong></td><td>${firm}</td></tr><tr><td><strong>DATE:</strong></td><td>${date}</td></tr><tr><td><strong>RE:</strong></td><td>${title}</td></tr></table>
<hr/>
<h2>I. QUESTION PRESENTED</h2>
<p>[State the legal question to be analyzed]</p>
<h2>II. SHORT ANSWER</h2>
<p>[Provide a brief answer]</p>
<h2>III. FACTS</h2>
<p>[Describe relevant facts]</p>
<h2>IV. DISCUSSION</h2>
<p>[Analyze the legal issues with citations]</p>
<h2>V. CONCLUSION</h2>
<p>[Summarize findings and recommendations]</p>`,

    'letter': `<div style="text-align:right;">${date}</div>
<br/>
<p>${clientName || '[RECIPIENT NAME]'}<br/>[ADDRESS LINE 1]<br/>[CITY, STATE ZIP]</p>
<p>Re: ${title}</p>
<p>Dear ${clientName || '[RECIPIENT]'},</p>
<p>[Body of letter]</p>
<br/>
<p>Sincerely,</p>
<br/><br/>
<p><strong>${firm}</strong></p>`,
  };

  return templates[type] || templates['letter'];
}
