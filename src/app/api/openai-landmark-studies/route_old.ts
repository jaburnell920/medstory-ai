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
  console.log('Received request body:', body);

  // Parse the comma-separated query
  const queryParts = query.split(',').map((part: string) => part.trim());

  // If we don't have 7 parts, return the questions
  if (queryParts.length < 7) {
    return NextResponse.json({
      result: `OK, before we get started, please provide the information below. (Please separate your responses with commas):

1. What is your topic? (Please be specific)
2. For studies published after what year? (year)
3. Do you want classic key studies, recent key studies, or both? (classic, recent, both)
4. Do you want to show all studies or a specific number? (all, max number)
5. Do you want a short summary of each study? (y/n)
6. Do you want a short explanation of why each study is a landmark or key study? (y/n)
7. Do you want it to sort studies from most to least impactful? (y/n)`,
    });
  }

  const [topic, year, studyType, numberOfStudies, summary, explanation, sortByImpact] = queryParts;

  const fullPrompt = `
You are a scientific research assistant. Generate landmark studies based on the following criteria:

Topic: ${topic}
Published after year: ${year}
Study type: ${studyType}
Number of studies: ${numberOfStudies}
Include summary: ${summary}
Include explanation: ${explanation}
Sort by impact: ${sortByImpact}

Definition of a landmark study: A landmark scientific or medical study is a highly influential, frequently cited work that introduces a breakthrough, new insight, or critical advancement within its field. Such studies often change understanding, shift clinical practice, or clarify major questions, and are recognized for their long-term relevance and impact on subsequent research and guidelines.

Generate landmark studies using the following format exactly:
N. [Last name first author] [Initials without periods], et al. [Title]. [Journal abbreviation]. [Year];[Volume]:[Page range].
DOI: [DOI if available, otherwise "Not available"]
PMID: [PubMed ID if available, otherwise "Not available"]
Impact Score (0-100): [Score]
[Study description ending with period]

Important formatting rules:
• Number each study with "N." (where N is the study number) followed by a space
• Author initials should NOT have periods (e.g., "JH" not "J.H.")
• Show only the first author if there are more than 2 authors, followed by "et al."
• If exactly 2 authors, show both (no "et al.")
• Title comes after authors
• End the citation with a period
• Include DOI and PMID on separate lines after the citation if available
• Put "Impact Score (0-100):" on a new line after DOI/PMID
• Study description starts on a new line and ends with a period
• Use one space after each period in the citation
• Generate real, well-known landmark studies for the given topic
• Ensure citations are accurate and searchable
• Include accurate DOI and PMID when available for better linking

Only output the formatted studies. Do not include any instructions, questions, or table headers in your response.
`;

  try {
    // Generate topic-specific mock response based on the query
    let mockResult = '';

    if (topic.toLowerCase().includes('hypertension')) {
      mockResult = `1. Veterans Administration Cooperative Study Group on Antihypertensive Agents. Effects of treatment on morbidity in hypertension. JAMA. 1967;202:1028-1034.
DOI: 10.1001/jama.1967.03130240070013
PMID: 6054974
Impact Score (0-100): 98
This landmark study was the first randomized controlled trial to demonstrate that antihypertensive treatment reduces cardiovascular morbidity and mortality. The study showed a 73% reduction in stroke and 50% reduction in heart failure among treated patients. This study established the foundation for modern hypertension treatment guidelines and proved that treating high blood pressure saves lives.

2. SHEP Cooperative Research Group. Prevention of stroke by antihypertensive drug treatment in older persons with isolated systolic hypertension. JAMA. 1991;265:3255-3264.
DOI: 10.1001/jama.1991.03460240051027
PMID: 2057628
Impact Score (0-100): 95
The Systolic Hypertension in the Elderly Program (SHEP) demonstrated that treating isolated systolic hypertension in elderly patients significantly reduces stroke risk by 36% and coronary heart disease by 27%. This study changed clinical practice by establishing that systolic blood pressure is a more important predictor of cardiovascular events than diastolic pressure in older adults.

3. ALLHAT Officers and Coordinators. Major outcomes in high-risk hypertensive patients randomized to angiotensin-converting enzyme inhibitor or calcium channel blocker vs diuretic. JAMA. 2002;288:2981-2997.
DOI: 10.1001/jama.288.23.2981
PMID: 12479763
Impact Score (0-100): 92
The Antihypertensive and Lipid-Lowering Treatment to Prevent Heart Attack Trial (ALLHAT) was the largest hypertension trial ever conducted, involving over 33,000 participants. It demonstrated that thiazide-type diuretics are superior to ACE inhibitors and calcium channel blockers for preventing cardiovascular events, leading to their recommendation as first-line therapy.

4. SPRINT Research Group. A randomized trial of intensive versus standard blood-pressure control. N Engl J Med. 2015;373:2103-2116.
DOI: 10.1056/NEJMoa1511939
PMID: 26551272
Impact Score (0-100): 90
The Systolic Blood Pressure Intervention Trial (SPRINT) showed that intensive blood pressure control (target <120 mmHg) compared to standard control (<140 mmHg) reduced cardiovascular events by 25% and all-cause mortality by 27%. This study led to updated guidelines recommending lower blood pressure targets for high-risk patients.

5. Hansson L, et al. Randomised trial of effects of calcium antagonists compared with diuretics and beta-blockers on cardiovascular morbidity and mortality in hypertension. Lancet. 1999;354:1751-1756.
DOI: 10.1016/S0140-6736(99)03973-7
PMID: 10577635
Impact Score (0-100): 88
The Nordic Diltiazem (NORDIL) study demonstrated that calcium channel blockers are as effective as conventional therapy (diuretics and beta-blockers) in preventing cardiovascular events in hypertensive patients. This study helped establish calcium channel blockers as acceptable first-line antihypertensive agents.`;
    } else if (
      topic.toLowerCase().includes('heart surgery') ||
      topic.toLowerCase().includes('cardiac surgery')
    ) {
      mockResult = `1. Favaloro RG. Saphenous vein autograft replacement of severe segmental coronary artery occlusion. Ann Thorac Surg. 1968;5:334-339.
DOI: 10.1016/S0003-4975(10)65930-6
PMID: 5664041
Impact Score (0-100): 100
René Favaloro's pioneering work established coronary artery bypass grafting (CABG) using saphenous vein grafts as a revolutionary treatment for coronary artery disease. This technique became the gold standard for surgical revascularization and has saved millions of lives worldwide. The study laid the foundation for modern cardiac surgery.

2. Loop FD, et al. Influence of the internal-mammary-artery graft on 10-year survival and other cardiac events. N Engl J Med. 1986;314:1-6.
DOI: 10.1056/NEJM198601023140101
PMID: 3484393
Impact Score (0-100): 96
This landmark study demonstrated the superior long-term patency and survival benefits of using internal mammary artery (IMA) grafts compared to saphenous vein grafts in coronary bypass surgery. The 10-year survival rate was significantly higher with IMA grafts, leading to their widespread adoption as the preferred conduit for CABG.

3. Kirklin JW, et al. Summary of a consensus concerning death and ischemic events after coronary artery bypass grafting. Circulation. 1989;79:I81-I91.
DOI: 10.1161/01.CIR.79.6.I81
PMID: 2720942
Impact Score (0-100): 94
This consensus statement established standardized definitions and reporting criteria for outcomes after cardiac surgery, including operative mortality, perioperative myocardial infarction, and other complications. It became the foundation for quality assessment and comparison of cardiac surgical programs worldwide.

4. Carpentier A. Cardiac valve surgery--the "French correction". J Thorac Cardiovasc Surg. 1983;86:323-337.
DOI: 10.1016/S0022-5223(19)39144-5
PMID: 6887954
Impact Score (0-100): 92
Alain Carpentier's work revolutionized mitral valve repair techniques, introducing the concept of valve reconstruction rather than replacement. His functional approach to mitral valve disease, including annuloplasty rings and leaflet repair techniques, became the standard of care and significantly improved patient outcomes while preserving native valve function.

5. Barnard CN. The operation. A human cardiac transplant: an interim report of a successful operation performed at Groote Schuur Hospital, Cape Town. S Afr Med J. 1967;41:1271-1274.
DOI: Not available
PMID: 4170549
Impact Score (0-100): 90
Christiaan Barnard's report of the first human heart transplant marked a historic milestone in cardiac surgery. While the patient survived only 18 days, this achievement demonstrated the technical feasibility of heart transplantation and paved the way for the development of modern transplant programs that now routinely save lives.`;
    } else {
      // Default generic medical studies
      mockResult = `1. Randomized Controlled Trial Collaborative Group. Randomised trial of intravenous streptokinase, oral aspirin, both, or neither among 17,187 cases of suspected acute myocardial infarction. Lancet. 1988;2:349-360.
DOI: 10.1016/S0140-6736(88)90085-8
PMID: 2899772
Impact Score (0-100): 95
This landmark study demonstrated that both streptokinase and aspirin significantly reduce mortality in acute myocardial infarction, with the combination being most effective. The study showed a 23% reduction in mortality with streptokinase and 23% with aspirin, establishing these as standard treatments for heart attacks.

2. Antithrombotic Trialists' Collaboration. Collaborative meta-analysis of randomised trials of antiplatelet therapy for prevention of death, myocardial infarction, and stroke in high risk patients. BMJ. 2002;324:71-86.
DOI: 10.1136/bmj.324.7329.71
PMID: 11786451
Impact Score (0-100): 92
This comprehensive meta-analysis of over 200 studies involving 135,000 patients established aspirin as the cornerstone of antiplatelet therapy for cardiovascular disease prevention. The study showed that antiplatelet therapy reduces serious vascular events by about 25% in high-risk patients.

3. Scandinavian Simvastatin Survival Study Group. Randomised trial of cholesterol lowering in 4444 patients with coronary heart disease. Lancet. 1994;344:1383-1389.
DOI: 10.1016/S0140-6736(94)90566-5
PMID: 7968073
Impact Score (0-100): 90
The 4S study was the first large randomized trial to demonstrate that lowering cholesterol with statins reduces mortality in patients with coronary heart disease. The study showed a 30% reduction in total mortality and 42% reduction in coronary deaths, establishing statins as essential therapy for secondary prevention.

4. Yusuf S, et al. Effects of an angiotensin-converting-enzyme inhibitor, ramipril, on cardiovascular events in high-risk patients. N Engl J Med. 2000;342:145-153.
DOI: 10.1056/NEJM200001203420301
PMID: 10639539
Impact Score (0-100): 88
The HOPE study demonstrated that ACE inhibitors provide cardiovascular protection beyond their blood pressure-lowering effects. The study showed a 22% reduction in cardiovascular death, myocardial infarction, or stroke in high-risk patients, leading to expanded use of ACE inhibitors for cardiovascular protection.

5. Cannon CP, et al. Intensive versus moderate lipid lowering with statins after acute coronary syndromes. N Engl J Med. 2004;350:1495-1504.
DOI: 10.1056/NEJMoa040583
PMID: 15007110
Impact Score (0-100): 85
The PROVE IT-TIMI 22 study established the concept of intensive statin therapy by showing that high-dose atorvastatin was superior to standard-dose pravastatin in reducing cardiovascular events after acute coronary syndromes. This study led to the "lower is better" approach to LDL cholesterol targets.`;
    }

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
      const searchQuery = `${topic} landmark study clinical trial`;
      const articles = await searchPubMed(searchQuery, 5);
      const result = formatArticlesResponse(articles, topic);
      return NextResponse.json({ result });
    }
  } catch (error) {
    console.error('OpenAI Error:', error);
    return NextResponse.json({ error: 'Failed to generate landmark studies.' }, { status: 500 });
  }
}
