let currentDayExercises = [];
let currentExerciseIndex = 0;
let timerInterval = null;
let timeLeft = 0;

const GROQ_API_KEY = "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";

async function fetchGroq(messages) {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // More stable and faster model
        messages: messages,
        temperature: 0.7
      })
    });
    const data = await res.json();
    if(data.error) {
      return "رسالة من النظام: " + data.error.message;
    }
    return data.choices[0].message.content;
  } catch(e) {
    console.error(e);
    return "عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي: " + e.message;
  }
}

const motivationalQuotes = [
  "انـت بـطـل.. اسـتـمـر!",
  "كـافـح مـن أجـل نـسـخـة أفـضـل مـنـك",
  "الألـم مـؤقـت.. الـفـخـر دائـم",
  "بـاقـي الـقـلـيـل.. لا تـتـوقـف الآن!",
  "نـتـائـجـك غـداً هـي تـعـبـك الـيـوم",
  "الـعـرق هـو دهـون تـبـكـي!"
];

function getTodayArabic() {
  const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  return days[new Date().getDay()];
}

function initApp() {
  const today = getTodayArabic();
  // Ensure we use the latest fallback data
  currentDayExercises = JSON.parse(JSON.stringify(excelFallbackData[today] || []));
  
  updateDashboard();

  // Primary Buttons
  document.getElementById('startWorkoutBtn').addEventListener('click', startWorkout);
  document.getElementById('goToEditBtn').addEventListener('click', openEditView);
  document.getElementById('saveEditBtn').addEventListener('click', saveEditedExercises);
  document.getElementById('addExerciseBtn').addEventListener('click', addNewExerciseRow);
  document.getElementById('nextExerciseBtn').addEventListener('click', nextExercise);
  document.getElementById('finishBtn').addEventListener('click', () => switchView('home-view'));

  // Header Buttons
  document.getElementById('profileBtn').addEventListener('click', () => switchView('profile-view'));
  document.getElementById('chatBtn').addEventListener('click', () => switchView('chat-view'));
  document.getElementById('homeBtn').addEventListener('click', () => switchView('home-view'));
  document.getElementById('saveProfileBtn').addEventListener('click', saveProfileData);
  document.getElementById('resetAppBtn').addEventListener('click', resetAllData);

  // Edit Day Selector
  document.getElementById('editDaySelector').addEventListener('change', (e) => {
    refreshEditList(e.target.value);
  });

  // Timer Controls
  document.getElementById('startTimerBtn').addEventListener('click', toggleTimer);
  document.getElementById('resetTimerBtn').addEventListener('click', resetTimer);

  // Excel
  document.getElementById('uploadExcelBtn').addEventListener('click', () => document.getElementById('excelUpload').click());
  document.getElementById('excelUpload').addEventListener('change', handleExcelUpload);

  // AI Table generation
  document.getElementById('aiGenerateWorkoutBtn')?.addEventListener('click', generateWorkoutByAI);

  loadLocalDataFallback();
}

function saveToLocal() {
  // Save minimal size local storage
  localStorage.setItem('abuAliSchedules', JSON.stringify(excelFallbackData));
}

function loadLocalDataFallback() {
  const saved = localStorage.getItem('abuAliSchedules');
  if(saved) {
    try {
      const parsed = JSON.parse(saved);
      // Merge saved data into excelFallbackData
      Object.assign(excelFallbackData, parsed);
    } catch(e) {
      console.error("Error loading saved data:", e);
    }
  }
  
  const today = getTodayArabic();
  currentDayExercises = JSON.parse(JSON.stringify(excelFallbackData[today] || []));
  updateDashboard();
  loadProfileData();
}

function resetAllData() {
  if(confirm("هل أنت متأكد؟ سيتم حذف جميع التعديلات واستعادة الجدول الأصلي.")) {
    localStorage.removeItem('abuAliSchedules');
    localStorage.removeItem('abuAliProfile');
    location.reload();
  }
}

function updateDashboard() {
  const today = getTodayArabic();
  document.getElementById('todayNameSpan').textContent = today;
  document.getElementById('todayExCount').textContent = currentDayExercises.length;
}

