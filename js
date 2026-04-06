// ===== المتغيرات الأساسية =====
let camera = null;
let hands = null;
let isRunning = false;

const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const canvasCtx = canvas.getContext('2d');
const currentLetterDiv = document.getElementById('currentLetter');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const sentenceDiv = document.getElementById('sentence');
const speakBtn = document.getElementById('speakBtn');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const detectionStatus = document.getElementById('detectionStatus');
const toggleGuide = document.getElementById('toggleGuide');
const guideContent = document.getElementById('guideContent');
const lettersGuide = document.getElementById('lettersGuide');
const savedSection = document.getElementById('savedSection');
const savedList = document.getElementById('savedList');

let currentSentence = '';
let lastDetectedLetter = null;
let detectionTimer = null;
let detectionStartTime = null;
let stableDetectionTime = 1000; // ثانية واحدة

// ===== الحروف العربية =====
const arabicLetters = {
    'أ': { name: 'ألف', desc: 'قبضة مغلقة', fingers: [0,0,0,0,0] },
    'ب': { name: 'باء', desc: 'سبابة واحدة', fingers: [0,1,0,0,0] },
    'ت': { name: 'تاء', desc: 'سبابة ووسطى', fingers: [0,1,1,0,0] },
    'ث': { name: 'ثاء', desc: 'ثلاثة أصابع', fingers: [0,1,1,1,0] },
    'ج': { name: 'جيم', desc: 'أربعة أصابع', fingers: [0,1,1,1,1] },
    'ح': { name: 'حاء', desc: 'كف مفتوح', fingers: [1,1,1,1,1] },
    'خ': { name: 'خاء', desc: 'إبهام فقط', fingers: [1,0,0,0,0] },
    'د': { name: 'دال', desc: 'سبابة وخنصر', fingers: [0,1,0,0,1] },
    'ذ': { name: 'ذال', desc: 'إبهام وثلاثة', fingers: [1,1,1,1,0] },
    'ر': { name: 'راء', desc: 'خنصر فقط', fingers: [0,0,0,0,1] },
    'ز': { name: 'زاي', desc: 'سبابة ووسطى متباعدة', fingers: [0,1,1,0,0] },
    'س': { name: 'سين', desc: 'OK sign', fingers: [1,1,1,1,0] },
    'ش': { name: 'شين', desc: 'ثلاثة منحنية', fingers: [0,1,1,1,0] },
    'ص': { name: 'صاد', desc: 'كف مسطح', fingers: [1,1,1,1,1] },
    'ض': { name: 'ضاد', desc: 'كف منحني', fingers: [1,1,1,1,1] },
    'ط': { name: 'طاء', desc: 'دائرة صغيرة', fingers: [1,1,1,1,1] },
    'ظ': { name: 'ظاء', desc: 'أربعة منحنية', fingers: [1,1,1,1,0] },
    'ع': { name: 'عين', desc: 'خطاف', fingers: [1,1,1,1,1] },
    'غ': { name: 'غين', desc: 'سبابة للأسفل', fingers: [0,1,0,0,0] },
    'ف': { name: 'فاء', desc: 'قبضة جانبية', fingers: [0,0,0,0,0] },
    'ق': { name: 'قاف', desc: 'L shape', fingers: [1,1,0,0,0] },
    'ك': { name: 'كاف', desc: 'C shape', fingers: [1,1,1,1,1] },
    'ل': { name: 'لام', desc: 'سبابة قوية', fingers: [0,1,0,0,0] },
    'م': { name: 'ميم', desc: 'قرصة', fingers: [1,1,0,0,0] },
    'ن': { name: 'نون', desc: 'أربعة مسترخية', fingers: [1,1,1,1,0] },
    'ه': { name: 'هاء', desc: 'منحنية قليلاً', fingers: [1,1,1,1,1] },
    'و': { name: 'واو', desc: 'سبابة للأمام', fingers: [0,1,0,0,0] },
    'ي': { name: 'ياء', desc: 'سبابة وخنصر', fingers: [0,1,0,0,1] }
};

// ===== رسم اليد =====
function createHandSVG(letter, data) {
    const f = data.fingers;
    return `
        <svg class="hand-svg" viewBox="0 0 200 200">
            <ellipse cx="100" cy="120" rx="45" ry="60" fill="#ffd7a8" stroke="#d4a574" stroke-width="3"/>
            <rect x="45" y="${f[0] ? '70' : '100'}" width="20" height="${f[0] ? '70' : '40'}" rx="10" 
                  fill="${f[0] ? '#ffb347' : '#d4a574'}" transform="rotate(-30 55 100)"/>
            <rect x="70" y="${f[1] ? '30' : '80'}" width="18" height="${f[1] ? '80' : '50'}" rx="9" 
                  fill="${f[1] ? '#ffb347' : '#d4a574'}"/>
            <rect x="95" y="${f[2] ? '20' : '75'}" width="18" height="${f[2] ? '90' : '55'}" rx="9" 
                  fill="${f[2] ? '#ffb347' : '#d4a574'}"/>
            <rect x="118" y="${f[3] ? '25' : '80'}" width="18" height="${f[3] ? '85' : '50'}" rx="9" 
                  fill="${f[3] ? '#ffb347' : '#d4a574'}"/>
            <rect x="140" y="${f[4] ? '35' : '85'}" width="16" height="${f[4] ? '75' : '45'}" rx="8" 
                  fill="${f[4] ? '#ffb347' : '#d4a574'}"/>
            <text x="100" y="190" text-anchor="middle" font-size="24" font-weight="bold" fill="#667eea">${letter}</text>
        </svg>
    `;
}

