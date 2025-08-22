import { NextRequest, NextResponse } from 'next/server';

interface VerifyRequestBody {
  citations: string[];
}

interface VerifyResult {
  citation: string;
  found: boolean;
  pmid?: string;
}

// Helper to extract components from a citation string
function extractComponents(citation: string) {
  // Remove any leading numbering like "1. "
  const clean = citation.replace(/^\d+\.\s*/, '').trim();

  // Author surname (first word)
  const authorMatch = clean.match(/^([A-Za-z-]+)/);
  const author = authorMatch ? authorMatch[1] : '';

  // Year (first 4-digit number)
  const yearMatch = clean.match(/(19\d{2}|20\d{2})/);
  const year = yearMatch ? yearMatch[1] : '';

  // Journal (common journals list to help separate title)
  const journalMatch = clean.match(
    /(N Engl J Med|New England Journal of Medicine|JAMA|Journal of the American Medical Association|Lancet|The Lancet|Circulation|Ann Thorac Surg|Annals of Thoracic Surgery|BMJ|British Medical Journal|J Thorac Cardiovasc Surg|Journal of Thoracic and Cardiovascular Surgery|S Afr Med J|South African Medical Journal|Obesity|Nature|Science|Cell|NEJM)/i
  );
  const journal = journalMatch ? journalMatch[1] : '';

  // Title between first period and journal or year
  let title = '';
  if (journal) {
    const titlePattern = new RegExp(
      `^[^.]+\.\s*(.+?)\s*\.?\s*${journal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
      'i'
    );
    const titleMatch = clean.match(titlePattern);
    title = titleMatch ? titleMatch[1] : '';
  }
  if (!title && year) {
    const titleMatch = clean.match(/^[^.]+\.\s*(.+?)\s*\.?\s*(19\d{2}|20\d{2})/);
    title = titleMatch ? titleMatch[1] : '';
  }
  if (!title) {
    const titleMatch = clean.match(/^[^.]+\.\s*(.+?)\s*\./);
    title = titleMatch ? titleMatch[1] : '';
  }

  // Cleanup title
  title = title
    .replace(/,?\s*et al\.?/gi, '')
    .replace(/[;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { author, year, journal, title, clean };
}

function buildPubMedQuery(citation: string) {
  const { author, year, title } = extractComponents(citation);
  const parts: string[] = [];
  if (title) parts.push(`"${title}"[Title]`);
  if (author) parts.push(`${author}[Author]`);
  if (year) parts.push(`${year}[dp]`);

  if (parts.length === 0) {
    return encodeURIComponent(citation);
  }
  return encodeURIComponent(parts.join(' AND '));
}

async function esearch(term: string): Promise<string | null> {
  const base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
  const url = `${base}?db=pubmed&retmode=json&retmax=1&sort=relevance&term=${term}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const ids: string[] = data?.esearchresult?.idlist || [];
  return ids.length > 0 ? ids[0] : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VerifyRequestBody;
    const citations = Array.isArray(body.citations) ? body.citations : [];
    if (citations.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const lookups = citations.map(async (citation) => {
      try {
        const term = buildPubMedQuery(citation);
        const pmid = await esearch(term);
        const result: VerifyResult = { citation, found: Boolean(pmid) };
        if (pmid) result.pmid = pmid;
        return result;
      } catch {
        return { citation, found: false } as VerifyResult;
      }
    });

    const results = await Promise.all(lookups);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to verify with PubMed' }, { status: 500 });
  }
}