function switchView(viewId) {
  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
  window.scrollTo(0,0);
}

// Profile
function saveProfileData() {
  const data = {
    weight: document.getElementById('userWeight').value,
    target: document.getElementById('targetWeight').value
  };
  localStorage.setItem('abuAliProfile', JSON.stringify(data));
  updateWeightProgress();
  alert('تـم حـفـظ بـيـانـاتـك!');
  switchView('home-view');
}

function loadProfileData() {
  const data = JSON.parse(localStorage.getItem('abuAliProfile'));
  if (data) {
    document.getElementById('userWeight').value = data.weight;
    document.getElementById('targetWeight').value = data.target;
    updateWeightProgress();
  }
}

function updateWeightProgress() {
  const current = parseFloat(document.getElementById('userWeight').value) || 100;
  const target = parseFloat(document.getElementById('targetWeight').value) || 70;
  // Simple logic: assume starting from a high weight
  const startWeight = 110; 
  let progress = ((startWeight - current) / (startWeight - target)) * 100;
  progress = Math.min(100, Math.max(0, progress));
  document.getElementById('weightProgressBar').style.width = progress + '%';
}

// Workout Logic
function startWorkout() {
  if (currentDayExercises.length === 0) {
    alert("الـجـدول فـارغ! حـمـل مـلـف الإكـسـل أولاً.");
    return;
  }
  currentExerciseIndex = 0;
  updateExerciseView();
  switchView('workout-view');
}

function updateExerciseView() {
  const ex = currentDayExercises[currentExerciseIndex];
  const progressPercent = (currentExerciseIndex / currentDayExercises.length) * 100;
  document.getElementById('progressBar').style.width = `${progressPercent}%`;
  
  document.getElementById('exerciseNumber').textContent = `تـمـريـن ${currentExerciseIndex + 1} مـن ${currentDayExercises.length}`;
  document.getElementById('exerciseTitle').textContent = ex.name;
  document.getElementById('exerciseReps').textContent = ex.reps;
  document.getElementById('exerciseDesc').textContent = ex.desc;
  
  // Motivational Quote
  document.getElementById('motivationalQuote').textContent = `"${motivationalQuotes[Math.floor(Math.random()*motivationalQuotes.length)]}"`;

  // Image Logic - fetching from user's GitHub repo to save space
  const imgEl = document.getElementById('exerciseImage');
  const fileName = ex.image || (ex.name + '.png');
  const baseUrl = "https://raw.githubusercontent.com/7m1118172/photo-render/main/";
  const imgPath = baseUrl + fileName.split(' ').join('%20');
  
  imgEl.src = imgPath;
  imgEl.onerror = () => { 
    console.log("Missing image:", imgPath);
    imgEl.src = 'https://via.placeholder.com/200?text=No+Image'; 
  };

  // AI Analysis Logic
  const aiBox = document.getElementById('aiAnalysisBox');
  aiBox.style.display = 'block';
  aiBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جـاري تـحـلـيـل الـتـمـريـن...';
  
  if (ex.aiAnalysis) {
    aiBox.innerHTML = ex.aiAnalysis;
  } else {
    // Adding v=2 to avoid cache string check but basically prompt logic
    const prompt = [
      { role: "system", content: "أنت مدرب شخصي عربي محترف وتشجع المتدربين بلهجة عربية قوية (عضلي، بطل، وحش). ممنوع استخدام أي كلمات أو رموز صينية أبداً.. فقط عربي. أجب باختصار شديد (سطر واحد فقط) تعطي فيها فائدة هذا التمرين وتحفز اللاعب." },
      { role: "user", content: `حلل تمرين: ${ex.name}` }
    ];
    fetchGroq(prompt).then(response => {
      ex.aiAnalysis = response;
      // Only inject if still on the same exercise
      if (currentDayExercises[currentExerciseIndex] === ex) {
        aiBox.innerHTML = response;
      }
    });
  }

  // Timer Logic (Support seconds or minutes)
  const timerContainer = document.getElementById('timerContainer');
  clearInterval(timerInterval);
  timerInterval = null;
  document.querySelector('#startTimerBtn i').className = 'fa-solid fa-play';
  
  let timeVal = ex.timer || 0;
  if (typeof timeVal === 'string' && timeVal.includes('د')) {
    timeLeft = parseInt(timeVal) * 60;
  } else {
    timeLeft = parseInt(timeVal);
  }

  if (timeLeft > 0) {
    timerContainer.style.display = 'block';
    updateTimerDisplay();
  } else {
    timerContainer.style.display = 'none';
  }

  const nextBtn = document.getElementById('nextExerciseBtn');
  nextBtn.innerHTML = currentExerciseIndex === currentDayExercises.length - 1 ? 
    'تـم إنـهـاء الـجـدول <i class="fa-solid fa-flag-checkered"></i>' : 
    'الـتـمـريـن الـتـالـي <i class="fa-solid fa-chevron-left"></i>';
}

