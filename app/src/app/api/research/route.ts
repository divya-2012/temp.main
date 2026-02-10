import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, jurisdiction, caseId } = body;

    if (!query) {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    const ragServiceUrl = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

    // Forward request to RAG service
    try {
      const response = await fetch(`${ragServiceUrl}/api/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          jurisdiction: jurisdiction || 'all',
          case_id: caseId || null,
          top_k: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG service returned ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json({ success: true, data });
    } catch {
      // If RAG service is not available, return a demo response
      return NextResponse.json({
        success: true,
        data: {
          answer: `Based on your query about "${query}", here is a summary of relevant legal research findings. Note: This is a demo response as the RAG service is not currently connected.\n\nFor production use, ensure the RAG Python service is running and properly configured.`,
          sources: [
            { title: 'Demo Source 1', reference: 'Demo Reference', relevance: 0.95 },
            { title: 'Demo Source 2', reference: 'Demo Reference', relevance: 0.87 },
          ],
          metadata: {
            query,
            jurisdiction,
            timestamp: new Date().toISOString(),
            model: 'demo',
          },
        },
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
