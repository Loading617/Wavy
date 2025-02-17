let canvas = document.getElementById("visualizer");
let gl = canvas.getContext("webgl");

if (!gl) {
    alert("WebGL not supported!");
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let analyser = audioContext.createAnalyser();
analyser.fftSize = 256;
let bufferLength = analyser.frequencyBinCount;
let dataArray = new Uint8Array(bufferLength);

const vertexShaderSource = `
    attribute float frequency;
    void main() {
        gl_Position = vec4((gl_VertexID / 128.0) * 2.0 - 1.0, frequency / 255.0, 0, 1);
        gl_PointSize = 4.0;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    void main() {
        gl_FragColor = vec4(1.0, 0.5, 0.2, 1.0);
    }
`;

function compileShader(source, type) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

let vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
let fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
let shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);
gl.useProgram(shaderProgram);

function render() {
    analyser.getByteFrequencyData(dataArray);
    
    let freqData = new Float32Array(dataArray);
    gl.bufferData(gl.ARRAY_BUFFER, freqData, gl.DYNAMIC_DRAW);
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, bufferLength);
    
    requestAnimationFrame(render);
}

function startVisualizer(stream) {
    let source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    render();
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "music_detected") {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(startVisualizer);
    }
});