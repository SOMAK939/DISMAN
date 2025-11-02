const OpenAI = require('openai');
const { ANALYSIS_SYSTEM_PROMPT, EMERGENCY_LOG_TOOL } = require('../utils/prompts');

// This client is configured to use OpenRouter by pointing the base URL
// and using the OpenRouter API key.
const openRouterClient = new OpenAI({
    baseURL: process.env.OPENROUTER_BASE_URL,
    apiKey: process.env.OPENROUTER_API_KEY,
});

const analyzeTranscript = async (transcript) => {
  const modelToUse = process.env.OPENROUTER_MODEL;
  try {
    console.log(`--- [Step 2] Sending transcript to ${modelToUse} via OpenRouter ---`);
    
    const response = await openRouterClient.chat.completions.create({
      model: modelToUse, 
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: transcript },
      ],
      tools: [EMERGENCY_LOG_TOOL],
      tool_choice: { type: 'function', function: { name: 'log_emergency' } },
    });

    const toolCall = response.choices[0].message.tool_calls[0];
    if (toolCall && toolCall.function.name === 'log_emergency') {
        const emergencyDetails = JSON.parse(toolCall.function.arguments);
        console.log('Analysis successful. Extracted details:');
        return emergencyDetails;
    }
    
    console.warn("LLM did not call the 'log_emergency' tool correctly.");
    return null;

  } catch (err) {
    console.error('ERROR during OpenRouter analysis:', err);
    return null;
  }
};

module.exports = { analyzeTranscript };