// ===== إنشاء الدليل =====
function createLettersGuide() {
    lettersGuide.innerHTML = '';
    Object.keys(arabicLetters).forEach(letter => {
        const data = arabicLetters[letter];
        const card = document.createElement('div');
        card.className = 'letter-card';
        card.innerHTML = `
            <div class="letter-header">
                <div class="letter-name">${letter}</div>
                <div class="letter-label">${data.name}</div>
            </div>
            <div class="letter-visual">${createHandSVG(letter, data)}</div>
            <div class="letter-description">${data.desc}</div>
        `;
        lettersGuide.appendChild(card);
    });
}

// ===== كشف الأصابع =====
function countFingersUp(landmarks) {
    let fingers = { thumb: false, index: false, middle: false, ring: false, pinky: false };
    if (landmarks[4].x < landmarks[3].x - 0.05) fingers.thumb = true;
    if (landmarks[8].y < landmarks[6].y - 0.05) fingers.index = true;
    if (landmarks[12].y < landmarks[10].y - 0.05) fingers.middle = true;
    if (landmarks[16].y < landmarks[14].y - 0.05) fingers.ring = true;
    if (landmarks[20].y < landmarks[18].y - 0.05) fingers.pinky = true;
    return fingers;
}

function countTotal(fingers) {
    return (fingers.thumb ? 1 : 0) + (fingers.index ? 1 : 0) + (fingers.middle ? 1 : 0) + 
           (fingers.ring ? 1 : 0) + (fingers.pinky ? 1 : 0);
}

function distance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// ===== تحليل الحرف =====
function analyzeHandGesture(landmarks) {
    const fingers = countFingersUp(landmarks);
    const total = countTotal(fingers);
    const thumbIndex = distance(landmarks[4], landmarks[8]);
    const indexMiddle = distance(landmarks[8], landmarks[12]);
    
    if (total === 0) return 'أ';
    if (total === 1 && fingers.index && !fingers.thumb) return 'ب';
    if (total === 2 && fingers.index && fingers.middle && !fingers.ring && indexMiddle < 0.08) return 'ت';
    if (total === 3 && fingers.index && fingers.middle && fingers.ring && !fingers.thumb) return 'ث';
    if (total === 4 && !fingers.thumb) return 'ج';
    if (total === 5) return 'ح';
    if (total === 1 && fingers.thumb && !fingers.index) return 'خ';
    if (total === 2 && fingers.index && fingers.pinky && !fingers.middle) return 'د';
    if (total === 4 && fingers.thumb && !fingers.pinky) return 'ذ';
    if (total === 1 && fingers.pinky && !fingers.index) return 'ر';
    if (total === 2 && fingers.index && fingers.middle && indexMiddle > 0.1) return 'ز';
    if (fingers.thumb && fingers.index && thumbIndex < 0.08 && total >= 3) return 'س';
    if (total === 3 && fingers.index && fingers.middle && fingers.ring) return 'ش';
    if (fingers.thumb && fingers.index && thumbIndex < 0.06 && total === 5) return 'ط';
    if (total === 1 && fingers.pinky) return 'ي';
    
    return null;
}

// ===== معالجة MediaPipe =====
function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvasCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
        drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2, radius: 5 });
        
        const detectedLetter = analyzeHandGesture(landmarks);
        
        if (detectedLetter) {
            if (detectedLetter !== lastDetectedLetter) {
                lastDetectedLetter = detectedLetter;
                detectionStartTime = Date.now();
            } else {
                const elapsed = Date.now() - detectionStartTime;
                const progress = Math.min((elapsed / stableDetectionTime) * 100, 100);
                
                if (elapsed >= stableDetectionTime && !detectionTimer) {
                    detectionTimer = true;
                    addLetter(detectedLetter);
                    setTimeout(() => {
                        detectionTimer = false;
                        detectionStartTime = Date.now();
                    }, 500);
                }
            }
            
            currentLetterDiv.innerHTML = detectedLetter;
            currentLetterDiv.style.fontSize = '8rem';
            updateStatus('detecting', 'جاري الكشف...');
        } else {
            lastDetectedLetter = null;
            detectionStartTime = null;
            currentLetterDiv.innerHTML = '❓';
            updateStatus('active', 'حرك يدك');
        }
    } else {
        lastDetectedLetter = null;
        detectionStartTime = null;
        currentLetterDiv.innerHTML = '<span class="waiting-text">لا توجد يد</span>';
        updateStatus('active', 'ضع يدك أمام الكاميرا');
    }
    
    canvasCtx.restore();
}

