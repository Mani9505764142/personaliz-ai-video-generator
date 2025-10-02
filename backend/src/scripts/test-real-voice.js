const axios = require('axios');
const fs = require('fs');

async function testVoiceGeneration() {
    console.log('🎤 Testing ElevenLabs Voice Generation...');
    
    try {
        const apiKey = 'sk_e8ddea94f765c0038c4c4382ece02ebfcd18602386f81c39';
        const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel's voice
        const text = 'Hello suthari sai manikanta vivek from tiruvuru! Welcome to our personalized video service.';
        
        console.log('📡 Making API request to ElevenLabs...');
        
        const response = await axios({
            method: 'post',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            data: {
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.8
                }
            },
            responseType: 'arraybuffer'
        });
        
        console.log('✅ API Response received!');
        console.log('📊 Response size:', response.data.length, 'bytes');
        
        // Create uploads directory if it doesn't exist
        const uploadsDir = './uploads';
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Save the audio file
        const audioPath = './uploads/personalized-audio-test.mp3';
        fs.writeFileSync(audioPath, response.data);
        
        console.log('✅ Voice generation successful!');
        console.log('📁 Audio saved to:', audioPath);
        console.log('🎧 Play this file to hear the personalized message!');
        
        return audioPath;
        
    } catch (error) {
        console.error('❌ Voice generation failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data?.toString());
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Run the test
testVoiceGeneration();
