// Load .env file
require('dotenv').config(); 
const { transcribeAudioFile, translateTextToEnglish } = require('./src/services/transcription');
const { analyzeTranscript } = require('./src/services/analysis');
const { logIncident } = require('./src/services/database');

// --- CONFIGURATION ---
// IMPORTANT: Change this path to your test audio file!
// This can now be a WAV file in English, Spanish, Hindi, Bengali, etc.
// Remember to convert MP3s to 16000Hz mono WAV first with FFmpeg.
const AUDIO_FILE_PATH = 'D:/Projects/Project_1/Test/somak_test_3.wav'; 
// -------------------

const runFullPipeline = async () => {
  console.log('Starting MULTILINGUAL emergency call processing pipeline...\n');
  
  // Step 1a: Transcribe the audio file (language is auto-detected)
  const originalTranscript = await transcribeAudioFile(AUDIO_FILE_PATH);
  if (!originalTranscript) {
    console.error('\nPipeline failed at transcription step. Exiting.');
    return;
  }

  // Step 1b: Translate the transcript to English
  const englishTranscript = await translateTextToEnglish(originalTranscript, process.env.GOOGLE_CLOUD_PROJECT_ID);
  if (!englishTranscript) {
    console.error('\nPipeline failed at translation step. Exiting.');
    return;
  }

  console.log('\n'); // Add a space for readability

  // Step 2: Analyze the final ENGLISH transcript
  const emergencyData = await analyzeTranscript(englishTranscript);
  if (!emergencyData) {
    console.error('\nPipeline failed at analysis step. Exiting.');
    return;
  }

  // Step 3: Log the incident data to Firebase
  await logIncident(emergencyData);


  // Final Step: Display the result
  console.log('\n--- ✅ PIPELINE SUCCESSFUL ---');
  console.log('Final structured data:');
  console.log(JSON.stringify(emergencyData, null, 2));
  console.log('----------------------------');
};

runFullPipeline();