import { NextRequest, NextResponse } from 'next/server';

interface StoryPoint {
  label: string;
  tension: string;
  resolution: string;
  tensionValue: number;
  resolutionValue: number;
}

interface StoryFlowMapData {
  attackPoint: string;
  tensionResolutionPoints: string[];
  coreStoryConcept: string;
  storyPoints: StoryPoint[];
}

// Helper function to assign tension values (70-100)
function assignTensionValue(text: string): number {
  // Simple heuristic based on text content and emotional weight
  const emotionalWords = [
    'critical',
    'urgent',
    'severe',
    'dangerous',
    'risk',
    'failure',
    'crisis',
    'emergency',
    'threat',
    'concern',
  ];
  const urgencyWords = [
    'immediately',
    'rapidly',
    'quickly',
    'sudden',
    'acute',
    'progressive',
    'deteriorating',
  ];

  let score = 75; // Base score

  const lowerText = text.toLowerCase();

  // Increase score for emotional/urgency words
  emotionalWords.forEach((word) => {
    if (lowerText.includes(word)) score += 3;
  });

  urgencyWords.forEach((word) => {
    if (lowerText.includes(word)) score += 2;
  });

  // Adjust based on text length (longer text might indicate more complexity)
  if (text.length > 200) score += 5;
  if (text.length > 400) score += 5;

  // Ensure within bounds
  return Math.min(100, Math.max(70, score));
}

// Helper function to assign resolution values (10-50)
function assignResolutionValue(text: string): number {
  // Simple heuristic based on resolution strength
  const reassuranceWords = [
    'effective',
    'successful',
    'improved',
    'resolved',
    'controlled',
    'stable',
    'safe',
    'clear',
    'confident',
  ];
  const clarityWords = [
    'demonstrated',
    'proven',
    'established',
    'confirmed',
    'validated',
    'evidence',
    'data',
    'study',
  ];

  let score = 30; // Base score

  const lowerText = text.toLowerCase();

  // Increase score for reassurance/clarity words
  reassuranceWords.forEach((word) => {
    if (lowerText.includes(word)) score += 2;
  });

  clarityWords.forEach((word) => {
    if (lowerText.includes(word)) score += 2;
  });

  // Adjust based on text length
  if (text.length > 150) score += 3;
  if (text.length > 300) score += 3;

  // Ensure within bounds
  return Math.min(50, Math.max(10, score));
}

// Helper function to parse tension-resolution points
function parseTensionResolutionPoints(points: string[]): StoryPoint[] {
  const storyPoints: StoryPoint[] = [];

  points.forEach((point, index) => {
    // Extract tension and resolution from the point text
    const lines = point.split('\n').filter((line) => line.trim());
    let tension = '';
    let resolution = '';
    let currentSection = '';

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.toLowerCase().includes('tension:')) {
        currentSection = 'tension';
        tension = trimmedLine.replace(/^.*tension:\s*/i, '');
      } else if (trimmedLine.toLowerCase().includes('resolution:')) {
        currentSection = 'resolution';
        resolution = trimmedLine.replace(/^.*resolution:\s*/i, '');
      } else if (currentSection === 'tension') {
        tension += ' ' + trimmedLine;
      } else if (currentSection === 'resolution') {
        resolution += ' ' + trimmedLine;
      }
    });

    if (tension && resolution) {
      storyPoints.push({
        label: (index + 1).toString(),
        tension: tension.trim(),
        resolution: resolution.trim(),
        tensionValue: assignTensionValue(tension),
        resolutionValue: assignResolutionValue(resolution),
      });
    }
  });

  return storyPoints;
}

// Function to create story flow data from memory data
interface MemoryData {
  coreStoryConcept: string;
  attackPoints: string[];
  tensionResolutionPoints: string[];
}

function createStoryFlowDataFromMemory(memoryData: MemoryData): StoryFlowMapData {
  const { coreStoryConcept, attackPoints, tensionResolutionPoints } = memoryData;

  // Use the first attack point if available
  const attackPoint = attackPoints && attackPoints.length > 0 ? attackPoints[0] : '';

  // Parse tension-resolution points
  const parsedPoints = parseTensionResolutionPoints(tensionResolutionPoints || []);

  // Add Attack Point
  const attackPointData: StoryPoint = {
    label: 'AP',
    tension: attackPoint,
    resolution: '',
    tensionValue: assignTensionValue(attackPoint),
    resolutionValue: 0,
  };

  // Add Core Story Concept
  const cscData: StoryPoint = {
    label: 'CSC',
    tension: '',
    resolution: coreStoryConcept,
    tensionValue: 0,
    resolutionValue: 25, // Fixed at 25 as per requirements
  };

  return {
    attackPoint,
    tensionResolutionPoints: tensionResolutionPoints || [],
    coreStoryConcept,
    storyPoints: [attackPointData, ...parsedPoints, cscData],
  };
}