// ===== تهيئة MediaPipe =====
function initializeHands() {
    hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
    });
    hands.onResults(onResults);
}

// ===== تشغيل الكاميرا =====
async function startCamera() {
    try {
        if (!hands) initializeHands();
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 }
        });
        
        video.srcObject = stream;
        await video.play();
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        camera = new Camera(video, {
            onFrame: async () => {
                await hands.send({image: video});
            },
            width: 640,
            height: 480
        });
        
        await camera.start();
        
        isRunning = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        updateStatus('active', 'الكاميرا تعمل');
        
    } catch (error) {
        alert('⚠️ فشل تشغيل الكاميرا!\n\n' + error.message);
    }
}

// ===== إيقاف الكاميرا =====
function stopCamera() {
    if (camera) camera.stop();
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(t => t.stop());
    }
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    currentLetterDiv.innerHTML = '<span class="waiting-text">متوقف</span>';
    updateStatus('', 'غير نشط');
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
}

function updateStatus(status, text) {
    detectionStatus.querySelector('.status-indicator').className = 'status-indicator ' + status;
    detectionStatus.querySelector('.status-text').textContent = text;
}

function addLetter(letter) {
    currentSentence += letter;
    updateSentence();
    enableButtons();
    playBeep();
}

function updateSentence() {
    sentenceDiv.textContent = currentSentence.length === 0 ? '' : currentSentence;
    if (currentSentence.length === 0) {
        sentenceDiv.innerHTML = '<span class="empty-sentence">ابدأ بتكوين جملتك...</span>';
    }
}

function enableButtons() {
    speakBtn.disabled = false;
    saveBtn.disabled = false;
    clearBtn.disabled = false;
}

function disableButtons() {
    speakBtn.disabled = true;
    saveBtn.disabled = true;
    clearBtn.disabled = true;
}

function clearSentence() {
    if (confirm('مسح الجملة؟')) {
        currentSentence = '';
        updateSentence();
        disableButtons();
    }
}

function speakSentence() {
    if (!currentSentence) return;
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(currentSentence);
        u.lang = 'ar-SA';
        u.rate = 0.8;
        u.onstart = () => { speakBtn.innerHTML = '⏸️'; speakBtn.style.background = '#e74c3c'; };
        u.onend = () => { speakBtn.innerHTML = '🔊'; speakBtn.style.background = ''; };
        window.speechSynthesis.speak(u);
    }
}

function saveSentence() {
    if (!currentSentence) return;
    const saved = JSON.parse(localStorage.getItem('savedSentences') || '[]');
    saved.push({ text: currentSentence, date: new Date().toLocaleString('ar-SA') });
    localStorage.setItem('savedSentences', JSON.stringify(saved));
    alert('✓ تم الحفظ!');
    loadSaved();
}

function loadSaved() {
    const saved = JSON.parse(localStorage.getItem('savedSentences') || '[]');
    if (saved.length === 0) { savedSection.style.display = 'none'; return; }
    savedSection.style.display = 'block';
    savedList.innerHTML = '';
    saved.reverse().forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'saved-item';
        div.innerHTML = `
            <div><div class="saved-text">${item.text}</div><small style="color: #7f8c8d;">${item.date}</small></div>
            <div class="saved-actions">
                <button class="btn-small btn-speak-saved" onclick="speakSaved(${saved.length-1-i})">🔊</button>
                <button class="btn-small btn-delete-saved" onclick="deleteSaved(${saved.length-1-i})">🗑️</button>
            </div>
        `;
        savedList.appendChild(div);
    });
}

function speakSaved(i) {
    const saved = JSON.parse(localStorage.getItem('savedSentences') || '[]');
    if (saved[i] && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(saved[i].text);
        u.lang = 'ar-SA';
        window.speechSynthesis.speak(u);
    }
}

function deleteSaved(i) {
    if (confirm('حذف؟')) {
        const saved = JSON.parse(localStorage.getItem('savedSentences') || '[]');
        saved.splice(i, 1);
        localStorage.setItem('savedSentences', JSON.stringify(saved));
        loadSaved();
    }
}

function playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
}

function toggleGuideDisplay() {
    guideContent.classList.toggle('active');
    toggleGuide.textContent = guideContent.classList.contains('active') ? 
        '📖 إخفاء الدليل' : '📖 دليل الحروف المصور (28 حرف)';
}

startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);
speakBtn.addEventListener('click', speakSentence);
saveBtn.addEventListener('click', saveSentence);
clearBtn.addEventListener('click', clearSentence);
toggleGuide.addEventListener('click', toggleGuideDisplay);

window.addEventListener('load', () => {
    createLettersGuide();
    loadSaved();
    console.log('🤟 تطبيق جسر جاهز!');
});
