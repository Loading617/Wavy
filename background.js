let audioContext;
let analyser;
let source;
let isMusicPlaying = false;

async function captureAudio() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabCapture.capture({ audio: true }, (stream) => {
        if (!stream) return console.error("Failed to capture audio");

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        source.connect(analyser);

        analyser.fftSize = 2048;
        detectMusic();
    });
}

function detectMusic() {
    const buffer = new Uint8Array(analyser.frequencyBinCount);
    
    function checkAudio() {
        analyser.getByteFrequencyData(buffer);
        const average = buffer.reduce((sum, value) => sum + value, 0) / buffer.length;
        
        if (average > 10) {
            if (!isMusicPlaying) {
                isMusicPlaying = true;
                console.log("Music detected! Start visualizer.");
                chrome.runtime.sendMessage({ action: "music_detected" });
            }
        } else {
            if (isMusicPlaying) {
                isMusicPlaying = false;
                console.log("No music detected. Stop visualizer.");
                chrome.runtime.sendMessage({ action: "music_stopped" });
            }
        }
        requestAnimationFrame(checkAudio);
    }

    checkAudio();
}

chrome.action.onClicked.addListener(() => {
    captureAudio();
});