import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/server/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    // Fetch case context
    const caseData = await prisma.case.findFirst({
      where: { id, firmId: user.firmId },
      include: {
        client: true,
        documents: { select: { id: true, name: true, aiSummary: true } },
        timeline: { orderBy: { createdAt: 'desc' }, take: 10 },
        notes: { orderBy: { createdAt: 'desc' }, take: 5 },
        timeEntries: { orderBy: { date: 'desc' }, take: 10 },
      },
    });

    if (!caseData) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
    }

    // Build case context for AI
    const clientName: string = caseData.client
      ? caseData.client.type === 'COMPANY'
        ? caseData.client.companyName || 'Unknown Company'
        : `${caseData.client.firstName} ${caseData.client.lastName}`
      : 'Unknown';

    const docSummaries = caseData.documents
      .filter(d => d.aiSummary)
      .map(d => `- ${d.name}: ${d.aiSummary}`)
      .join('\n');

    const timelineStr = caseData.timeline
      .map(t => `- ${t.title} (${t.createdAt.toISOString().split('T')[0]})`)
      .join('\n');

    const notesStr = caseData.notes
      .map(n => `- ${n.content.substring(0, 200)}`)
      .join('\n');

    const caseContext = `
CASE: ${caseData.caseNumber} - ${caseData.title}
STATUS: ${caseData.status} | PRIORITY: ${caseData.priority}
CLIENT: ${clientName}
PRACTICE AREA: ${caseData.practiceArea || 'N/A'}
COURT: ${caseData.courtName || 'N/A'} (${caseData.courtCaseNo || 'No case #'})
FILING DATE: ${caseData.filingDate ? caseData.filingDate.toISOString().split('T')[0] : 'N/A'}
NEXT HEARING: ${caseData.nextHearingDate ? caseData.nextHearingDate.toISOString().split('T')[0] : 'N/A'}
DESCRIPTION: ${caseData.description || 'None'}

DOCUMENTS:
${docSummaries || 'No document summaries available'}

RECENT TIMELINE:
${timelineStr || 'No timeline events'}

RECENT NOTES:
${notesStr || 'No notes'}
`.trim();

    // Try Gemini API first, then OpenAI, then fallback
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let aiResponse = '';

    if (geminiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are a legal AI assistant for a law firm. You have full context about a specific case. Answer the user's question based on the case context below. Be specific, professional, and helpful. If the information isn't in the context, say so clearly.

CASE CONTEXT:
${caseContext}

USER QUESTION: ${message}`
                }]
              }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048,
              }
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } catch { /* fall through */ }
    }

    if (!aiResponse && openaiKey && openaiKey.startsWith('sk-')) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: `You are a legal AI assistant. Use this case context to answer questions:\n\n${caseContext}` },
              { role: 'user', content: message },
            ],
            temperature: 0.3,
            max_tokens: 2048,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          aiResponse = data.choices?.[0]?.message?.content || '';
        }
      } catch { /* fall through */ }
    }

    if (!aiResponse) {
      // Intelligent fallback that uses the actual case data
      aiResponse = generateFallbackResponse(message, caseData as unknown as Record<string, unknown>, clientName);
    }

    // Log to timeline
    await prisma.caseTimeline.create({
      data: {
        caseId: id,
        userId: user.id,
        eventType: 'OTHER',
        title: 'AI Chat Query',
        description: message.substring(0, 200),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: aiResponse,
        context: {
          caseNumber: caseData.caseNumber,
          documentsCount: caseData.documents.length,
          timelineCount: caseData.timeline.length,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

function generateFallbackResponse(question: string, caseData: Record<string, unknown>, clientName: string): string {
  const q = question.toLowerCase();
  const c = caseData as Record<string, unknown>;
  const status = c.status as string;
  const title = c.title as string;
  const caseNumber = c.caseNumber as string;
  const docs = c.documents as Array<Record<string, unknown>>;
  const timeline = c.timeline as Array<Record<string, unknown>>;
  const timeEntries = c.timeEntries as Array<Record<string, unknown>>;

  if (q.includes('status') || q.includes('how is')) {
    return `Case **${caseNumber}** (${title}) is currently **${status}**. The priority is set to **${c.priority}**. ${c.nextHearingDate ? `The next hearing is scheduled for ${(c.nextHearingDate as Date).toISOString().split('T')[0]}.` : 'No upcoming hearings are scheduled.'}`;
  }
  if (q.includes('document') || q.includes('file')) {
    if (docs.length === 0) return `There are no documents uploaded for case ${caseNumber} yet. You can upload documents from the Documents tab.`;
    return `Case ${caseNumber} has **${docs.length} document(s)**:\n${docs.map((d: Record<string, unknown>) => `- ${d.name}`).join('\n')}\n\nYou can view and manage these from the Documents tab.`;
  }
  if (q.includes('client') || q.includes('who')) {
    return `The client for case ${caseNumber} is **${clientName}**.`;
  }
  if (q.includes('timeline') || q.includes('history') || q.includes('what happened')) {
    if (timeline.length === 0) return `No timeline events recorded for case ${caseNumber} yet.`;
    return `Recent activity on case ${caseNumber}:\n${timeline.map((t: Record<string, unknown>) => `- **${t.title}** (${(t.createdAt as Date).toISOString().split('T')[0]})`).join('\n')}`;
  }
  if (q.includes('billing') || q.includes('cost') || q.includes('hour') || q.includes('time')) {
    if (timeEntries.length === 0) return `No time entries recorded for case ${caseNumber} yet.`;
    const totalHours = timeEntries.reduce((sum: number, e: Record<string, unknown>) => sum + (e.hours as number), 0);
    const totalAmount = timeEntries.reduce((sum: number, e: Record<string, unknown>) => sum + (e.amount as number), 0);
    return `Case ${caseNumber} has **${timeEntries.length} time entries** totaling **${totalHours.toFixed(1)} hours** and **$${totalAmount.toFixed(2)}**.`;
  }
  if (q.includes('summary') || q.includes('brief') || q.includes('overview')) {
    return `**Case Summary: ${caseNumber} - ${title}**\n\n- **Status:** ${status}\n- **Priority:** ${c.priority}\n- **Client:** ${clientName}\n- **Practice Area:** ${c.practiceArea || 'Not specified'}\n- **Court:** ${c.courtName || 'Not specified'}\n- **Documents:** ${docs.length}\n- **Timeline Events:** ${timeline.length}\n- **Time Entries:** ${timeEntries.length}\n\n${c.description || 'No description provided.'}`;
  }
  return `I can help you with case **${caseNumber}** (${title}). Here's what I know:\n\n- **Status:** ${status} | **Priority:** ${c.priority}\n- **Client:** ${clientName}\n- **Documents:** ${docs.length} files\n- **Timeline:** ${timeline.length} events\n\nTry asking about the case status, documents, timeline, billing, or request a summary.`;
}
