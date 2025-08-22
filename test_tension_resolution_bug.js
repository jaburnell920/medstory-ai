const fetch = require('node-fetch');

const testData = {
  action: "start",
  coreStoryConcept: `Core Story Concept Candidate #1

TENSION

Despite the myriad antihypertensives, millions silently suffer from undiagnosed low-grade inflammation driving vascular damage. This hidden factor lurks beneath measured blood pressures, evading traditional treatments and silently accelerating cardiovascular risk.

RESOLUTION

Lisinopril, beyond blood pressure control, uniquely moderates this inflammation. By directly inhibiting angiotensin-converting enzyme (ACE), lisinopril reduces pro-inflammatory pathways, delivering comprehensive cardiovascular protection and addressing the silent inflammation plaguing hypertensive patients.`,
  audience: "cardiologists"
};

async function testTensionResolutionAPI() {
  try {
    console.log('Testing tension-resolution API with start action...');
    console.log('Request data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/tension-resolution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    console.log('\n=== API Response ===');
    console.log(JSON.stringify(result, null, 2));
    
    // Check if the response has proper formatting
    const hasAttackPointHeader = /Attack Point #\d+/i.test(result.result);
    const hasFollowUpQuestion = /Would you like to modify this Attack Point/i.test(result.result);
    
    console.log('\n=== Analysis ===');
    console.log('Has Attack Point header:', hasAttackPointHeader);
    console.log('Has follow-up question:', hasFollowUpQuestion);
    
    if (hasAttackPointHeader && hasFollowUpQuestion) {
      console.log('✅ Response is properly formatted!');
    } else {
      console.log('❌ Response is missing proper formatting');
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testTensionResolutionAPI();