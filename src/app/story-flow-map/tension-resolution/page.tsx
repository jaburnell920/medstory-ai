'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import PageLayout from '@/app/components/PageLayout';
import ChatInterface from '@/app/components/ChatInterface';

export default function TensionResolution() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [attackPoints, setAttackPoints] = useState<string[]>([]);
  const [persistentAttackPoints, setPersistentAttackPoints] = useState<string[]>([]); // Backup storage for attack points
  const [tensionResolutionPoints, setTensionResolutionPoints] = useState<string[]>([]);
  const [conclusion, setConclusion] = useState('');
  const [references, setReferences] = useState('');
  const [conversationStarted, setConversationStarted] = useState(false);
  const [tableData, setTableData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [tedTalkScript, setTedTalkScript] = useState('');

  // State for selections and saving
  const [selectedAttackPoint, setSelectedAttackPoint] = useState<string>('');
  const [selectedTensionPoints, setSelectedTensionPoints] = useState<Set<string>>(new Set());
  const [context, setContext] = useState({
    coreStoryConcept: '',
    audience: '',
  });

  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; content: string }[]>([]);

  // Ref for auto-scrolling the results section
  const resultsScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content is generated
  useEffect(() => {
    if (
      resultsScrollRef.current &&
      (attackPoints.length > 0 ||
        tensionResolutionPoints.length > 0 ||
        conclusion ||
        references ||
        tableData ||
        tedTalkScript ||
        result)
    ) {
      resultsScrollRef.current.scrollTop = resultsScrollRef.current.scrollHeight;
    }
  }, [
    attackPoints,
    tensionResolutionPoints,
    conclusion,
    references,
    tableData,
    tedTalkScript,
    result,
  ]);

  // Note: Story Flow Table is now only saved when user explicitly saves selected items
  // This prevents showing all generated tension-resolution points in the story map

  // Initialize messages with core story concept from localStorage
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const savedCoreStoryConceptData = localStorage.getItem('selectedCoreStoryConceptData');
      let initialMessage =
        'Do you want to use the currently selected Core Story Concept or provide a new one?';

      if (savedCoreStoryConceptData) {
        try {
          const conceptData = JSON.parse(savedCoreStoryConceptData);
          if (conceptData && conceptData.content) {
            // initialMessage += '\n\nCurrently selected: ' + conceptData.content;
            initialMessage =
              'Do you want to use the currently selected Core Story Concept or provide a new one?';
          }
        } catch (error) {
          console.error('Error parsing core story concept from localStorage:', error);
        }
      } else {
        initialMessage =
          'There is no Core Story Concept saved in memory. Please provide a new one, or visit the Create Core Story Concept Options page and then come back.';
      }

      setMessages([
        {
          role: 'assistant',
          content: initialMessage,
        },
      ]);
    }
  }, []);

  // Ensure table rows always match the count of generated tension-resolution points
  useEffect(() => {
    if (!tableData) return;

    const countNumericRows = (rows: string[][]) =>
      rows.filter((r) => r && r[0] && /^\d+\.?$/.test(r[0].trim())).length;

    // Helper: extract AP content without header or prompts
    const extractAttackPointContent = (ap: string) =>
      ap
        .replace(/^Attack Point #\d+:?\s*/i, '')
        .replace(
          /Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points\??/gi,
          ''
        )
        .replace(/Attack Point:\??/gi, '')
        .trim();

    // Helper: parse a TR point into tension/resolution cells
    const parseTRCells = (point: string): { tension: string; resolution: string } => {
      const tensionMatch = point.match(/Tension\s*:\s*([\s\S]*?)(?=\n\s*(?:Resolution\s*:|$))/i);
      const resolutionMatch = point.match(/Resolution\s*:\s*([\s\S]*)$/i);
      const tension = (tensionMatch?.[1] || '').trim();
      const resolution = (resolutionMatch?.[1] || '').trim();
      return { tension, resolution };
    };

    const expected = tensionResolutionPoints.length;
    const numericCount = countNumericRows(tableData.rows);

    // If mismatch, rebuild table from current state to guarantee alignment
    if (expected > 0 && numericCount !== expected) {
      const headers = ['', 'Tension', 'Resolution'];

      // Attack point row
      let apContent = '';
      if (attackPoints.length > 0) {
        const apIndex = selectedAttackPoint ? parseInt(selectedAttackPoint) : attackPoints.length - 1;
        const apRaw = attackPoints[Math.max(0, Math.min(apIndex, attackPoints.length - 1))] || '';
        apContent = extractAttackPointContent(apRaw);
      }

      const rows: string[][] = [];
      rows.push(['AP', apContent, '']);

      // TR rows
      tensionResolutionPoints.forEach((p, idx) => {
        const { tension, resolution } = parseTRCells(p);
        rows.push([String(idx + 1), tension, resolution]);
      });

      // Conclusion row
      rows.push(['CSC', '', (conclusion || '').trim()]);

      setTableData({ headers, rows });
    }
  }, [tableData, tensionResolutionPoints, attackPoints, selectedAttackPoint, conclusion]);

  const extractMiddleContent = (text: string): string => {
    const match = text.match(/\n([\s\S]+?)\n(?=[^\n]*$)/);
    return match ? match[1].trim() : '';
  };

  const handleReset = () => {
    setStep(0);
    setInput('');
    setLoading(false);
    setResult('');
    setAttackPoints([]);
    setPersistentAttackPoints([]); // Clear backup storage too
    setTensionResolutionPoints([]);
    setConclusion('');
    setReferences('');
    setConversationStarted(false);
    setSelectedAttackPoint('');
    setSelectedTensionPoints(new Set());
    setTableData(null);
    setContext({
      coreStoryConcept: '',
      audience: '',
    });
    // Reset messages with core story concept from localStorage - same logic as initial page load
    if (typeof window !== 'undefined') {
      const savedCoreStoryConceptData = localStorage.getItem('selectedCoreStoryConceptData');
      let initialMessage =
        'Do you want to use the currently selected Core Story Concept or provide a new one?';

      if (savedCoreStoryConceptData) {
        try {
          const conceptData = JSON.parse(savedCoreStoryConceptData);
          if (conceptData && conceptData.content) {
            // Don't show the "Currently selected:" text - just use the base message
            initialMessage =
              'Do you want to use the currently selected Core Story Concept or provide a new one?';
          }
        } catch (error) {
          console.error('Error parsing core story concept from localStorage:', error);
        }
      } else {
        initialMessage =
          'There is no Core Story Concept saved in memory. Please provide a new one, or visit the Create Core Story Concept Options page and then come back.';
      }

      setMessages([
        {
          role: 'assistant',
          content: initialMessage,
        },
      ]);
    }
  };

  // Initialize with default questions
  const [questions, setQuestions] = useState([
    'Do you want to use the currently selected Core Story Concept or provide a new one?',
    'Who is your audience?',
  ]);

  // Update the first question with core story concept from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCoreStoryConceptData = localStorage.getItem('selectedCoreStoryConceptData');

      if (savedCoreStoryConceptData) {
        try {
          const conceptData = JSON.parse(savedCoreStoryConceptData);
          if (conceptData && conceptData.content) {
            setQuestions((prevQuestions) => [
              prevQuestions[0] + '\n\nCurrently selected: ' + conceptData.content,
              ...prevQuestions.slice(1),
            ]);
          }
        } catch (error) {
          console.error('Error parsing core story concept from localStorage:', error);
        }
      }
    }
  }, []);

  // Helper function to clean attack points by removing unwanted strings and formatting
  const cleanAttackPoint = (attackPoint: string): string => {
    // Remove any "Assistant:" prefixes first
    let cleaned = attackPoint.replace(/^Assistant:\s*/gm, '').trim();

    // Check if the content is wrapped in quotes and extract just the quoted content
    // Only match if the entire content (or most of it) is wrapped in quotes
    const quotedContentMatch = cleaned.match(/^["'"]([\s\S]*?)["'"]$/s);
    if (quotedContentMatch) {
      // If we found quoted content, use only that
      cleaned = quotedContentMatch[1].trim();

      // Add Attack Point header if it doesn't exist
      if (!cleaned.match(/^Attack Point #\d+/i)) {
        cleaned = `Attack Point #1\n\n${cleaned}`;
      }

      return cleaned;
    }

    // Look for **Attack Point** pattern first and extract content after it
    const attackPointMatch = cleaned.match(
      /\*\*Attack Point\*\*\s*([\s\S]*?)(?=Would you like to modify|$)/i
    );
    if (attackPointMatch) {
      cleaned = `Attack Point #1\n\n${attackPointMatch[1].trim()}`;
      // Remove the follow-up question if it exists
      cleaned = cleaned
        .replace(/\n*Would you like to modify this Attack Point.*?\?.*$/gi, '')
        .trim();
      return cleaned;
    }

    // Handle the specific case: "Sure, let's modify the intervention to diuretics. Here's the new Attack Point with diuretics:"
    if (cleaned.includes("Sure, let's modify") && cleaned.includes("Here's the new Attack Point")) {
      return extractMiddleContent(cleaned);
    }

    // Remove any text before "Attack Point #" that might be introductory
    cleaned = cleaned.replace(/^.*?(?=Attack Point #\d+)/gi, '').trim();

    // Remove specific conversational phrases that might appear
    cleaned = cleaned
      .replace(/^Thank you for your input\.\s*/gim, '')
      .replace(/^Allow me to modify the Attack Point.*?\.\s*/gim, '')
      .replace(/^I'll modify.*?Attack Point.*?\.\s*/gim, '')
      .replace(/^Let me modify.*?Attack Point.*?\.\s*/gim, '')
      .replace(/^Understood\.\s*/gim, '')
      .replace(/^Sure,.*?\.\s*/gim, '')
      .replace(/^How about this:\s*/gim, '')
      .replace(/^Here's the new Attack Point.*?:\s*/gim, '')
      .trim();

    // Split into lines to process more carefully
    const lines = cleaned.split('\n');
    const contentLines = [];
    let foundAttackPointHeader = false;
    let foundFollowUpQuestion = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if this is an Attack Point header
      if (/^Attack Point #\d+/i.test(line)) {
        foundAttackPointHeader = true;
        contentLines.push(line);
        continue;
      }

      // Check if this is a follow-up question - stop processing here
      if (
        line.match(/^Would you like.*?\?/i) ||
        line.match(/^Do you want.*?\?/i) ||
        line.match(/^What.*?would you like.*?\?/i) ||
        line.match(/^How.*?would you like.*?\?/i) ||
        line.match(/^Which.*?would you prefer.*?\?/i) ||
        line.match(/^Are you satisfied.*?\?/i) ||
        line.match(/^What modifications.*?\?/i)
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        foundFollowUpQuestion = true;
        break;
      }

      // If we've found the attack point header, include content lines
      // OR if we haven't found a header yet but this looks like content, include it
      if (
        (foundAttackPointHeader && line.length > 0) ||
        (!foundAttackPointHeader && line.length > 0 && !line.match(/^(ATTACK POINT|Attack Point)/i))
      ) {
        contentLines.push(line);
      }
    }

    // If no header was found but we have content, add a default header
    if (!foundAttackPointHeader && contentLines.length > 0) {
      contentLines.unshift('Attack Point #1');
    }

    // Join the content lines back together
    cleaned = contentLines.join('\n').trim();

    // Remove any remaining standalone question marks at the end
    cleaned = cleaned.replace(/\?\s*$/, '').trim();

    // Clean up formatting but preserve the content
    cleaned = cleaned
      .replace(/\*+/g, '') // Remove all asterisks
      .replace(/^:\s*/gm, '') // Remove colons at start of lines
      .replace(/^\s*-+\s*/gm, '') // Remove dashes at start of lines
      .replace(/:\s*$/gm, '') // Remove trailing colons
      .trim();

    return cleaned;
  };

  // Helper function to parse markdown table
  const parseMarkdownTable = (text: string): { headers: string[]; rows: string[][] } | null => {
    console.log('Parsing table from text:', text);

    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    console.log('Lines after filtering:', lines);

    // Find table start and end
    let tableStart = -1;
    let tableEnd = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('|') && lines[i].endsWith('|')) {
        if (tableStart === -1) {
          tableStart = i;
        }
        tableEnd = i;
      } else if (tableStart !== -1) {
        // If we found a table and now hit a non-table line, stop
        break;
      }
    }

    console.log('Table start:', tableStart, 'Table end:', tableEnd);

    if (tableStart === -1 || tableEnd === -1 || tableStart === tableEnd) {
      console.log('No valid table found');
      return null;
    }

    const tableLines = lines.slice(tableStart, tableEnd + 1);
    console.log('Table lines:', tableLines);

    // Parse headers (first line) preserving empty first header
    const headerLine = tableLines[0];
    let headers = headerLine
      .split('|')
      .slice(1, -1) // remove leading and trailing empty due to pipes
      .map((cell) => cell.trim());

    // Ensure exactly 3 headers for consistency
    if (headers.length < 3) {
      headers = [...headers, ...Array(3 - headers.length).fill('')];
    } else if (headers.length > 3) {
      headers = headers.slice(0, 3);
    }

    console.log('Headers:', headers);

    // Skip separator line (second line with dashes)
    const dataLines = tableLines.slice(2);
    console.log('Data lines:', dataLines);

    // Parse data rows preserving empty cells and normalize to 3 columns
    const rows = dataLines.map((line) => {
      let cells = line
        .split('|')
        .slice(1, -1) // drop boundary pipes
        .map((cell) => cell.trim());

      // Normalize to 3 columns
      if (cells.length < 3) cells = [...cells, ...Array(3 - cells.length).fill('')];
      if (cells.length > 3) cells = cells.slice(0, 3);

      // If row starts with CSC in the first column, separate the label from content
      const cscMatch = cells[0].match(/^CSC\s*:?\s*(.*)$/i);
      if (cscMatch) {
        const cscContent = (cscMatch[1] || '').trim();
        // Put "CSC" in the first column
        cells[0] = 'CSC';
        // Leave Tension column empty
        cells[1] = '';
        // Put CSC content in the Resolution column, preferring existing Resolution content if any
        const resolutionContent = cells[2] || cscContent || '';
        cells[2] = resolutionContent;
      }

      return cells;
    });

    console.log('Parsed rows:', rows);

    return { headers, rows };
  };

  // Helper function to clean tension-resolution points and format titles properly
  const cleanTensionResolutionPoint = (point: string): string => {
    let cleaned = point.trim();

    // Remove the header line first (handle both formats: "Tension-Resolution" and "TensionResolution")
    cleaned = cleaned.replace(/^\*?\*?Tension-?Resolution #\d+.*?\n?/i, '');

    // Insert an empty line after a title if it exists
    cleaned = cleaned.replace(/^(.+?)\n(Tension:)/i, '$1\n\n$2');
    // Insert a blank line above "Tension:" if it exists
    cleaned = cleaned.replace(/^(.*?)(\n)(?=Tension:)/i, '$1\n\n');

    // Look for title patterns like ": title**" or "**title**" and convert to proper bold HTML
    cleaned = cleaned.replace(/^:\s*([^*\n]+)\*+\s*$/gm, '<strong>$1</strong>');
    cleaned = cleaned.replace(/^\*+([^*\n]+)\*+\s*$/gm, '<strong>$1</strong>');
    // Add a blank line after "Tension:" if it exists
    // cleaned = cleaned.replace(/(Tension:*?)(\n)/i, '$1\n\n');
    // Add a blank line after "Resolution:" if it exists
    cleaned = cleaned.replace(/(Resolution:*?)(\n)/i, '$1\n\n');

    // Replace 'Tension:' with 'blahblah:'
    // cleaned = cleaned.replace(/Tension/g, 'Tension');

    // Remove remaining asterisks, colons, and dashes
    cleaned = cleaned
      .replace(/\*+/g, '') // Remove all remaining asterisks
      .replace(/^:\s*/gm, '') // Remove colons at start of lines
      .replace(/^\s*-+\s*/gm, '') // Remove dashes at start of lines
      .replace(/:\s*$/gm, '') // Remove trailing colons
      .trim();

    return cleaned;
  };

  // Helper function to clean conclusion content and separate references if found
  const cleanConclusion = (conclusion: string): string => {
    let cleaned = conclusion.trim();

    // Check if references section is embedded within conclusion
    // This pattern matches various forms of "References" headings
    const referencesMatch =
      cleaned.match(/\n\s*\*?\*?References?\*?\*?[:\s]*/i) ||
      cleaned.match(/\n\s*\[References?\]/i) ||
      cleaned.match(/\n\s*References? section/i) ||
      (cleaned.startsWith('References') && cleaned.match(/^References?[:\s]/i));
    if (referencesMatch) {
      // Only keep the part before references
      if (referencesMatch.index === 0) {
        // If references are at the start, there's no conclusion content
        cleaned = '';
      } else {
        cleaned = cleaned.substring(0, referencesMatch.index).trim();
      }
    }

    // Remove asterisks, colons, and dashes
    cleaned = cleaned
      .replace(/\*+/g, '') // Remove all asterisks
      .replace(/^:\s*/gm, '') // Remove colons at start of lines
      .replace(/^\s*-+\s*/gm, '') // Remove dashes at start of lines
      .replace(/:\s*$/gm, '') // Remove trailing colons
      .trim();

    return cleaned;
  };

  // Helper function to safely update attack points with persistent backup
  const updateAttackPoints = (
    newPoints: string[],
    mode: 'replace' | 'add' | 'modify' = 'replace'
  ) => {
    // Clean all new points before processing
    const cleanedNewPoints = newPoints
      .map((point) => cleanAttackPoint(point))
      .filter((point) => point.length > 0);

    let finalPoints: string[] = [];

    if (mode === 'add') {
      finalPoints = [...persistentAttackPoints, ...cleanedNewPoints];
      setAttackPoints(finalPoints);
      setPersistentAttackPoints(finalPoints);
    } else if (mode === 'modify') {
      finalPoints = [...persistentAttackPoints];
      if (finalPoints.length > 0 && cleanedNewPoints.length > 0) {
        // Replace last attack point with the modified version
        finalPoints[finalPoints.length - 1] = cleanedNewPoints[0];
      }
      setAttackPoints(finalPoints);
      setPersistentAttackPoints(finalPoints);
    } else {
      finalPoints = cleanedNewPoints;
      setAttackPoints(finalPoints);
      setPersistentAttackPoints(finalPoints);
    }

    // Auto-select the latest (most recent) attack point by index
    if (finalPoints.length > 0) {
      setSelectedAttackPoint((finalPoints.length - 1).toString());
    }
  };

  // Helper function to restore attack points from persistent storage
  const restoreAttackPoints = () => {
    if (persistentAttackPoints.length > 0) {
      setAttackPoints(persistentAttackPoints);
      // Auto-select the latest (most recent) attack point by index
      setSelectedAttackPoint((persistentAttackPoints.length - 1).toString());
    }
  };

  // Function to parse and categorize AI response content
  const parseContentResponse = (response: string) => {
    // If the response contains a markdown table, skip parsing narrative content to avoid accidental additions
    const tableCheck = parseMarkdownTable(response);
    if (tableCheck) {
      return {
        attackPoints: [],
        tensionResolutionPoints: [],
        conclusion: '',
        references: '',
      };
    }

    const lines = response.split('\n');
    const attackPointsFound: string[] = [];
    const tensionResolutionPointsFound: string[] = [];
    let conclusionFound = '';
    let referencesFound = '';

    let currentSection = '';
    let currentContent: string[] = [];

    // Check if this response contains an attack point without explicit header
    // This happens when the AI returns modified content
    const hasAttackPointHeader = /Attack Point #\d+/i.test(response);
    const hasFollowUpQuestion = /Would you like.*?modify.*?create.*?move on/i.test(response);

    // If there's no explicit header, treat the content as an attack point in these cases:
    // 1. There's a follow-up question (modified content)
    // 2. This is the first response and there's substantial narrative content
    if (!hasAttackPointHeader) {
      let contentToProcess = '';
      
      if (hasFollowUpQuestion) {
        // Extract content before the follow-up question
        const questionMatch = response.match(/(Would you like.*?(?:modify|create|move on).*?\?)/i);
        if (questionMatch) {
          contentToProcess = response.substring(0, questionMatch.index).trim();
        }
      } else {
        // Check if this looks like narrative content (first response case)
        // Look for substantial content that appears to be a story/narrative
        const trimmedResponse = response.trim();
        if (trimmedResponse.length > 50 && 
            !trimmedResponse.match(/^(Do you want|Who is|Would you like|What|How)/i) &&
            !trimmedResponse.match(/^(Currently selected|There is no)/i) &&
            !trimmedResponse.match(/Tension-?Resolution/i) &&
            !trimmedResponse.match(/^\*\*Tension-?Resolution/i) &&
            !trimmedResponse.match(/Conclusion/i) &&
            !trimmedResponse.match(/References/i) &&
            !trimmedResponse.match(/short narrative|full narrative|specify the number/i)) {
          contentToProcess = trimmedResponse;
        }
      }
      
      if (contentToProcess.length > 0) {
        // Determine the attack point number based on existing attack points
        const currentAttackPointCount = attackPoints.length + persistentAttackPoints.length;
        const attackPointNumber = currentAttackPointCount + 1;
        
        // Add a header and treat as attack point
        const attackPointContent = `Attack Point #${attackPointNumber}\n\n${contentToProcess}`;
        const cleanedAttackPoint = cleanAttackPoint(attackPointContent);
        if (cleanedAttackPoint) {
          attackPointsFound.push(cleanedAttackPoint);
        }
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for Attack Point
      if (/Attack Point #\d+/i.test(line)) {
        if (currentSection && currentContent.length > 0) {
          // Save previous section
          if (currentSection === 'attack') {
            const cleanedAttackPoint = cleanAttackPoint(currentContent.join('\n').trim());
            if (cleanedAttackPoint) {
              attackPointsFound.push(cleanedAttackPoint);
            }
          }
        }
        currentSection = 'attack';
        currentContent = [line];
        continue;
      }

      // Check for Tension-Resolution Point (handle both formats: "Tension-Resolution" and "TensionResolution")
      if (
        line.match(/^\*?\*?Tension-?Resolution #\d+/i) ||
        line.match(/^\*\*TensionResolution #\d+/i)
      ) {
        if (currentSection && currentContent.length > 0) {
          // Save previous section
          if (currentSection === 'attack') {
            const cleanedAttackPoint = cleanAttackPoint(currentContent.join('\n').trim());
            if (cleanedAttackPoint) {
              attackPointsFound.push(cleanedAttackPoint);
            }
          } else if (currentSection === 'tension') {
            tensionResolutionPointsFound.push(
              cleanTensionResolutionPoint(currentContent.join('\n').trim())
            );
          }
        }
        currentSection = 'tension';
        currentContent = [line];
        continue;
      }

      // Check for Conclusion - improved pattern to catch various formats
      if (
        line.match(/^\*?\*?Conclusion\*?\*?/i) ||
        line.match(/^Conclusion:/i) ||
        line.match(/^\*\*Conclusion\*\*/i) ||
        line.match(/^\*\*Conclusion:\*\*/i) ||
        line.match(/^\*\*Conclusion:/i) ||
        line.match(/^Conclusion$/i) ||
        line.match(/^\*Conclusion\*/i) ||
        line.match(/^Summary\*?\*?/i) ||
        line.match(/^\*?\*?Summary\*?\*?/i) ||
        line.match(/^\*?\*?\*\*Conclusion\*\*\*?\*?/i)
      ) {
        if (currentSection && currentContent.length > 0) {
          // Save previous section
          if (currentSection === 'attack') {
            const cleanedAttackPoint = cleanAttackPoint(currentContent.join('\n').trim());
            if (cleanedAttackPoint) {
              attackPointsFound.push(cleanedAttackPoint);
            }
          } else if (currentSection === 'tension') {
            tensionResolutionPointsFound.push(
              cleanTensionResolutionPoint(currentContent.join('\n').trim())
            );
          }
        }
        currentSection = 'conclusion';
        currentContent = [];
        continue;
      }

      // Check for References - improved pattern to catch various formats
      if (
        line.match(/^\*?\*?References?\*?\*?$/i) ||
        line.match(/^References?:/i) ||
        line.match(/^\*\*References?\*\*$/i) ||
        line.match(/^\*\*References?:\*\*$/i) ||
        line.match(/^\*\*References?:/i)
      ) {
        if (currentSection && currentContent.length > 0) {
          // Save previous section
          if (currentSection === 'attack') {
            const cleanedAttackPoint = cleanAttackPoint(currentContent.join('\n').trim());
            if (cleanedAttackPoint) {
              attackPointsFound.push(cleanedAttackPoint);
            }
          } else if (currentSection === 'tension') {
            tensionResolutionPointsFound.push(
              cleanTensionResolutionPoint(currentContent.join('\n').trim())
            );
          } else if (currentSection === 'conclusion') {
            conclusionFound = cleanConclusion(currentContent.join('\n').trim());
          }
        }
        currentSection = 'references';
        currentContent = [];
        continue;
      }

      // Add line to current content if we're in a section
      if (currentSection) {
        currentContent.push(lines[i]);
      }
    }

    // Save the last section
    if (currentSection && currentContent.length > 0) {
      if (currentSection === 'attack') {
        const cleanedAttackPoint = cleanAttackPoint(currentContent.join('\n').trim());
        if (cleanedAttackPoint) {
          attackPointsFound.push(cleanedAttackPoint);
        }
      } else if (currentSection === 'tension') {
        tensionResolutionPointsFound.push(
          cleanTensionResolutionPoint(currentContent.join('\n').trim())
        );
      } else if (currentSection === 'conclusion') {
        const conclusionText = currentContent.join('\n').trim();

        // Check if references section is embedded within conclusion
        // This pattern matches various forms of "References" headings
        const referencesMatch =
          conclusionText.match(/\n\s*\*?\*?References?\*?\*?[:\s]*/i) ||
          conclusionText.match(/\n\s*\[References?\]/i) ||
          conclusionText.match(/\n\s*References? section/i) ||
          (conclusionText.startsWith('References') && conclusionText.match(/^References?[:\s]/i));
        if (referencesMatch && referencesMatch.index !== undefined) {
          // Split the text into conclusion and references
          if (referencesMatch.index === 0) {
            // If references are at the start, there's no conclusion content
            conclusionFound = '';
            referencesFound = conclusionText.substring(referencesMatch[0].length).trim();
          } else {
            conclusionFound = cleanConclusion(
              conclusionText.substring(0, referencesMatch.index).trim()
            );
            referencesFound = conclusionText
              .substring(referencesMatch.index + referencesMatch[0].length)
              .trim();
          }
        } else {
          conclusionFound = cleanConclusion(conclusionText);
        }
      } else if (currentSection === 'references') {
        referencesFound = currentContent.join('\n').trim();
      }
    }

    // Additional fallback: Look for conclusion patterns in the entire response if none found
    if (!conclusionFound && tensionResolutionPointsFound.length > 0) {
      // Try to find conclusion content after the last tension-resolution point
      const conclusionPatterns = [
        /\*?\*?Conclusion\*?\*?[:\s]*([\s\S]*?)(?=\n\s*\*?\*?References?|$)/i,
        /\*?\*?Summary\*?\*?[:\s]*([\s\S]*?)(?=\n\s*\*?\*?References?|$)/i,
        /^Conclusion[:\s]*([\s\S]*?)(?=\n\s*References?|$)/im,
        /^Summary[:\s]*([\s\S]*?)(?=\n\s*References?|$)/im,
      ];

      for (const pattern of conclusionPatterns) {
        const match = response.match(pattern);
        if (match && match[1] && match[1].trim()) {
          conclusionFound = cleanConclusion(match[1].trim());
          break;
        }
      }
    }

    return {
      attackPoints: attackPointsFound,
      tensionResolutionPoints: tensionResolutionPointsFound,
      conclusion: conclusionFound,
      references: referencesFound,
    };
  };

  // Helper function to parse TED talk scripts from AI response
  const parseTedTalkScript = (text: string): string | null => {
    console.log('Parsing TED talk script from text:', text);

    // Look for TED talk script patterns
    const tedTalkPatterns = [
      /# TED Talk Script:/i,
      /TED Talk Script:/i,
      /## Duration:/i,
      /\[Walk to center stage/i,
      /\[Opening Hook:/i, // Match [Opening Hook: format (actual format from network response)
      /\[The speaker walks/i, // Match [The speaker walks format
      /\[Problem Setup/i, // Match [Problem Setup format
      /\[Journey Through/i, // Match [Journey Through format
      /\[Climactic Revelation/i, // Match [Climactic Revelation format
      /\[Call to Action/i, // Match [Call to Action format
      /Opening Hook \(/i,
      /\*\*\[Opening Hook:/i, // Match **[Opening Hook: format
      /The Problem \(/i,
      /Journey Through Discovery \(/i,
      /The Revelation \(/i,
      /Call to Action \(/i,
      /Speaker Notes:/i,
      /\*\*Opening Hook \(/i, // Match **Opening Hook ( format
      /\*\*The Problem \(/i, // Match **The Problem ( format
      /\*\*Journey Through/i, // Match **Journey Through format
      /\*\*Call to Action/i, // Match **Call to Action format
    ];

    // Check if the response contains TED talk script indicators
    const containsTedTalk = tedTalkPatterns.some((pattern) => pattern.test(text));

    if (containsTedTalk) {
      console.log('TED talk script detected');
      return text.trim();
    }

    console.log('No TED talk script found');
    return null;
  };

  // Function to separate content from questions in AI response
  const parseAIResponse = (response: string) => {
    // Look for questions that should appear in chat
    const questionPatterns = [
      /Would you like.*?\?/gi,
      /Do you want.*?\?/gi,
      /What.*?would you like.*?\?/gi,
      /How.*?would you like.*?\?/gi,
      /Which.*?would you prefer.*?\?/gi,
      /are you satisfied.*?\?/gi,
      /What modifications.*?\?/gi,
    ];

    let content = response;
    let question = '';

    // Split response into lines to better handle formatting
    const lines = response.split('\n');
    const contentLines = [];
    let foundQuestion = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if this line contains a question
      let isQuestion = false;
      for (const pattern of questionPatterns) {
        if (pattern.test(line)) {
          question = line;
          isQuestion = true;
          foundQuestion = true;
          break;
        }
      }

      // If we haven't found a question yet, or this isn't a question line, add to content
      if (!isQuestion && !foundQuestion) {
        contentLines.push(lines[i]);
      }
    }

    // If no question found in individual lines, check the entire response
    if (!question) {
      for (const pattern of questionPatterns) {
        const matches = response.match(pattern);
        if (matches && matches.length > 0) {
          question = matches[matches.length - 1];
          content = response.replace(question, '').trim();
          break;
        }
      }
    } else {
      content = contentLines.join('\n').trim();
    }

    return { content: content.trim(), question: question.trim() };
  };

  // Handle attack point selection (radio button)
  const handleAttackPointSelection = (attackPointIndex: number) => {
    setSelectedAttackPoint(attackPointIndex.toString());
  };

  // Handle tension resolution point selection (checkbox)
  const handleTensionPointSelection = (tensionPointIndex: number, checked: boolean) => {
    const newSelected = new Set(selectedTensionPoints);
    if (checked) {
      newSelected.add(tensionPointIndex.toString());
    } else {
      newSelected.delete(tensionPointIndex.toString());
    }
    setSelectedTensionPoints(newSelected);
  };

  // Handle saving selected items
  const handleSaveSelected = () => {
    if (!selectedAttackPoint && selectedTensionPoints.size === 0) {
      toast.error('Please select at least one item to save.');
      return;
    }

    // Prepare data to save
    const saveData = {
      id: `tension-resolution-${Date.now()}`,
      timestamp: new Date().toISOString(),
      context: context,
      selectedAttackPoint: selectedAttackPoint
        ? {
            index: parseInt(selectedAttackPoint),
            content: attackPoints[parseInt(selectedAttackPoint)],
          }
        : null,
      selectedTensionPoints: Array.from(selectedTensionPoints).map((index) => ({
        index: parseInt(index),
        content: tensionResolutionPoints[parseInt(index)],
      })),
      conclusion: conclusion,
      references: references,
    };

    // Save to localStorage
    const existingSaved = localStorage.getItem('savedTensionResolutionData');
    let savedData = [];
    if (existingSaved) {
      try {
        savedData = JSON.parse(existingSaved);
      } catch (error) {
        console.error('Error parsing saved data:', error);
      }
    }

    savedData.push(saveData);
    localStorage.setItem('savedTensionResolutionData', JSON.stringify(savedData));

    // Also save a filtered story flow table with only selected tension-resolution points
    if (tableData && (selectedAttackPoint || selectedTensionPoints.size > 0)) {
      const filteredTable = {
        headers: tableData.headers,
        rows: []
      };

      // Add attack point row if selected
      if (selectedAttackPoint) {
        const apRow = tableData.rows.find(row => row[0] === 'AP');
        if (apRow) {
          filteredTable.rows.push(apRow);
        }
      }

      // Add only selected tension-resolution rows
      const selectedIndices = Array.from(selectedTensionPoints).map(index => parseInt(index));
      selectedIndices.sort((a, b) => a - b); // Sort to maintain order

      selectedIndices.forEach((originalIndex, newIndex) => {
        // Find the row that corresponds to this tension-resolution point
        const rowToFind = (originalIndex + 1).toString(); // TR points are 1-indexed in table
        const trRow = tableData.rows.find(row => row[0] === rowToFind);
        if (trRow) {
          // Update the row number to be sequential (1, 2, 3, etc.)
          const newRow = [...trRow];
          newRow[0] = (newIndex + 1).toString();
          filteredTable.rows.push(newRow);
        }
      });

      // Add conclusion row if it exists
      const cscRow = tableData.rows.find(row => row[0] === 'CSC');
      if (cscRow) {
        filteredTable.rows.push(cscRow);
      }

      // Save the filtered table
      localStorage.setItem('storyFlowTable', JSON.stringify(filteredTable));
      console.log('Saved filtered Story Flow Table with only selected points:', filteredTable);
    }

    const totalSelected = (selectedAttackPoint ? 1 : 0) + selectedTensionPoints.size;
    toast.success(`${totalSelected} item(s) saved successfully!`);
  };

  // Handle clicking on title to access saved page
  const handleTitleClick = () => {
    window.location.href = '/story-flow-map/tension-resolution/saved';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user' as const, content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    const trimmed = input.trim();

    // Handle initial setup questions
    if (!conversationStarted) {
      if (step === 0) {
        // Handle Core Story Concept selection
        if (
          trimmed.toLowerCase().includes('currently selected') ||
          trimmed.toLowerCase().includes('use current') ||
          trimmed.toLowerCase().includes('current')
        ) {
          // Get core story concept from localStorage
          if (typeof window !== 'undefined') {
            const savedCoreStoryConceptData = localStorage.getItem('selectedCoreStoryConceptData');

            if (savedCoreStoryConceptData) {
              try {
                const conceptData = JSON.parse(savedCoreStoryConceptData);
                if (conceptData && conceptData.content) {
                  setContext((prev) => ({
                    ...prev,
                    coreStoryConcept: conceptData.content,
                  }));
                } else {
                  // If no content found, set empty string and inform user
                  setContext((prev) => ({
                    ...prev,
                    coreStoryConcept: '',
                  }));

                  setMessages((msgs) => [
                    ...msgs,
                    {
                      role: 'assistant',
                      content: 'No saved Core Story Concept found. Please create a new one.',
                    },
                  ]);
                  setStep(-1); // Special step to handle manual CSC input
                  return;
                }
              } catch (error) {
                console.error('Error parsing core story concept from localStorage:', error);
                // Handle error by asking for a new core story concept
                setContext((prev) => ({
                  ...prev,
                  coreStoryConcept: '',
                }));

                setMessages((msgs) => [
                  ...msgs,
                  {
                    role: 'assistant',
                    content: 'Error loading saved Core Story Concept. Please create a new one.',
                  },
                ]);
                setStep(-1); // Special step to handle manual CSC input
                return;
              }
            } else {
              // No saved concept found
              setContext((prev) => ({
                ...prev,
                coreStoryConcept: '',
              }));

              setMessages((msgs) => [
                ...msgs,
                {
                  role: 'assistant',
                  content: 'No saved Core Story Concept found. Please create a new one.',
                },
              ]);
              setStep(-1); // Special step to handle manual CSC input
              return;
            }
          }
        } else {
          // User wants to provide new one, ask for it
          setMessages((msgs) => [
            ...msgs,
            {
              role: 'assistant',
              content:
                "Please enter the Core Story Concept you'd like to use to guide the story flow.",
            },
          ]);
          setStep(-1); // Special step to handle manual CSC input
          return;
        }
      }
      if (step === -1) {
        // Handle manual Core Story Concept input
        setContext((prev) => ({ ...prev, coreStoryConcept: trimmed }));
        setStep(1); // Move to audience question
        setMessages((msgs) => [
          ...msgs,
          {
            role: 'assistant',
            content: questions[1],
          },
        ]);
        return;
      }
      if (step === 1) {
        setContext((prev) => ({ ...prev, audience: trimmed }));
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: 'Creating your Story Flow Outline',
          },
        ]);
        setLoading(true);

        try {
          const res = await fetch('/api/tension-resolution', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'start',
              coreStoryConcept: context.coreStoryConcept,
              audience: trimmed,
            }),
          });

          const data = await res.json();
          const { content, question } = parseAIResponse(data.result);

          // Check if the response contains a table
          const tableResult = parseMarkdownTable(data.result);
          if (tableResult) {
            setTableData(tableResult);
          }

          // Parse the content to extract different sections (skip if this is a table-only response)
          let parsedContent = {
            attackPoints: [] as string[],
            tensionResolutionPoints: [] as string[],
            conclusion: '',
            references: '',
          };
          if (!tableResult) {
            parsedContent = parseContentResponse(data.result);
          }

          // Update state with parsed content - only add new attack points if found
          if (parsedContent.attackPoints.length > 0) {
            const cleaned = parsedContent.attackPoints.map(cleanAttackPoint);
            updateAttackPoints(cleaned, 'add');
          }
          if (parsedContent.tensionResolutionPoints.length > 0) {
            setTensionResolutionPoints(parsedContent.tensionResolutionPoints);
          }
          if (parsedContent.conclusion) {
            setConclusion(parsedContent.conclusion);
          }
          if (parsedContent.references) {
            setReferences(parsedContent.references);
          }

          // Ensure attack points are preserved after initial setup
          restoreAttackPoints();

          // Keep the old result for backward compatibility
          if (content) {
            setResult(content);
          }

          if (question) {
            setMessages((msgs) => [
              ...msgs.slice(0, -1), // Remove "Creating..." message
              {
                role: 'assistant',
                content: question,
              },
            ]);
          } else {
            // Add the attack point follow-up question after Story Flow Outline is created
            setMessages((msgs) => [
              ...msgs.slice(0, -1), // Remove "Creating..." message
              {
                role: 'assistant',
                content:
                  'Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?',
              },
            ]);
          }

          setConversationStarted(true);
        } catch (err) {
          console.error('Full error details:', err);
          console.error('Error message:', err instanceof Error ? err.message : String(err));
          console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
          toast.error(`Something went wrong: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          setLoading(false);
        }

        return;
      }

      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep < questions.length) {
        setMessages((msgs) => [
          ...msgs,
          {
            role: 'assistant',
            content: questions[nextStep],
          },
        ]);
      }
    } else {
      // Handle ongoing conversation
      setLoading(true);

      try {
        const res = await fetch('/api/tension-resolution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'continue',
            coreStoryConcept: context.coreStoryConcept,
            audience: context.audience,
            userMessage: trimmed,
            conversationHistory: newMessages,
          }),
        });

        const data = await res.json();
        console.log('Raw API Response:', data.result);

        const { content, question } = parseAIResponse(data.result);
        console.log('Parsed content:', content);
        console.log('Parsed question:', question);

        // Debug logging
        console.log('API Response:', data.result);
        console.log('User message was:', trimmed);

        // Check if the response contains a table
        const tableResult = parseMarkdownTable(data.result);
        console.log('Table parsing result:', tableResult);
        if (tableResult) {
          setTableData(tableResult);
        }

        // Check if the response contains a TED talk script (always try to detect)
        const tedTalkResult = parseTedTalkScript(data.result);
        console.log('TED talk parsing result:', tedTalkResult);
        if (tedTalkResult) {
          setTedTalkScript(tedTalkResult);
        }

        // Parse the content to extract different sections (skip if this is a table-only response)
        console.log('About to parse content response...');
        let parsedContent = {
          attackPoints: [] as string[],
          tensionResolutionPoints: [] as string[],
          conclusion: '',
          references: '',
        };
        if (!tableResult) {
          parsedContent = parseContentResponse(data.result);
        }
        console.log('Parsed content response:', parsedContent);

        // Determine if this is a modification or new creation based on user input and conversation context
        const userWantsModification =
          trimmed.toLowerCase().includes('modify') ||
          trimmed.toLowerCase().includes('change') ||
          trimmed.toLowerCase().includes('edit') ||
          trimmed.toLowerCase().includes('update') ||
          trimmed.toLowerCase().includes('revise') ||
          // Check if user is providing modification details after being asked
          (messages.length >= 2 &&
            messages[messages.length - 2]?.content?.toLowerCase().includes('what modifications')) ||
          // Check if the previous AI message asked for modifications
          (messages.length >= 1 &&
            messages[messages.length - 1]?.role === 'assistant' &&
            messages[messages.length - 1]?.content?.toLowerCase().includes('what modifications'));

        const userWantsNew =
          trimmed.toLowerCase().includes('new') ||
          trimmed.toLowerCase().includes('create') ||
          trimmed.toLowerCase().includes('another') ||
          trimmed.toLowerCase().includes('different');

        if (parsedContent.attackPoints.length > 0) {
          const cleaned = parsedContent.attackPoints.map(cleanAttackPoint);

          if (userWantsModification && !userWantsNew) {
            // User explicitly wants to modify the existing attack point
            updateAttackPoints(cleaned, 'modify');
          } else if (userWantsNew || persistentAttackPoints.length === 0) {
            // User wants a new attack point OR this is the first attack point
            updateAttackPoints(cleaned, 'add');
          } else {
            // Default behavior - if unclear, treat as new
            updateAttackPoints(cleaned, 'add');
          }
        }

        // Always restore attack points before updating other content to prevent loss
        // restoreAttackPoints();

        if (parsedContent.tensionResolutionPoints.length > 0) {
          setTensionResolutionPoints(parsedContent.tensionResolutionPoints);
          // Ensure attack points are still there after setting tension-resolution points
          // restoreAttackPoints();
        }
        if (parsedContent.conclusion) {
          setConclusion(parsedContent.conclusion);
        }
        if (parsedContent.references) {
          setReferences(parsedContent.references);
        }

        // Final restoration to ensure attack points are never lost
        // restoreAttackPoints();

        // Update result if there's substantial content and it's not a TED talk script
        if (content && content.length > 50 && !tedTalkResult) {
          setResult(content);
        }

        // Add AI response to chat - but exclude TED talk scripts from chat
        let responseContent = question || data.result;

        // If this is a TED talk script, don't add it to chat messages
        if (tedTalkResult) {
          // Don't add TED talk scripts to chat at all - they should only appear in results section
          responseContent = '';
        }

        // Determine what question to ask based on the current state and what was just generated
        if (tableResult) {
          // If a table was just generated, ask about creating TED talk script
          setMessages((msgs) => [
            ...msgs,
            {
              role: 'assistant',
              content:
                'Would you like me to write a script based on the above story flow outline that would be suitable for a highly engaging TED talk?',
            },
          ]);
        } else {
          // Check if we generated attack points and need to ask the follow-up question
          const shouldAskAttackPointFollowUp =
            parsedContent.attackPoints.length > 0 &&
            !trimmed.toLowerCase().includes('move on') &&
            !trimmed.toLowerCase().includes('tension') &&
            // Only ask attack point follow-up if we don't already have tension-resolution points
            // (i.e., we're still in the attack point phase)
            tensionResolutionPoints.length === 0;

          if (shouldAskAttackPointFollowUp) {
            // Ask the attack point follow-up question
            setMessages((msgs) => [
              ...msgs,
              {
                role: 'assistant',
                content:
                  'Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points?',
              },
            ]);
          } else if (responseContent.trim() && !tedTalkResult) {
            // Only add to chat if there's content to add and it's not a TED talk script
            setMessages((msgs) => [
              ...msgs,
              {
                role: 'assistant',
                content: responseContent,
              },
            ]);
          }
        }
      } catch (err) {
        console.error('Full error details:', err);
        console.error('Error message:', err instanceof Error ? err.message : String(err));
        console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
        toast.error(`Something went wrong: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <PageLayout
      sectionIcon={
        <Image
          src="/core_story_concept_new.png"
          alt="Story Flow Map"
          width={72}
          height={72}
          className="w-24 h-26"
        />
      }
      sectionName="Story Flow Map"
      taskName={
        <span
          onClick={handleTitleClick}
          className="cursor-pointer hover:text-blue-600 transition-colors"
          title="Click to view saved tension-resolution outlines"
        >
          Create story flow outline
        </span>
      }
    >
      <div className="flex gap-1 h-full">
        {/* Chat Interface - Left Side */}
        <div className="w-1/2 h-full">
          <ChatInterface
            messages={messages}
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            loading={loading}
            showInput={!conversationStarted ? step <= questions.length - 1 || step === -1 : true}
            placeholder="Type your response..."
            onReset={handleReset}
          />
        </div>

        {/* Result Section - Right Side - Fixed */}
        <div className="flex-1 h-full">
          {attackPoints.length > 0 ||
          tensionResolutionPoints.length > 0 ||
          conclusion ||
          references ||
          tableData ||
          tedTalkScript ||
          result ? (
            <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md h-full flex flex-col">
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold text-blue-900">Story Flow Outline</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {(selectedAttackPoint ? 1 : 0) + selectedTensionPoints.size} selected
                  </span>
                  {(selectedAttackPoint || selectedTensionPoints.size > 0) && (
                    <button
                      onClick={handleSaveSelected}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Save Selected
                    </button>
                  )}
                </div>
              </div>

              <div ref={resultsScrollRef} className="space-y-6 overflow-y-auto flex-1">
                {/* Attack Points */}
                {attackPoints.map((attackPoint, index) => {
                  const cleanedAttackPoint = attackPoint
                    // Remove the matched 'Attack Point #x' label (optional colon), store match
                    .replace(/^Attack Point #\d+:?\s*/i, '')
                    // Remove unwanted sentence
                    .replace(
                      /Would you like to modify this Attack Point, create a new one, or move on to creating tension-resolution points\??/gi,
                      ''
                    )
                    .replace(/Attack Point:\??/gi, '')
                    // Trim and remove leading space from entire block (after "Attack Point #x" is removed)
                    .trim();

                  return (
                    <div
                      key={`attack-${index}`}
                      className="bg-blue-50 p-4 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          id={`attack-${index}`}
                          name="attackPoint"
                          checked={selectedAttackPoint === index.toString()}
                          onChange={() => handleAttackPointSelection(index)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-blue-800 text-lg mb-4">
                            {`Attack Point #${index + 1}`}
                          </div>
                          <pre className="text-gray-800 whitespace-pre-wrap font-sans">
                            {cleanedAttackPoint.split('\n').map((line, i) => (
                              <div key={i} dangerouslySetInnerHTML={{ __html: line }} />
                            ))}
                          </pre>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Tension-Resolution Points */}
                {tensionResolutionPoints.map((point, index) => {
                  // Remove anything before the first "TENSION:"
                  const cleanedPoint = point.replace(/^[\s\S]*?(?=TENSION:)/i, '');

                  return (
                    <div
                      key={`tension-${index}`}
                      className="bg-blue-50 p-4 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id={`tension-${index}`}
                          checked={selectedTensionPoints.has(index.toString())}
                          onChange={(e) => handleTensionPointSelection(index, e.target.checked)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-blue-800 mb-2">
                            Tension-Resolution #{index + 1}
                          </h3>
                          <div className="text-gray-800 whitespace-pre-wrap font-sans">
                            {cleanedPoint
                              // Format TENSION headers with proper styling and spacing
                              .replace(
                                /^TENSION:/gim,
                                '<div class="font-bold text-blue-800 text-base mt-6 mb-4">TENSION</div>\n'
                              )
                              // Format RESOLUTION headers with proper styling and spacing
                              .replace(
                                /^RESOLUTION:/gim,
                                '<div class="font-bold text-blue-800 text-base mt-6 mb-4">RESOLUTION</div>\n'
                              )
                              .split('\n')
                              .map((line, i) => (
                                <div key={i} dangerouslySetInnerHTML={{ __html: line }} />
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Conclusion */}
                {conclusion && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Summary</h3>
                    <pre className="text-gray-800 whitespace-pre-wrap font-sans">
                      {conclusion.replace(/\n?• \??\.?$/i, '').trim()}
                    </pre>
                  </div>
                )}

                {/* References */}
                {references && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">References</h3>
                    <pre className="text-gray-800 whitespace-pre-wrap font-sans">
                      {references
                        .replace(
                          /\n?Would you like the tension-resolution points put into a table\??\.?$/i,
                          ''
                        )
                        .replace(
                          /\n?Now, would you like these tension-resolution points put into a table?\??\.?$/i,
                          ''
                        )
                        .replace(
                          /\n?Would you like these tension-resolution points put into a table?\??\.?$/i,
                          ''
                        )
                        .replace(/Assistant:.*$/is, '')
                        .replace(/\n?---??\.?$/i, '')
                        .trim()}
                    </pre>
                  </div>
                )}

                {/* Table Display */}
                {tableData && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">Story Flow Table</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-green-100">
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-green-800">
                              {/* Empty header for first column */}
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-green-800">
                              Tension
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-green-800">
                              Resolution
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.rows.map((row, rowIndex) => (
                            <tr
                              key={rowIndex}
                              className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-green-25'}
                            >
                              {row.map((cell, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className={`border border-gray-300 px-4 py-2 text-gray-800 ${
                                    cellIndex === 0 ? 'text-center align-middle' : 'align-top'
                                  }`}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TED Talk Script Display */}
                {tedTalkScript && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-semibold text-purple-800 mb-4">TED Talk Script</h3>
                    <div className="text-gray-800 whitespace-pre-wrap font-sans">
                      {tedTalkScript}
                    </div>
                  </div>
                )}

                {/* Fallback for old result format */}
                {result &&
                  attackPoints.length === 0 &&
                  tensionResolutionPoints.length === 0 &&
                  !conclusion &&
                  !references && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <pre className="text-gray-800 whitespace-pre-wrap font-sans">{result}</pre>
                    </div>
                  )}
              </div>
            </div>
          ) : (
            <div></div>
            // <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md h-full flex items-center justify-center">
            //   <p className="text-gray-500 text-center">
            //     Story Flow Outline will appear here once generated
            //   </p>
            // </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
