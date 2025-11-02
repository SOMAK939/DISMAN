const speech = require('@google-cloud/speech');
const fs = require('fs');

// The client library will automatically find and use the credentials file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable.
const client = new speech.SpeechClient();

const transcribeAudioFile = async (filePath) => {
  try {
    console.log('--- [Step 1] Sending audio to Google Cloud Speech-to-Text ---');

    const file = fs.readFileSync(filePath);
    console.log(`Successfully read file. Buffer size: ${file.length} bytes.`);
    const audioBytes = file.toString('base64');

    const audio = { content: audioBytes };

    // const config = {
    //   encoding: 'MP3',
      
    //   languageCode: 'en-US',
    //   model: 'telephony',
    // };
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 48000, // This specific file is 8000Hz
      languageCode: 'en-US',
    };

    const request = { audio, config };

    const [response] = await client.recognize(request);
    
    if (!response.results || response.results.length === 0) {
      console.warn('Google Speech-to-Text returned no results.');
      return null;
    }

    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
    
    console.log('Transcription successful:', `"${transcription}"`);
    return transcription;

  } catch (err) {
    console.error('ERROR during Google transcription:', err);
    return null;
  }
};

module.exports = { transcribeAudioFile };