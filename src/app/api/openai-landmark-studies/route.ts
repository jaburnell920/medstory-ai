import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// PubMed API integration for real publication data
async function searchPubMed(query: string, maxResults: number = 5): Promise<any[]> {
  try {
    // Step 1: Search for articles
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=relevance`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.esearchresult?.idlist?.length) {
      return [];
    }
    
    const pmids = searchData.esearchresult.idlist;
    
    // Step 2: Get detailed information for each article
    const detailsUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();
    
    const articles = [];
    for (const pmid of pmids) {
      const article = detailsData.result[pmid];
      if (article) {
        articles.push({
          pmid: pmid,
          title: article.title,
          authors: article.authors?.slice(0, 3).map((a: any) => a.name).join(', ') + (article.authors?.length > 3 ? ', et al.' : ''),
          journal: article.fulljournalname,
          year: new Date(article.pubdate).getFullYear(),
          doi: article.elocationid?.startsWith('doi:') ? article.elocationid.replace('doi:', '') : null,
          abstract: article.abstract || ''
        });
      }
    }
    
    return articles;
  } catch (error) {
    console.error('PubMed API Error:', error);
    return [];
  }
}

// Format articles into the expected response format
function formatArticlesResponse(articles: any[], topic: string): string {
  if (!articles.length) {
    return `No landmark studies found for "${topic}". Please try a different search term or check your spelling.`;
  }
  
  return articles.map((article, index) => {
    const doiText = article.doi ? `DOI: ${article.doi}` : '';
    const pmidText = `PMID: ${article.pmid}`;
    
    // Generate a relevance-based impact score (this is a simplified approach)
    const impactScore = Math.max(70, 100 - (index * 5));
    
    return `${index + 1}. ${article.authors} ${article.title} ${article.journal}. ${article.year}.
${doiText}
${pmidText}
Impact Score (0-100): ${impactScore}
${article.abstract.substring(0, 300)}${article.abstract.length > 300 ? '...' : ''}`;
  }).join('\n\n');
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const query = body.query;

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  // Parse the query to extract the topic
  const parts = query.split(',');
  const topic = parts[0] || '';

  // Build the full prompt for OpenAI
  const fullPrompt = `Find 5 landmark medical studies related to "${topic}". For each study, provide:

1. Complete citation with authors, title, journal, year
2. DOI (if available)
3. PMID (if available)
4. Impact Score (0-100) based on significance
5. Brief explanation of why it's considered a landmark study

Format each study as follows:
• Citation on first line with proper formatting
• Put "DOI:" on a new line after citation
• Put "PMID:" on a new line after DOI/PMID
• Put "Impact Score (0-100):" on a new line after DOI/PMID
• Study description starts on a new line and ends with a period
• Use one space after each period in the citation
• Generate real, well-known landmark studies for the given topic
• Ensure citations are accurate and searchable
• Include accurate DOI and PMID when available for better linking

Only output the formatted studies. Do not include any instructions, questions, or table headers in your response.
`;

  try {
    // If OpenAI API key is available, use the actual API
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a scientific research assistant specializing in landmark medical and scientific studies. You provide accurate, well-formatted citations with correct PMIDs and DOIs, and detailed explanations of why studies are considered landmarks in their field.',
          },
          { role: 'user', content: fullPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });
      return NextResponse.json({ result: completion.choices[0].message.content });
    } else {
      // Use PubMed API for real publication data
      // Use just the topic name for better search results
      const searchQuery = topic.trim();
      const articles = await searchPubMed(searchQuery, 5);
      const result = formatArticlesResponse(articles, topic);
      return NextResponse.json({ result });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to generate landmark studies.' }, { status: 500 });
  }
}