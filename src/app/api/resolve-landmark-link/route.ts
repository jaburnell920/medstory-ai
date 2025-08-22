import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeTitle(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function tokenize(s: string) {
  return new Set(normalizeTitle(s).split(' ').filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>) {
  const inter = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size ? inter.size / union.size : 0;
}

function parseCitation(citation: string) {
  const clean = citation.replace(/\s+/g, ' ').trim();
  const firstDot = clean.indexOf('.');
  const authorsText = firstDot !== -1 ? clean.slice(0, firstDot).trim() : '';
  const rest = firstDot !== -1 ? clean.slice(firstDot + 1).trim() : clean;
  const secondDot = rest.indexOf('.');
  const title = secondDot !== -1 ? rest.slice(0, secondDot).trim() : '';

  const yearMatch = clean.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : '';

  const authorPieces = authorsText.split(',').map((s) => s.trim());
  const authorLastNames = authorPieces
    .map((piece) => (piece.match(/^[A-Za-zÀ-ÖØ-öø-ÿ'’-]+/u) || [''])[0])
    .filter((x) => x && x.toLowerCase() !== 'et' && x.toLowerCase() !== 'al');

  return { title, year, authorLastNames };
}

function buildPubMedQuery(parsed: { title: string; year?: string; authorLastNames: string[] }) {
  const parts: string[] = [];
  if (parsed.title) parts.push(`"${parsed.title}"[Title]`);
  const auths = parsed.authorLastNames.slice(0, 3);
  if (auths.length) {
    const authClause = auths.map((a) => `${a}[Author]`).join(' OR ');
    parts.push(`(${authClause})`);
  }
  if (parsed.year) parts.push(`${parsed.year}[dp]`);
  return parts.join(' AND ');
}

async function pubmedSearchIds(term: string, retmax = 20): Promise<string[]> {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmax=${retmax}&retmode=json&sort=relevance&term=${encodeURIComponent(
    term
  )}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'medstory-ai/resolve-landmark-link (contact: support@example.com)' } });
  if (!res.ok) return [];
  const json = await res.json();
  const ids = json?.esearchresult?.idlist || [];
  return Array.isArray(ids) ? ids : [];
}

function buildCandidateTerms(parsed: { title: string; year?: string; authorLastNames: string[] }, citation: string): string[] {
  const terms: string[] = [];
  const titlePhrase = parsed.title ? `"${parsed.title}"[Title]` : '';
  const tiabPhrase = parsed.title ? `"${parsed.title}"[Title/Abstract]` : '';
  const authors = parsed.authorLastNames.slice(0, 3);
  const authorClause = authors.length ? `(${authors.map((a) => `${a}[Author]`).join(' OR ')})` : '';
  const yearClause = parsed.year ? `${parsed.year}[dp]` : '';

  const join = (...parts: string[]) => parts.filter(Boolean).join(' AND ');

  if (titlePhrase && authorClause && yearClause) terms.push(join(titlePhrase, authorClause, yearClause));
  if (titlePhrase && authorClause) terms.push(join(titlePhrase, authorClause));
  if (titlePhrase && yearClause) terms.push(join(titlePhrase, yearClause));
  if (titlePhrase) terms.push(join(titlePhrase));
  if (tiabPhrase && authors[0]) terms.push(join(tiabPhrase, `${authors[0]}[Author]`));

  // Very lenient fallback to let PubMed apply ATM
  const loose = [parsed.title, authors[0] || '', parsed.year || ''].filter(Boolean).join(' ');
  if (loose) terms.push(loose);

  // Final fallback to the raw citation text
  terms.push(citation);

  return Array.from(new Set(terms));
}

type CrossrefAuthor = { family?: string; given?: string };

type CrossrefWork = {
  DOI?: string;
  title?: string[];
  author?: CrossrefAuthor[];
  issued?: { 'date-parts'?: number[][] };
  URL?: string;
  'container-title'?: string[];
};

type CrossrefResponse = { message?: { items?: CrossrefWork[] } };

async function crossrefSearch(parsed: { title: string; year?: string; authorLastNames: string[] }) {
  if (!parsed.title) return [] as Array<{ doi: string; title: string; authors: string[]; year?: string; url?: string }>;
  const params = new URLSearchParams();
  params.set('query.title', parsed.title);
  if (parsed.authorLastNames[0]) params.set('query.author', parsed.authorLastNames[0]);
  params.set('rows', '20');
  params.set('select', 'DOI,title,author,issued,URL,container-title');
  params.set('sort', 'relevance');
  if (parsed.year) {
    const y = parsed.year;
    params.set('filter', `from-pub-date:${y}-01-01,until-pub-date:${y}-12-31`);
  }
  const url = `https://api.crossref.org/works?${params.toString()}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'medstory-ai/resolve-landmark-link (mailto:support@example.com)' } });
  if (!res.ok) return [];
  const data = (await res.json()) as CrossrefResponse;
  const items = data?.message?.items || [];
  return items.map((w) => ({
    doi: w.DOI || '',
    title: (w.title && w.title[0]) || '',
    authors: (w.author || []).map((a) => a.family || '').filter(Boolean),
    year: String(w.issued?.['date-parts']?.[0]?.[0] || ''),
    url: w.URL,
  }));
}

async function pubmedIdFromDoi(doi: string): Promise<string | null> {
  const fields = ['doi', 'aid'];
  for (const field of fields) {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&term=${encodeURIComponent(`${doi}[${field}]`)}&retmax=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'medstory-ai/resolve-landmark-link (contact: support@example.com)' } });
    if (!res.ok) continue;
    const json = await res.json();
    const id = json?.esearchresult?.idlist?.[0];
    if (id) return String(id);
  }
  return null;
}

type AuthorSummary = { name?: string };

type ArticleId = { idtype?: string; value?: string };

type ESummaryItem = {
  uid?: string;
  articleids?: ArticleId[];
  title?: string;
  authors?: AuthorSummary[];
  pubdate?: string;
};

type ESummaryResponse = { result?: { uids?: string[]; [uid: string]: ESummaryItem | string[] | undefined } };

type PubMedSummary = { uid: string; title: string; authors: string[]; pubdate: string };

async function pubmedSummary(ids: string[]): Promise<PubMedSummary[]> {
  if (!ids.length) return [];
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'medstory-ai/resolve-landmark-link (contact: support@example.com)' } });
  if (!res.ok) return [];
  const json = (await res.json()) as ESummaryResponse;
  const result = json?.result || {};
  const uids: string[] = (result?.uids as string[]) || ids;
  return uids
    .map((uid) => result[uid] as ESummaryItem | undefined)
    .filter((x): x is ESummaryItem => Boolean(x))
    .map((item) => ({
      uid: String(item.uid || item.articleids?.find?.((a) => a.idtype === 'pubmed')?.value || ''),
      title: item.title || '',
      authors: (item.authors || []).map((a) => a.name || '').filter(Boolean),
      pubdate: item.pubdate || '',
    }));
}

function scoreCandidate(parsed: { title: string; authorLastNames: string[] }, cand: { title: string; authors: string[] }) {
  const titleScore = jaccard(tokenize(parsed.title), tokenize(cand.title));
  const candLasts = cand.authors
    .map((n) => (n.match(/^[A-Za-zÀ-ÖØ-öø-ÿ'’-]+/u) || [''])[0]?.toLowerCase())
    .filter(Boolean) as string[];
  const wanted = parsed.authorLastNames.map((a) => a.toLowerCase());
  const authorOverlap = wanted.filter((w) => candLasts.includes(w)).length;
  const authorScore = wanted.length ? authorOverlap / Math.min(wanted.length, 3) : 0;
  return 0.7 * titleScore + 0.3 * authorScore;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  const citation = q.trim();
  if (!citation) {
    return NextResponse.json({ error: 'Missing q' }, { status: 400 });
  }

  const parsed = parseCitation(citation);
  if (!parsed.title) {
    const fallback = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(citation)}`;
    return NextResponse.redirect(fallback);
  }

  // 1) Try Crossref (DOI first)
  try {
    const works = await crossrefSearch(parsed);
    let bestDoi: string | null = null;
    let bestScore = 0;
    for (const w of works) {
      const score = scoreCandidate(parsed, { title: w.title, authors: w.authors });
      if (score > bestScore) {
        bestScore = score;
        bestDoi = w.doi || null;
      }
    }
    if (bestDoi && bestScore >= 0.55) {
      const pmid = await pubmedIdFromDoi(bestDoi);
      if (pmid) return NextResponse.redirect(`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`);
      return NextResponse.redirect(`https://doi.org/${bestDoi}`);
    }
  } catch {
    // ignore and continue
  }

  // 2) Try PubMed fielded queries
  const primaryTerm = buildPubMedQuery(parsed);
  const candidateTerms = buildCandidateTerms(parsed, citation);

  for (const term of [primaryTerm, ...candidateTerms]) {
    try {
      const ids = await pubmedSearchIds(term, 25);
      const summaries = await pubmedSummary(ids);

      let best: PubMedSummary | null = null;
      let bestScore = 0;
      for (const s of summaries) {
        const score = scoreCandidate(parsed, s);
        if (score > bestScore) {
          best = s;
          bestScore = score;
        }
      }

      if (best && best.uid && bestScore >= 0.55) {
        return NextResponse.redirect(`https://pubmed.ncbi.nlm.nih.gov/${best.uid}/`);
      }
    } catch {
      // Continue to next term
    }
  }

  // 3) Fallback: PubMed search
  const fallbackSearch = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(candidateTerms[0] || primaryTerm || citation)}`;
  return NextResponse.redirect(fallbackSearch);
}