// Mock data for testing when localStorage data is not available
function getMockStoryFlowData(): StoryFlowMapData {
  const mockAttackPoint =
    "In the pediatric ICU, 8-year-old Emma's leukemia cells had survived every conventional treatment. Her oncologist prepared to discuss palliative care, but hidden within Emma's immune system lay engineered T-cells waiting to launch a precision strike.";

  const mockTensionResolutionPoints = [
    "Tension-Resolution #1: Treatment Resistance\nTension: Traditional chemotherapy fails in 30% of pediatric leukemia cases, leaving families with limited options and declining hope.\nResolution: CAR-T cell therapy offers a revolutionary approach by reprogramming the patient's own immune cells to target cancer more precisely.",

    'Tension-Resolution #2: Safety Concerns\nTension: Early CAR-T trials showed severe side effects including cytokine release syndrome, raising questions about treatment safety in children.\nResolution: Advanced monitoring protocols and improved cell engineering have significantly reduced adverse events while maintaining efficacy.',

    "Tension-Resolution #3: Access and Timing\nTension: CAR-T therapy requires specialized facilities and can take weeks to manufacture, during which time the patient's condition may deteriorate.\nResolution: Point-of-care manufacturing and streamlined protocols are reducing treatment delays from months to days.",
  ];

  const mockCoreStoryConcept =
    "CAR-T cell therapy represents a paradigm shift in pediatric oncology, transforming the patient's immune system into a precision weapon against cancer.";

  const parsedPoints = parseTensionResolutionPoints(mockTensionResolutionPoints);

  // Add Attack Point
  const attackPointData: StoryPoint = {
    label: 'AP',
    tension: mockAttackPoint,
    resolution: '',
    tensionValue: assignTensionValue(mockAttackPoint),
    resolutionValue: 0,
  };

  // Add Core Story Concept
  const cscData: StoryPoint = {
    label: 'CSC',
    tension: '',
    resolution: mockCoreStoryConcept,
    tensionValue: 0,
    resolutionValue: 25, // Fixed at 25 as per requirements
  };

  return {
    attackPoint: mockAttackPoint,
    tensionResolutionPoints: mockTensionResolutionPoints,
    coreStoryConcept: mockCoreStoryConcept,
    storyPoints: [attackPointData, ...parsedPoints, cscData],
  };
}

export async function POST(request: NextRequest) {
  try {
    const { action, modifications, currentData, memoryData } = await request.json();

    if (action === 'create') {
      let storyFlowData;

      // If memory data is provided, use it; otherwise fall back to mock data
      if (
        memoryData &&
        memoryData.coreStoryConcept &&
        (memoryData.attackPoints?.length > 0 || memoryData.tensionResolutionPoints?.length > 0)
      ) {
        storyFlowData = createStoryFlowDataFromMemory(memoryData);
      } else {
        // Fall back to mock data for testing
        storyFlowData = getMockStoryFlowData();
      }

      return NextResponse.json({
        success: true,
        storyFlowData,
      });
    }

    if (action === 'modify' && currentData && modifications) {
      // Handle modifications to the story flow map
      const modifiedData = { ...currentData };

      // Simple modification logic - in a real implementation, this would use AI to interpret modifications
      const modificationLower = modifications.toLowerCase();

      if (modificationLower.includes('add') && modificationLower.includes('point')) {
        // Add a new tension-resolution point
        const newPoint: StoryPoint = {
          label: (modifiedData.storyPoints.length - 1).toString(), // -1 to account for CSC
          tension: 'New tension point based on user request: ' + modifications,
          resolution: 'New resolution addressing the added tension point.',
          tensionValue: 80,
          resolutionValue: 35,
        };

        // Insert before CSC (last element)
        const csc = modifiedData.storyPoints.pop();
        modifiedData.storyPoints.push(newPoint);
        if (csc) modifiedData.storyPoints.push(csc);

        // Renumber all tension-resolution points
        let pointNumber = 1;
        modifiedData.storyPoints.forEach((point: StoryPoint) => {
          if (point.label !== 'AP' && point.label !== 'CSC') {
            point.label = pointNumber.toString();
            pointNumber++;
          }
        });
      }

      if (modificationLower.includes('remove') || modificationLower.includes('delete')) {
        // Remove the last tension-resolution point
        const csc = modifiedData.storyPoints.pop(); // Remove CSC temporarily
        if (modifiedData.storyPoints.length > 1) {
          // Keep at least AP
          // Find and remove the last tension-resolution point
          for (let i = modifiedData.storyPoints.length - 1; i >= 0; i--) {
            if (modifiedData.storyPoints[i].label !== 'AP') {
              modifiedData.storyPoints.splice(i, 1);
              break;
            }
          }
        }
        if (csc) modifiedData.storyPoints.push(csc); // Add CSC back

        // Renumber remaining points
        let pointNumber = 1;
        modifiedData.storyPoints.forEach((point: StoryPoint) => {
          if (point.label !== 'AP' && point.label !== 'CSC') {
            point.label = pointNumber.toString();
            pointNumber++;
          }
        });
      }

      if (modificationLower.includes('tension') && modificationLower.includes('higher')) {
        // Increase tension values
        modifiedData.storyPoints.forEach((point: StoryPoint) => {
          if (point.tensionValue > 0) {
            point.tensionValue = Math.min(100, point.tensionValue + 10);
          }
        });
      }

      if (modificationLower.includes('tension') && modificationLower.includes('lower')) {
        // Decrease tension values
        modifiedData.storyPoints.forEach((point: StoryPoint) => {
          if (point.tensionValue > 0) {
            point.tensionValue = Math.max(70, point.tensionValue - 10);
          }
        });
      }

      return NextResponse.json({
        success: true,
        storyFlowData: modifiedData,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action or missing data',
    });
  } catch (error) {
    console.error('Error in story flow map API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    });
  }
}
