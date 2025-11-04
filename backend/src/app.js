require('dotenv').config();
const express = require('express');
const { twiml } = require('twilio');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Import your existing AI pipeline services
const { transcribeAudioFile, translateTextToEnglish } = require('./services/transcription');
const { analyzeTranscript } = require('./services/analysis');
const { logIncident } = require('./services/database');

// Get Twilio credentials from .env file
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error("CRITICAL ERROR: Twilio credentials are not set in the .env file.");
  process.exit(1); // Exit if credentials are not found
}

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: false }));

// --- ENDPOINT 1: Handles the initial incoming call ---
app.post('/voice', (req, res) => {
  console.log('--- Incoming call received ---');
  const twimlResponse = new twiml.VoiceResponse();

  twimlResponse.say('After the beep, please state the nature of your emergency.');

  // Record the call in WAV format, single channel (mono)
  twimlResponse.record({
    maxLength: 30,
    finishOnKey: '*',
    recordingStatusCallback: '/recording-complete',
    recordingFileFormat: 'wav',
    recordingChannels: 'mono', // Ensure the audio is mono
  });
  
  twimlResponse.hangup();

  res.type('text/xml');
  res.send(twimlResponse.toString());
});


// --- ENDPOINT 2: Receives the recording URL after the call ends ---
app.post('/recording-complete', async (req, res) => {
  const recordingUrl = req.body.RecordingUrl;
  console.log(`--- Recording complete. URL: ${recordingUrl} ---`);

  // --- ADD THIS DEBUGGING BLOCK ---
  console.log("Authenticating with the following credentials:");
  console.log(`Account SID: ${accountSid}`); 
  // We'll only log a portion of the token for security
  console.log(`Auth Token (first 5 chars): ${authToken ? authToken.substring(0, 5) + '...' : 'NOT FOUND'}`);
  // --- END DEBUGGING BLOCK ---
  
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  
  const tempFilePath = path.join(tempDir, `rec_${Date.now()}.wav`);

  try {
    // 1. Download the WAV file from Twilio with Authentication
    console.log('Downloading WAV file...');
    const response = await axios({
      method: 'get',
      url: recordingUrl, // Twilio URL already provides the correct format
      responseType: 'stream',
      auth: { // This block is the critical fix for the 401 error
        username: accountSid,
        password: authToken,
      }
    });

    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    console.log(`WAV file saved to ${tempFilePath}`);

    // --- TRIGGER THE FULL AI PIPELINE (No FFmpeg needed) ---
    // 2a. Transcribe the downloaded WAV file
    // NOTE: Ensure your transcription.js config uses 'LINEAR16' and the correct sample rate.
    // Twilio phone call audio is typically 8000Hz. Let's update the transcription call.
    const originalTranscript = await transcribeAudioFile(tempFilePath);
    if (!originalTranscript) throw new Error("Transcription failed.");
    
    // 2b. Translate the transcript to English
    const englishTranscript = await translateTextToEnglish(originalTranscript, process.env.GOOGLE_CLOUD_PROJECT_ID);
    if (!englishTranscript) throw new Error("Translation failed.");

    // 3. Analyze the English transcript
    const emergencyData = await analyzeTranscript(englishTranscript);
    if (!emergencyData) throw new Error("Analysis failed.");
    
    // 4. Log to database
    await logIncident(emergencyData);
    
    console.log('--- ✅ Full pipeline successful for live call ---');

  } catch (error) {
    console.error('--- ❌ Pipeline failed for live call ---', error);
  } finally {
    // 5. Clean up the temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log(`Cleaned up temporary file: ${tempFilePath}`);
    }
  }

  res.status(200).send(); // Acknowledge receipt to Twilio
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
  console.log('Make sure ngrok is running and pointing to this port.');
});