import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { content, action } = body;

  try {
    switch (action) {
      case 'format-for-gamma':
        // Format content specifically for Gamma.app import
        const formattedContent = formatForGamma(content);
        return NextResponse.json({ 
          success: true, 
          formattedContent,
          instructions: getGammaInstructions()
        });

      case 'generate-gamma-url':
        // Generate a URL that could potentially pre-populate Gamma
        const gammaUrl = generateGammaUrl(content);
        return NextResponse.json({ 
          success: true, 
          url: gammaUrl,
          message: 'URL generated for Gamma.app integration'
        });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Gamma Integration Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process Gamma integration' 
    }, { status: 500 });
  }
}

function formatForGamma(content: string): string {
  // Clean and format content for optimal Gamma.app import
  const lines = content.split('\n');
  const formatted: string[] = [];
  
  let currentSlide = '';
  let isInSlideContent = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and markdown formatting
    if (!trimmed || trimmed.startsWith('##') || trimmed.startsWith('**')) {
      continue;
    }
    
    // Detect slide titles
    if (trimmed.startsWith('### Slide') || trimmed.startsWith('#')) {
      if (currentSlide) {
        formatted.push(currentSlide);
        currentSlide = '';
      }
      
      // Extract slide title
      const title = trimmed.replace(/^### Slide \d+:\s*/, '')
                          .replace(/^#\s*/, '')
                          .replace(/\*\*/g, '');
      currentSlide = `# ${title}\n`;
      isInSlideContent = true;
    }
    // Process slide content
    else if (isInSlideContent && trimmed.startsWith('**Content:**')) {
      const content = trimmed.replace('**Content:**', '').trim();
      if (content && content !== '[Your Presentation Title]') {
        currentSlide += `${content}\n`;
      }
    }
    // Process bullet points
    else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
      currentSlide += `${trimmed}\n`;
    }
    // Process regular content lines
    else if (isInSlideContent && trimmed && !trimmed.startsWith('**')) {
      currentSlide += `${trimmed}\n`;
    }
  }
  
  // Add the last slide
  if (currentSlide) {
    formatted.push(currentSlide);
  }
  
  return formatted.join('\n');
}

function generateGammaUrl(content: string): string {
  // Generate a Gamma.app URL - this is a placeholder as Gamma doesn't support URL parameters
  // In a real implementation, this could potentially use their API if available
  const baseUrl = 'https://gamma.app/';
  
  // For now, just return the base URL with a suggestion to use paste functionality
  return baseUrl;
}

function getGammaInstructions(): string[] {
  return [
    "1. Copy the formatted content to your clipboard",
    "2. Go to gamma.app and sign in to your account",
    "3. Click 'Create New' button",
    "4. Select 'Paste in text' option",
    "5. Paste the copied content",
    "6. Let Gamma's AI generate your presentation",
    "7. Customize the design, colors, and layout as needed",
    "8. Export to PowerPoint or share directly from Gamma"
  ];
}