function nextExercise() {
  if (currentExerciseIndex < currentDayExercises.length - 1) {
    currentExerciseIndex++;
    updateExerciseView();
  } else {
    document.getElementById('progressBar').style.width = `100%`;
    buildFinishSummary();
    switchView('finished-view');
  }
}

function buildFinishSummary() {
  const tbody = document.getElementById('summaryTableBody');
  tbody.innerHTML = '';
  // Roughly est 4 mins per exercise if we don't have exact accurate times
  let totalTimeMins = currentDayExercises.length * 4; 
  currentDayExercises.forEach(ex => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${ex.name}</td><td>${ex.reps || (ex.timer + ' ث')}</td>`;
    tbody.appendChild(tr);
  });
  
  const estimatedCalories = Math.round(totalTimeMins * 8.5); 
  document.getElementById('calorieEstimation').innerHTML = `🔥 حـوالـي ${estimatedCalories} سـعـرة حـراريـة!`;
  
  const monthlyLost = ((estimatedCalories * 20) / 7700).toFixed(2);
  document.getElementById('weightLossEstimation').textContent = `بـهـذا الـمـعـدل سـتـخـسـر حـوالـي ${monthlyLost} كـغ هـذا الـشـهـر مـن الـدهـون الـصـافـيـة!`;
}

// Chat functions
let chatHistory = [
  { role: "system", content: "أنت مدرب رياضي عربي وخليجي. ترد بحماس قوي وتشجيع. ممنوع استخدام أي كلمات أو حروف صينية أبداً مهما كان الأمر. ردودك قصيرة، محفزة، وقوية." }
];

async function sendChatMessage() {
  const inputEl = document.getElementById('chatInput');
  const msg = inputEl.value.trim();
  if (!msg) return;
  
  const chatMessages = document.getElementById('chatMessages');
  // Add User msg
  chatMessages.innerHTML += `<div class="message user">${msg}</div>`;
  inputEl.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;

  chatHistory.push({ role: "user", content: msg });
  
  // loading UI
  const loadingId = 'loading-' + Date.now();
  chatMessages.innerHTML += `<div id="${loadingId}" class="message ai"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const response = await fetchGroq(chatHistory);
  document.getElementById(loadingId).remove();
  
  chatMessages.innerHTML += `<div class="message ai">${response}</div>`;
  chatHistory.push({ role: "assistant", content: response });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function generateWorkoutByAI() {
  const chatMessages = document.getElementById('chatMessages');
  const loadingId = 'loading-' + Date.now();
  chatMessages.innerHTML += `<div id="${loadingId}" class="message ai"><i class="fa-solid fa-spinner fa-spin"></i> جاري إنشاء جدول ذكي لك...</div>`;
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const prompt = [...chatHistory, {role: "user", content: "اقترح لي 4 تمارين لكامل الجسم اليوم. أعطني الرد فقط بدون مقدمات بأسطر واضحة كل سطر فيه تمرين، مثلا: اسم التمرين | التكرار | الوقت بالثواني"}];
  const response = await fetchGroq(prompt);
  document.getElementById(loadingId).remove();
  
  chatMessages.innerHTML += `<div class="message ai">في المستقبل القريب سأقوم بإضافة هذا للجدول تلقائياً، حالياً قم بإضافته من قسم التعديل: <br><br> ${response.replace(/\n/g, '<br>')}</div>`;
  chatHistory.push({ role: "assistant", content: response });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Timer
function toggleTimer() {
  const btnIcon = document.querySelector('#startTimerBtn i');
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    btnIcon.className = 'fa-solid fa-play';
  } else {
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        document.getElementById('timerAudio').play();
        btnIcon.className = 'fa-solid fa-play';
        alert("انـتـهـى الـوقـت! خـذ نـفـس وعـلـى الـتـمـريـن الـتـالـي.");
      }
    }, 1000);
    btnIcon.className = 'fa-solid fa-pause';
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  document.querySelector('#startTimerBtn i').className = 'fa-solid fa-play';
  
  let timeVal = currentDayExercises[currentExerciseIndex].timer || 0;
  timeLeft = (typeof timeVal === 'string' && timeVal.includes('د')) ? parseInt(timeVal)*60 : parseInt(timeVal);
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  document.getElementById('timerDisplay').textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
}

