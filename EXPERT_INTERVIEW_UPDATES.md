# Expert Interview Prompt Updates

## Summary of Changes

The expert interview feature has been updated to match the new prompt requirements. Here are the key changes made:

### Backend Changes (route.ts)

1. **Updated Expert Description Format**:
   - Changed from "I'll be simulating an interview..." to "I will create a simulation of an interview..."
   - Made the description more concise and in one sentence

2. **Enhanced Simulation Guidelines**:
   - Added "FOLLOW DILIGENTLY" emphasis
   - Added critical rule: "The expert should never ask the interviewer what they want to do next"
   - Enhanced the "never ask questions" rule with stronger language
   - Added conversational tone guidelines (avoid jargon, complex sentences)
   - Added requirement to be concise and not provide too many scientific details unless asked
   - Added guidelines about responding based on public material
   - Added requirement for consistent public persona
   - Added conversational structure guidelines (hit high points, not detailed lectures)
   - Added requirement to use complete sentences, not bullet points
   - Added periodic clarification check requirement
   - Added critical evaluation guidelines
   - Added requirement to avoid preliminary comments

3. **Updated End Interview Flow**:
   - Changed closing to "nice comment that you enjoyed the interview"
   - Added specific question: "Would you like me to extract key highlights from this interview?"

4. **Added Highlight Extraction Action**:
   - New API endpoint action for extracting highlights
   - Focuses only on medical content
   - Returns numbered list with blank lines between highlights
   - Uses lower temperature (0.3) for more focused extraction

### Frontend Changes (page.tsx)

1. **Updated Question Sequence**:
   - Fixed typo: "academic a practitioner" → "academic, a practitioner"
   - Questions remain the same as specified in the new prompt

2. **Added Expert Description Display**:
   - After collecting all 4 answers, displays the concise expert description
   - Adds "We'll now begin the interview" message with end interview instructions

3. **Enhanced Highlight Extraction Flow**:
   - Added `awaitingHighlightResponse` state to track when waiting for highlight response
   - Updated placeholder text to guide user when awaiting highlight response
   - Added logic to detect "yes" responses to highlight extraction question
   - Integrated with new API endpoint for highlight extraction

4. **Updated Key Points Display**:
   - Changed title from "Key Points from Interview" to "Key Highlights from Interview"
   - Shows highlights immediately when extracted (not dependent on interview end state)
   - Maintains checkbox functionality for selecting highlights

5. **Removed Old Functions**:
   - Removed the old `handleEndInterview` function
   - Removed `onEndInterview` prop from ChatInterface
   - Streamlined the flow to use the new highlight extraction process

### Key Features of New Implementation

1. **Stricter Guidelines**: The expert now has much stricter guidelines about not asking questions and maintaining a conversational tone without excessive jargon.

2. **Improved Flow**: The interview flow now includes the concise expert description and clear instructions about ending the interview.

3. **Medical-Focused Highlights**: The highlight extraction specifically focuses on medical content only, as required by the new prompt.

4. **Better User Experience**: Clear prompts guide the user through the highlight extraction process.

5. **Consistent Persona**: The expert maintains a consistent persona based on their public behavior and materials.

## Testing

The application has been tested and is running successfully. The TypeScript compilation passes without errors, and the expert interview page loads correctly with the updated initial message.

## Files Modified

1. `/src/app/api/expert-interview/route.ts` - Updated API logic and prompts
2. `/src/app/scientific-investigation/top-publications/page.tsx` - Updated frontend logic and UI

The implementation now fully matches the requirements specified in the new prompt.