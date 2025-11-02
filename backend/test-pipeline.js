// Load .env file from the current directory
require('dotenv').config(); 
const { transcribeAudioFile } = require('./src/services/transcription');
const { analyzeTranscript } = require('./src/services/analysis');
const { logIncident } = require('./src/services/database');

// --- CONFIGURATION ---
// IMPORTANT: Change this path to your test audio file!
const AUDIO_FILE_PATH = 'D:/Projects/Project_1/Test/Sports.wav'; 
// -------------------

const runFullPipeline = async () => {
  console.log('Starting emergency call processing pipeline...\n');
  
  // Step 1: Transcribe the audio file
  const transcript = await transcribeAudioFile(AUDIO_FILE_PATH);

  if (!transcript) {
    console.error('\nPipeline failed at transcription step. Exiting.');
    return;
  }

  console.log('\n'); // Add a space for readability

  // Step 2: Analyze the resulting transcript
  const emergencyData = await analyzeTranscript(transcript);
  if (emergencyData) {
      await logIncident(emergencyData);
  }

  if (!emergencyData) {
    console.error('\nPipeline failed at analysis step. Exiting.');
    return;
  }

  // Final Step: Display the result
  console.log('\n--- ✅ PIPELINE SUCCESSFUL ---');
  console.log('Final structured data:');
  console.log(JSON.stringify(emergencyData, null, 2)); // Pretty-print the JSON
  console.log('----------------------------');
};

runFullPipeline();