// Edit Logic
function openEditView() {
  const today = getTodayArabic();
  document.getElementById('editDaySelector').value = today;
  refreshEditList(today);
  switchView('edit-view');
}

function refreshEditList(day) {
  const list = document.getElementById('editList');
  list.innerHTML = '';
  const dayExercises = excelFallbackData[day] || [];
  dayExercises.forEach(ex => addExerciseRowHTML(ex));
}

function addExerciseRowHTML(ex = {name:'', reps:'', desc:'', timer:0}) {
  const div = document.createElement('div');
  div.className = 'edit-item';
  div.innerHTML = `
    <input type="text" placeholder="اسم التمرين" value="${ex.name}" class="edit-name">
    <div style="display: flex; gap: 0.5rem;">
      <input type="text" placeholder="التكرار" value="${ex.reps}" class="edit-reps" style="flex: 1.5;">
      <input type="text" placeholder="الوقت (ث أو د)" value="${ex.timer || 0}" class="edit-timer" style="flex: 1;">
    </div>
    <textarea placeholder="الوصف">${ex.desc}</textarea>
    <button onclick="this.parentElement.remove()" style="color:#ef4444; background:none; border:none; cursor:pointer; font-size:0.8rem; text-align:left;">حـذف</button>
  `;
  document.getElementById('editList').appendChild(div);
}

function addNewExerciseRow() {
  addExerciseRowHTML();
  const list = document.getElementById('editList');
  list.scrollTop = list.scrollHeight;
}

function saveEditedExercises() {
  const day = document.getElementById('editDaySelector').value;
  const items = document.querySelectorAll('.edit-item');
  const newList = [];
  items.forEach(item => {
    newList.push({
      name: item.querySelector('.edit-name').value,
      reps: item.querySelector('.edit-reps').value,
      timer: item.querySelector('.edit-timer').value,
      desc: item.querySelector('textarea').value
    });
  });
  excelFallbackData[day] = newList;
  if(day === getTodayArabic()) {
    currentDayExercises = JSON.parse(JSON.stringify(newList));
    updateDashboard();
  }
  saveToLocal();
  alert(`تـم حـفـظ تـمـاريـن (${day})!`);
}

function handleExcelUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      const temp = {};
      jsonData.forEach(row => {
        const d = row["اليوم"];
        if(!temp[d]) temp[d] = [];
        temp[d].push({
          name: row["التمرين"],
          desc: row["الوصف"] || "",
          reps: row["التكرار"] || row["المجموعة"] || "",
          timer: row["الوقت"] || row["المدة"] || 0
        });
      });
      Object.assign(excelFallbackData, temp);
      currentDayExercises = JSON.parse(JSON.stringify(excelFallbackData[getTodayArabic()] || []));
      updateDashboard();
      saveToLocal();
      alert("تـم تـحـديـث الـمـوقع بـالـكـامـل مـن مـلـف الإكـسـل!");
    };
    reader.readAsArrayBuffer(file);
}

document.addEventListener('DOMContentLoaded', initApp);
