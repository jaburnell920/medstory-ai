import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

// Configuration for Beautiful.ai
const BEAUTIFUL_AI_URL = 'https://www.beautiful.ai';
const BEAUTIFUL_AI_LOGIN_URL = 'https://www.beautiful.ai/login';
const BEAUTIFUL_AI_CREATE_URL = 'https://www.beautiful.ai/dashboard';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { outline, email, password } = body;

  if (!outline) {
    return NextResponse.json({ error: 'Presentation outline is required' }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Beautiful.ai credentials (email and password) are required' },
      { status: 400 }
    );
  }

  try {
    console.log('Starting Beautiful.ai integration process...');
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    
    // Create a new page with extended timeout
    const page = await browser.newPage();
    
    // Set default navigation timeout to 2 minutes
    page.setDefaultNavigationTimeout(120000);
    
    // Enable console logging from the browser
    page.on('console', (msg) => console.log('Browser console:', msg.text()));

    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to Beautiful.ai login page
    console.log('Navigating to Beautiful.ai login page...');
    await page.goto(BEAUTIFUL_AI_LOGIN_URL, { waitUntil: 'networkidle2' });

    // Login to Beautiful.ai
    console.log('Logging in to Beautiful.ai...');
    await page.type('input[type="email"]', email);
    await page.type('input[type="password"]', password);
    
    try {
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
      ]);
      console.log('Login successful');
    } catch (error) {
      console.error('Login failed:', error.message);
      throw new Error(`Failed to log in to Beautiful.ai: ${error.message}`);
    }

    // Navigate to dashboard
    console.log('Navigating to Beautiful.ai dashboard...');
    await page.goto(BEAUTIFUL_AI_CREATE_URL, { waitUntil: 'networkidle2' });
    console.log('Dashboard loaded successfully');

    // Look for the "Create with AI" button (using a more reliable approach)
    console.log('Looking for "Create with AI" button...');
    try {
      await page.waitForFunction(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(button => 
          button.textContent && button.textContent.includes('Create with AI')
        );
      }, { timeout: 30000 });
      
      // Click the "Create with AI" button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const createButton = buttons.find(button => 
          button.textContent && button.textContent.includes('Create with AI')
        );
        if (createButton) {
          console.log('Found "Create with AI" button, clicking...');
          createButton.click();
          return true;
        }
        return false;
      });
      console.log('"Create with AI" button clicked');
    } catch (error) {
      console.error('Failed to find or click "Create with AI" button:', error.message);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: '/tmp/beautiful-ai-dashboard.png' });
      console.log('Screenshot saved to /tmp/beautiful-ai-dashboard.png');
      
      throw new Error(`Failed to find "Create with AI" button: ${error.message}`);
    }

    // Wait for the AI input field to appear (using a more reliable approach)
    console.log('Waiting for AI input field...');
    try {
      await page.waitForFunction(() => {
        const textareas = Array.from(document.querySelectorAll('textarea'));
        return textareas.find(textarea => 
          textarea.placeholder && textarea.placeholder.toLowerCase().includes('presentation')
        );
      }, { timeout: 30000 });
      console.log('AI input field found');
      
      // Format the outline for Beautiful.ai
      const formattedOutline = formatOutlineForBeautifulAi(outline);
      console.log('Formatted outline for Beautiful.ai (first 100 chars):', formattedOutline.substring(0, 100) + '...');

      // Input the outline into the AI prompt field
      const inputSuccess = await page.evaluate((text) => {
        const textareas = Array.from(document.querySelectorAll('textarea'));
        const promptTextarea = textareas.find(textarea => 
          textarea.placeholder && textarea.placeholder.toLowerCase().includes('presentation')
        );
        if (promptTextarea) {
          promptTextarea.value = text;
          // Trigger input event to ensure Beautiful.ai recognizes the input
          const event = new Event('input', { bubbles: true });
          promptTextarea.dispatchEvent(event);
          return true;
        }
        return false;
      }, formattedOutline);
      
      if (inputSuccess) {
        console.log('Successfully input outline into AI prompt field');
      } else {
        throw new Error('Failed to input outline into AI prompt field');
      }
    } catch (error) {
      console.error('Error with AI input field:', error.message);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: '/tmp/beautiful-ai-input.png' });
      console.log('Screenshot saved to /tmp/beautiful-ai-input.png');
      
      throw new Error(`Failed to input outline: ${error.message}`);
    }

    // Click on "Generate Presentation" button
    console.log('Looking for "Generate Presentation" button...');
    try {
      await page.waitForFunction(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(button => 
          button.textContent && button.textContent.includes('Generate Presentation')
        );
      }, { timeout: 30000 });
      
      const buttonClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const generateButton = buttons.find(button => 
          button.textContent && button.textContent.includes('Generate Presentation')
        );
        if (generateButton) {
          generateButton.click();
          return true;
        }
        return false;
      });
      
      if (buttonClicked) {
        console.log('"Generate Presentation" button clicked');
      } else {
        throw new Error('Failed to click "Generate Presentation" button');
      }
    } catch (error) {
      console.error('Error with "Generate Presentation" button:', error.message);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: '/tmp/beautiful-ai-generate.png' });
      console.log('Screenshot saved to /tmp/beautiful-ai-generate.png');
      
      throw new Error(`Failed to generate presentation: ${error.message}`);
    }

    // Wait for the presentation to be generated and the "Create Presentation" button to appear
    console.log('Waiting for AI to generate presentation (this may take a few minutes)...');
    try {
      await page.waitForFunction(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(button => 
          button.textContent && button.textContent.includes('Create Presentation')
        );
      }, { timeout: 180000 }); // Increase timeout to 3 minutes as AI generation might take time
      
      console.log('"Create Presentation" button found, clicking...');
      
      const buttonClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const createButton = buttons.find(button => 
          button.textContent && button.textContent.includes('Create Presentation')
        );
        if (createButton) {
          createButton.click();
          return true;
        }
        return false;
      });
      
      if (buttonClicked) {
        console.log('"Create Presentation" button clicked');
      } else {
        throw new Error('Failed to click "Create Presentation" button');
      }
    } catch (error) {
      console.error('Error with "Create Presentation" button:', error.message);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: '/tmp/beautiful-ai-create.png' });
      console.log('Screenshot saved to /tmp/beautiful-ai-create.png');
      
      throw new Error(`Failed to create presentation: ${error.message}`);
    }

    // Wait for the presentation to be created and loaded
    console.log('Waiting for presentation to load...');
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
      
      // Get the URL of the created presentation
      const presentationUrl = page.url();
      console.log('Presentation created successfully at:', presentationUrl);
      
      // Take a screenshot of the created presentation
      await page.screenshot({ path: '/tmp/beautiful-ai-presentation.png' });
      console.log('Presentation screenshot saved to /tmp/beautiful-ai-presentation.png');
      
      // Close the browser
      await browser.close();
      console.log('Browser closed');

      return NextResponse.json({
        success: true,
        message: 'Presentation created successfully in Beautiful.ai',
        presentationUrl,
      });
    } catch (error) {
      console.error('Error waiting for presentation to load:', error.message);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: '/tmp/beautiful-ai-final-error.png' });
      console.log('Error screenshot saved to /tmp/beautiful-ai-final-error.png');
      
      // Try to get the URL anyway
      const presentationUrl = page.url();
      
      // Close the browser
      await browser.close();
      
      // If we have a URL that looks like a presentation, return it despite the error
      if (presentationUrl.includes('beautiful.ai') && presentationUrl.includes('presentation')) {
        console.log('Returning presentation URL despite error:', presentationUrl);
        return NextResponse.json({
          success: true,
          message: 'Presentation may have been created in Beautiful.ai (with some errors)',
          presentationUrl,
        });
      }
      
      throw new Error(`Failed to load presentation: ${error.message}`);
    }
  } catch (error) {
    console.error('Beautiful.ai Integration Error:', error);
    return NextResponse.json(
      { error: 'Failed to create presentation in Beautiful.ai', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to format the outline for Beautiful.ai's AI prompt
function formatOutlineForBeautifulAi(outline: string): string {
  // Extract key information from the outline
  const titleMatch = outline.match(/# (.+)/);
  const title = titleMatch ? titleMatch[1] : 'MEDSTORY Presentation';
  
  // Extract slide information
  const slides = [];
  const slideRegex = /### Slide \d+: (.+)\n\*\*Content:\*\* (.+)(?:\n\*\*Speaker Notes:\*\* (.+))?/g;
  let match;
  
  while ((match = slideRegex.exec(outline)) !== null) {
    slides.push({
      title: match[1],
      content: match[2],
      notes: match[3] || ''
    });
  }
  
  // Format the prompt for Beautiful.ai
  let formattedOutline = `Create a professional medical presentation titled "${title}" with the following slides:\n\n`;
  
  slides.forEach((slide, index) => {
    formattedOutline += `Slide ${index + 1}: ${slide.title}\n`;
    formattedOutline += `Content: ${slide.content}\n`;
    if (slide.notes) {
      formattedOutline += `Speaker Notes: ${slide.notes}\n`;
    }
    formattedOutline += '\n';
  });
  
  // If no slides were extracted, use the original outline with minimal formatting
  if (slides.length === 0) {
    // Remove markdown headers
    formattedOutline = outline.replace(/#{1,6}\s/g, '');
    formattedOutline = `Create a professional medical presentation based on the following outline:\n\n${formattedOutline}`;
  }
  
  // Add specific instructions for Beautiful.ai
  formattedOutline = `Create a professional, visually appealing medical presentation with the following specifications:
  
1. Use appropriate medical imagery and data visualizations
2. Include clear, concise bullet points
3. Use a professional color scheme suitable for medical presentations
4. Include speaker notes where indicated
5. Make sure each slide has a clear purpose and message

${formattedOutline}`;
  
  // Limit the length if needed (Beautiful.ai might have character limits)
  const maxLength = 3000;
  if (formattedOutline.length > maxLength) {
    formattedOutline = formattedOutline.substring(0, maxLength - 3) + '...';
  }
  
  return formattedOutline;
}