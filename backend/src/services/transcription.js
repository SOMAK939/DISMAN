// const speech = require('@google-cloud/speech');
// const { v2: Translate } = require('@google-cloud/translate');
// const fs = require('fs');
// const path = require('path');

// // Initialize clients
// const speechClient = new speech.SpeechClient({
//   keyFilename: path.join(__dirname, '../config/ai-crisis-management-system-ebb442b040fb.json'),
// });

// const translate = new Translate.Translate({
//   keyFilename: path.join(__dirname, '../config/ai-crisis-management-system-ebb442b040fb.json'),
// });

// const SUPPORTED_LANGUAGES = ['en-US', 'es-ES', 'fr-FR', 'hi-IN', 'bn-IN'];

// /**
//  * Transcribes an audio file, automatically identifying the language from a predefined list.
//  * @param {string} filePath Path to the audio file.
//  * @returns {Promise<string|null>} The transcribed text in its original language.
//  */
// const transcribeAudioFile = async (filePath) => {
//   try {
//     console.log('--- [Step 1a] Sending audio for auto-detection multilingual transcription ---');
//     console.log(`Language pool: ${SUPPORTED_LANGUAGES.join(', ')}`);

//     const file = fs.readFileSync(filePath);
//     const audioBytes = file.toString('base64');
//     const audio = { content: audioBytes };

//     const config = {
//       encoding: 'LINEAR16',
//       languageCode: 'bn-IN', // default language (acts as a hint)
//       alternativeLanguageCodes: SUPPORTED_LANGUAGES,
//       enableAutomaticPunctuation: true,
//     };

//     const request = { audio, config };
//     const [response] = await speechClient.recognize(request);

//     if (!response.results || response.results.length === 0) {
//       console.warn('Google Speech-to-Text returned no results.');
//       return null;
//     }

//     const transcription = response.results
//       .map(result => result.alternatives[0].transcript)
//       .join('\n');

//     const languageDetected = response.results[0].languageCode || 'unknown';
//     console.log(`Detected speech language: ${languageDetected}`);
//     console.log('Original transcription successful:', `"${transcription}"`);

//     return transcription;

//   } catch (err) {
//     console.error('ERROR during Google transcription:', err);
//     return null;
//   }
// };

// /**
//  * Translates a given text to English if it's not already in English.
//  * Uses the stable v2 Translation API (no IAM issues).
//  * @param {string} text The text to translate.
//  * @returns {Promise<string>} The translated English text.
//  */
// const translateTextToEnglish = async (text) => {
//   if (!text || text.trim() === '') return text;

//   console.log('--- [Step 1b] Detecting language and translating to English if needed ---');
//   try {
//     const [detection] = await translate.detect(text);
//     const detectedLanguage = detection.language || 'en';
//     console.log(`Detected language: ${detectedLanguage}`);

//     if (detectedLanguage.startsWith('en')) {
//       console.log('Text is already in English. Skipping translation.');
//       return text;
//     }

//     const [translation] = await translate.translate(text, 'en');
//     console.log(`Translated text: "${translation}"`);
//     return translation;
//   } catch (error) {
//     console.error('ERROR during translation:', error.message || error);
//     return text;
//   }
// };

// module.exports = { transcribeAudioFile, translateTextToEnglish };


// transcriptions.js
const speech = require('@google-cloud/speech');
const { v2: Translate } = require('@google-cloud/translate');
const fs = require('fs');
const path = require('path');

const speechClient = new speech.SpeechClient({
  keyFilename: path.join(__dirname, '../config/ai-crisis-management-system-ebb442b040fb.json'),
});

const translate = new Translate.Translate({
  keyFilename: path.join(__dirname, '../config/ai-crisis-management-system-ebb442b040fb.json'),
});

const SUPPORTED_LANGUAGES = ['en-US', 'es-ES', 'fr-FR', 'hi-IN', 'bn-IN'];

/**
 * Helper: call recognize with a given languageCode and return an object with transcript and score.
 * Score uses confidence if available; fallback to transcript length heuristic.
 */
async function recognizeWithLanguage(audio, languageCode) {
  const config = {
    encoding: 'LINEAR16',
    languageCode,
    enableAutomaticPunctuation: true,
    // Do NOT set model to something that isn't supported for all languages
  };
  const request = { audio, config };

  try {
    const [response] = await speechClient.recognize(request);
    if (!response || !response.results || response.results.length === 0) {
      return { languageCode, transcript: '', score: 0, response };
    }

    // Build transcript and compute score
    const parts = response.results.map(r => r.alternatives[0]);
    const transcript = parts.map(p => p.transcript).join(' ');
    // Confidence might be missing; sum confidences (if present) or use transcript length
    let score = 0;
    const confidences = parts.map(p => (typeof p.confidence === 'number' ? p.confidence : null));
    if (confidences.some(c => c !== null)) {
      // average confidence times length factor
      const avgConf = confidences.reduce((s, c) => s + (c || 0), 0) / confidences.length;
      score = avgConf * transcript.split(/\s+/).length;
    } else {
      // fallback heuristic: number of words (longer = better) with small penalty for many unknown tokens
      score = transcript.split(/\s+/).length;
    }

    return { languageCode, transcript, score, response };
  } catch (err) {
    // Treat API errors as zero score so another language can win
    console.warn(`recognizeWithLanguage failed for ${languageCode}:`, err.message || err);
    return { languageCode, transcript: '', score: 0, response: null, error: err };
  }
}

