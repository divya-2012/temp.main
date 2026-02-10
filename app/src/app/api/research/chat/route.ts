import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { message, history, jurisdiction, mode } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let aiResponse = '';

    const systemPrompt = mode === 'case-law'
      ? `You are an expert legal research assistant specializing in case law analysis. Provide detailed case citations, holdings, and analysis. Format your responses with proper legal citations. When citing cases, use the format: Case Name, Volume Reporter Page (Court Year).`
      : mode === 'statute'
      ? `You are an expert legal research assistant specializing in statutory analysis. Provide detailed statute references, interpretations, and relevant commentary. Cite specific sections and subsections.`
      : `You are a comprehensive legal research assistant for a law firm. Provide thorough, well-organized legal research with proper citations. Cover relevant case law, statutes, regulations, and practical analysis. Be specific about jurisdictions when applicable.`;

    const jurisdictionNote = jurisdiction && jurisdiction !== 'all'
      ? `\nFocus on ${jurisdiction} law and jurisdiction.`
      : '';

    const fullPrompt = `${systemPrompt}${jurisdictionNote}\n\nPrevious conversation:\n${(history || []).map((h: { role: string; content: string }) => `${h.role}: ${h.content}`).join('\n')}\n\nUser question: ${message}`;

    if (geminiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
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
              { role: 'system', content: systemPrompt + jurisdictionNote },
              ...(history || []).map((h: { role: string; content: string }) => ({
                role: h.role,
                content: h.content,
              })),
              { role: 'user', content: message },
            ],
            temperature: 0.2,
            max_tokens: 4096,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          aiResponse = data.choices?.[0]?.message?.content || '';
        }
      } catch { /* fall through */ }
    }

    if (!aiResponse) {
      aiResponse = getFallbackResearch(message, mode, jurisdiction);
    }

    return NextResponse.json({
      success: true,
      data: { message: aiResponse },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    const status = errMsg === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: errMsg }, { status });
  }
}

function getFallbackResearch(query: string, mode?: string, jurisdiction?: string): string {
  const q = query.toLowerCase();
  const modeLabel = mode === 'case-law' ? 'Case Law' : mode === 'statute' ? 'Statutory' : 'General Legal';

  if (q.includes('negligence') || q.includes('tort')) {
    return `## ${modeLabel} Research: Negligence/Tort Law\n\nNegligence requires establishing four elements:\n\n1. **Duty of Care** - The defendant owed a legal duty to the plaintiff\n2. **Breach** - The defendant breached that duty through action or inaction\n3. **Causation** - The breach was the actual and proximate cause of injury\n4. **Damages** - The plaintiff suffered actual damages\n\n### Key Cases:\n- *Palsgraf v. Long Island Railroad Co.*, 248 N.Y. 339 (1928) - Foreseeability in duty analysis\n- *Donoghue v. Stevenson* [1932] AC 562 - Neighbor principle\n\n${jurisdiction ? `*Note: Research focused on ${jurisdiction} jurisdiction.*` : ''}\n\n*Connect the RAG service for comprehensive, document-aware research.*`;
  }

  if (q.includes('contract') || q.includes('breach')) {
    return `## ${modeLabel} Research: Contract Law\n\nA valid contract requires:\n\n1. **Offer** - Clear terms proposed by offeror\n2. **Acceptance** - Unambiguous acceptance by offeree\n3. **Consideration** - Exchange of value between parties\n4. **Capacity** - Parties must have legal capacity\n5. **Legality** - Purpose must be lawful\n\n### Breach Remedies:\n- **Compensatory Damages** - Direct losses from breach\n- **Consequential Damages** - Foreseeable indirect losses (*Hadley v. Baxendale*, 1854)\n- **Specific Performance** - Court-ordered fulfillment\n- **Rescission** - Contract cancellation\n\n${jurisdiction ? `*Note: Research focused on ${jurisdiction} jurisdiction.*` : ''}\n\n*Connect the RAG service for comprehensive, document-aware research.*`;
  }

  return `## ${modeLabel} Research Results\n\nI've analyzed your query: "${query}"\n\n### Analysis\nThis is a demo response. For comprehensive AI-powered legal research with citations from your firm's document database, ensure the RAG service or AI API keys are configured.\n\n### Recommended Next Steps\n1. Review relevant case law databases (Westlaw, LexisNexis)\n2. Check applicable statutes and regulations\n3. Review firm precedent documents\n4. Consult with senior attorneys on the practice area\n\n${jurisdiction ? `*Jurisdiction: ${jurisdiction}*` : ''}\n\n*Configure Gemini or OpenAI API keys for AI-powered research assistance.*`;
}
