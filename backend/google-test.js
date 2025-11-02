require('dotenv').config(); // Load .env file from the current directory
const speech = require('@google-cloud/speech');
const fs = require('fs');

// --- CONFIGURATION ---
// PASTE THE EXACT PATH TO YOUR MP3 FILE HERE
const filePath = 'D:/Projects/Project_1/Test/Sports.wav';
// -------------------

async function main() {
  const client = new speech.SpeechClient();
  
  console.log(`Attempting to transcribe: ${filePath}`);

  try {
    const file = fs.readFileSync(filePath);
    const audioBytes = file.toString('base64');

    const audio = { content: audioBytes };
    // const config = {
    //     encoding: 'MP3',
    //     languageCode: 'en-IN',
    //     enableAutomaticPunctuation: true,
    //     model: 'default',
    // };
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 48000, // This specific file is 8000Hz
      languageCode: 'en-US',
    };
    const request = { audio, config };

    const [response] = await client.recognize(request);
    
    if (!response.results || response.results.length === 0) {
        console.log('--- RESULT: Google API returned NO transcription. ---');
        return;
    }

    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
    console.log('--- RESULT ---');
    console.log(`Transcription: ${transcription}`);

  } catch (error) {
    console.error('--- ERROR ---');
    console.error('An error occurred:', error);
  }
}

main();