/**
 * Extract short sample bytes from original audio file buffer.
 * NOTE: This is a naive take: we just use the first N bytes of the base64 data.
 * For higher fidelity you'd actually slice duration in seconds (needs audio decoding), but this is
 * good enough if audio format is linear PCM and you only need a short snippet.
 */
function shortSampleFromBuffer(buffer, approxBytes = 16000 * 2 * 3) {
  // approxBytes default attempts ~5s of 16kHz 16-bit PCM: 16000 samples * 2 bytes/sample * 5s
  if (buffer.length <= approxBytes) return buffer;
  return buffer.slice(0, approxBytes);
}

/**
 * Main: transcribe audio with automatic language detection.
 * Strategy:
 *  1. Read file as buffer and build audio object.
 *  2. Create a short sample buffer and run recognition for each SUPPORTED_LANGUAGES on the short sample.
 *  3. Pick language with best score.
 *  4. Run full transcription once with winning languageCode.
 */
const transcribeAudioFile = async (filePath) => {
  try {
    console.log('--- [Step 1a] Auto-detecting language (short-sample) ---');
    console.log(`Language pool: ${SUPPORTED_LANGUAGES.join(', ')}`);

    const fileBuffer = fs.readFileSync(filePath);
    const audioBytesFull = fileBuffer.toString('base64');
    const audioFull = { content: audioBytesFull };

    // build short sample buffer and then base64-encode it
    const sampleBuffer = shortSampleFromBuffer(fileBuffer, 16000 * 2 * 4); // ~4 seconds
    const audioSample = { content: sampleBuffer.toString('base64') };

    // Step 1: sample-detect over supported languages (sequential to avoid high parallel load)
    const results = [];
    for (const lang of SUPPORTED_LANGUAGES) {
      // If some languages will fail due to unsupported model, we rely on error handling in recognizeWithLanguage
      const res = await recognizeWithLanguage(audioSample, lang);
      console.log(`Sample try ${lang} -> score=${res.score}, transcript="${(res.transcript||'').slice(0,80)}"`);
      results.push(res);
    }

    // pick the language with highest score
    results.sort((a, b) => b.score - a.score);
    const winner = results[0];
    if (!winner || winner.score === 0) {
      console.warn('No good language detection result from sample. Defaulting to en-US');
      winner.languageCode = 'en-US';
    }
    console.log(`Selected language for full transcript: ${winner.languageCode}`);

    // Step 2: full transcription with the winner language
    const config = {
      encoding: 'LINEAR16',
      languageCode: winner.languageCode,
      enableAutomaticPunctuation: true,
      // do not set model to something unsupported
    };
    const request = { audio: audioFull, config };

    const [fullResponse] = await speechClient.recognize(request);
    if (!fullResponse || !fullResponse.results || fullResponse.results.length === 0) {
      console.warn('Google Speech-to-Text returned no results for full transcription.');
      return null;
    }

    const transcription = fullResponse.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    const languageDetected = fullResponse.results[0].languageCode || winner.languageCode || 'unknown';
    console.log(`Detected speech language (final): ${languageDetected}`);
    console.log('Original transcription successful:', `"${transcription}"`);

    return transcription;
  } catch (err) {
    console.error('ERROR during Google transcription:', err);
    return null;
  }
};

/**
 * Translate text to English (v2)
 */
const translateTextToEnglish = async (text) => {
  if (!text || text.trim() === '') return text;
  console.log('--- [Step 1b] Detecting language and translating to English if needed ---');
  try {
    const [detection] = await translate.detect(text);
    const detectedLanguage = detection.language || 'en';
    console.log(`Detected language: ${detectedLanguage}`);
    if (detectedLanguage.startsWith('en')) {
      console.log('Text is already in English. Skipping translation.');
      return text;
    }
    const [translation] = await translate.translate(text, 'en');
    console.log(`Translated text: "${translation}"`);
    return translation;
  } catch (error) {
    console.error('ERROR during translation:', error.message || error);
    return text;
  }
};

module.exports = { transcribeAudioFile, translateTextToEnglish };
