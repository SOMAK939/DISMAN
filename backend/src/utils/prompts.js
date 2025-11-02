// backend/src/utils/prompts.js
const ANALYSIS_SYSTEM_PROMPT = `You are an expert emergency call analysis system. Your task is to extract critical information from a transcribed emergency call. You must identify the crisis type, the location, and the language of the caller. Respond only in the JSON format defined by the 'log_emergency' tool.`;

const EMERGENCY_LOG_TOOL = {
    type: 'function',
    function: {
        name: 'log_emergency',
        description: 'Logs the details of an emergency call.',
        parameters: {
            type: 'object',
            properties: {
                crisis_type: {
                    type: 'string',
                    description: 'The type of emergency (e.g., "Fire", "Medical", "Police").',
                },
                location: {
                    type: 'string',
                    description: 'The specific location of the emergency (e.g., "123 Main Street").',
                },
                urgency: {
                    type: 'string',
                    enum: ['Low', 'Medium', 'High', 'Critical'],
                    description: 'The assessed urgency level of the situation.',
                },
                summary: {
                    type: 'string',
                    description: 'A brief, one-sentence summary of the situation.'
                }
            },
            required: ['crisis_type', 'location', 'urgency', 'summary'],
        },
    },
};

module.exports = { ANALYSIS_SYSTEM_PROMPT, EMERGENCY_LOG_TOOL };