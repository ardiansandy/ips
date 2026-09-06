// ⚠️ GANTI DENGAN URL WEB APP DEPLOYMENT DARI APPS SCRIPT
const API_URL = "https://script.google.com/macros/s/AKfycbxgGw8hM2_rjKmu5Xs71Yu9bu2xaUfuZt31jTf8S1ZXg2F1PxO2RJbCh3xSH4OUte8Zpg/exec";

let currentUser = null;
let currentMuridList = [];

document.addEventListener("DOMContentLoaded", () => {
  const savedUser = localStorage.getItem("ips_user");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    renderDashboard();
  }
});

function showLoading(text = "Memproses...") {
  document.getElementById("loading-text").innerText = text;
  document.getElementById("loading-overlay").classList.remove("hidden");
}

function hideLoading() {
  document.getElementById("loading-overlay").classList.add("hidden");
}

async function callApi(payload) {
  showLoading();
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    hideLoading();
    return result;
  } catch (error) {
    hideLoading();
    alert("Terjadi kesalahan koneksi ke server Apps Script!");
    console.error(error);
    return { status: "error" };
  }
}

// Switch Tab Login Guru / Murid
function switchLoginTab(tab) {
  const btnMurid = document.getElementById("tab-murid-btn");
  const btnGuru = document.getElementById("tab-guru-btn");
  const formMurid = document.getElementById("form-murid");
  const formGuru = document.getElementById("form-guru");

  if (tab === "murid") {
    btnMurid.className = "flex-1 py-3 text-sm font-semibold border-b-2 border-blue-600 text-blue-600 transition-all";
    btnGuru.className = "flex-1 py-3 text-sm font-semibold text-slate-500 border-b-2 border-transparent transition-all";
    formMurid.classList.remove("hidden");
    formGuru.classList.add("hidden");
  } else {
    btnGuru.className = "flex-1 py-3 text-sm font-semibold border-b-2 border-blue-600 text-blue-600 transition-all";
    btnMurid.className = "flex-1 py-3 text-sm font-semibold text-slate-500 border-b-2 border-transparent transition-all";
    formGuru.classList.remove("hidden");
    formMurid.classList.add("hidden");
  }
}

// Proses Login Murid (Cek Username & Password Sekaligus)
async function loginMurid() {
  const username = document.getElementById("murid-username").value.trim();
  const password = document.getElementById("murid-password").value.trim();

  if (!username || !password) {
    alert("Lengkapi Username (Nama) dan Password (Tanggal Lahir) kamu!");
    return;
  }

  const res = await callApi({ action: "loginMurid", username: username, password: password });
  if (res.status === "success") {
    currentUser = { role: "murid", ...res.data };
    localStorage.setItem("ips_user", JSON.stringify(currentUser));
    renderDashboard();
  } else {
    alert(res.message);
  }
}

async function loginGuru() {
  const u = document.getElementById("guru-username").value.trim();
  const p = document.getElementById("guru-password").value.trim();
  if (!u || !p) return alert("Lengkapi username dan password!");

  const res = await callApi({ action: "loginTeacher", username: u, password: p });
  if (res.status === "success") {
    currentUser = { role: "guru", ...res.data };
    localStorage.setItem("ips_user", JSON.stringify(currentUser));
    renderDashboard();
  } else {
    alert(res.message);
  }
}

function logout() {
  localStorage.removeItem("ips_user");
  currentUser = null;
  location.reload();
}

function renderDashboard() {
  document.getElementById("login-section").classList.add("hidden");
  document.getElementById("app-dashboard").classList.remove("hidden");

  const badge = document.getElementById("user-info-badge");

  if (currentUser.role === "guru") {
      // Tampilan Guru: Tetap menampilkan nama Guru
      badge.innerText = `Guru: ${currentUser.nama}`;
      document.getElementById("view-guru").classList.remove("hidden");
      document.getElementById("view-murid").classList.add("hidden");
      loadDataKelasGuru();
    } else {
      // Tampilan Murid: Menampilkan nama sekolah
      badge.innerText = "SMP Islam Terpadu Insan Mandiri";
      document.getElementById("view-murid").classList.remove("hidden");
      document.getElementById("view-guru").classList.add("hidden");
      loadDashboardMurid();
    }
  }

// MODUL GURU
let currentGuruTab = "absensi";

async function loadDataKelasGuru() {
  const kelas = document.getElementById("guru-kelas-select").value;
  const res = await callApi({ action: "getMuridByClass", kelas: kelas });
  if (res.status === "success") {
    currentMuridList = res.data;
    switchGuruTab(currentGuruTab);
  }
}

// Perbarui switchGuruTab untuk mendukung tab 'tugas'
function switchGuruTab(tab) {
  currentGuruTab = tab;
  const container = document.getElementById("guru-tab-content");

  // Reset & highlight tombol guru
  const guruTabs = {
    absensi: document.getElementById("btn-guru-absensi"),
    nilai: document.getElementById("btn-guru-nilai"),
    sikap: document.getElementById("btn-guru-sikap"),
    materi: document.getElementById("btn-guru-materi"),
    tugas: document.getElementById("btn-guru-tugas")
  };

  const activeStyle = "guru-nav-btn p-3 bg-blue-600 text-white rounded-xl text-xs font-semibold text-center shadow transition-all";
  const inactiveStyle = "guru-nav-btn p-3 bg-white text-slate-700 rounded-xl text-xs font-semibold text-center border shadow-sm hover:bg-slate-50 transition-all";

  Object.keys(guruTabs).forEach(key => {
    if (guruTabs[key]) guruTabs[key].className = key === tab ? activeStyle : inactiveStyle;
  });

  if (tab === "absensi") {
    renderAbsensiGuru(container);
  } else if (tab === "nilai") {
    renderInputNilaiGuru(container);
  } else if (tab === "sikap") {
    renderInputSikapGuru(container);
  } else if (tab === "materi") {
    renderUploadMateriGuru(container);
  } else if (tab === "tugas") {
    renderInputTugasGuru(container);
  }
}

// Render Form Pembuatan Tugas Guru
function renderInputTugasGuru(container) {
  container.innerHTML = `
    <h3 class="font-bold text-slate-700 text-sm mb-3"><i class="fa-solid fa-square-plus text-blue-600"></i> Buat Tugas Baru untuk Murid</h3>
    <div class="space-y-3">
      <div>
        <label class="block text-xs font-bold text-slate-600 mb-1">Judul Tugas</label>
        <input type="text" id="guru-tugas-judul" placeholder="Contoh: Latihan Bab 1 Perubahan Sosial" class="w-full px-3 py-2 border rounded-lg text-xs">
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-600 mb-1">Tipe Tugas</label>
        <select id="guru-tugas-tipe" onchange="toggleFormDetailTugas()" class="w-full px-3 py-2 border rounded-lg text-xs bg-white">
          <option value="Petunjuk Teks">Petunjuk Teks / Pengerjaan Buku</option>
          <option value="Link/Google Form">Link Website / Google Form</option>
          <option value="Pengumpulan File">Pengumpulan File (Video / Drive / Foto)</option>
        </select>
      </div>

      <div>
        <label id="label-detail-tugas" class="block text-xs font-bold text-slate-600 mb-1">Detail / Petunjuk Tugas</label>
        <textarea id="guru-tugas-detail" rows="3" placeholder="Contoh: Kerjakan buku mari berlatih halaman 23 nomor 1-5" class="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
      </div>

      <button onclick="simpanTugasGuru()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-xs shadow transition-all">
        Publikasikan Tugas
      </button>
    </div>
  `;
}

// Menyesuaikan placeholder/label berdasarkan tipe tugas
function toggleFormDetailTugas() {
  const tipe = document.getElementById("guru-tugas-tipe").value;
  const label = document.getElementById("label-detail-tugas");
  const inputDetail = document.getElementById("guru-tugas-detail");

  if (tipe === "Link/Google Form") {
    label.innerText = "Link Google Form / Website Tugas";
    inputDetail.placeholder = "https://forms.google.com/... atau link luar lainnya";
  } else if (tipe === "Pengumpulan File") {
    label.innerText = "Instruksi Pengumpulan File";
    inputDetail.placeholder = "Contoh: Buat penjelasan materi perubahan sosial dalam bentuk video lalu unggah linknya di tombol Kirim Tugas di bawah.";
  } else {
    label.innerText = "Detail / Petunjuk Tugas";
    inputDetail.placeholder = "Contoh: Kerjakan buku mari berlatih halaman 23 materi perubahan sosial.";
  }
}

// Simpan data tugas ke Apps Script
async function simpanTugasGuru() {
  const kelas = document.getElementById("guru-kelas-select").value;
  const dataTugas = {
    kelas: kelas,
    judulTugas: document.getElementById("guru-tugas-judul").value.trim(),
    tipeTugas: document.getElementById("guru-tugas-tipe").value,
    detailAtauLink: document.getElementById("guru-tugas-detail").value.trim()
  };

  if (!dataTugas.judulTugas) return alert("Judul tugas wajib diisi!");
  if (!dataTugas.detailAtauLink) return alert("Detail atau link tugas wajib diisi!");

  const res = await callApi({ action: "addTask", dataTugas });
  alert(res.message);

  if (res.status === "success") {
    document.getElementById("guru-tugas-judul").value = "";
    document.getElementById("guru-tugas-detail").value = "";
  }
}

function renderAbsensiGuru(container) {
  const today = new Date().toISOString().split("T")[0];
  let html = `
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-bold text-slate-700 text-sm"><i class="fa-solid fa-list-check text-blue-600"></i> Form Absensi Harian</h3>
      <input type="date" id="absensi-tanggal" value="${today}" class="px-3 py-1 border rounded text-xs">
    </div>
    <div class="divide-y divide-slate-100 max-h-96 overflow-y-auto mb-4">
  `;

  if (currentMuridList.length === 0) {
    html += `<p class="text-xs text-slate-400 py-4 text-center">Belum ada data murid di kelas ini.</p>`;
  } else {
    currentMuridList.forEach((m) => {
      html += `
        <div class="py-2.5 flex items-center justify-between gap-2">
          <span class="text-xs font-semibold text-slate-700 w-1/3 truncate">${m.Nama_Lengkap}</span>
          <select id="absen-${m.ID_Murid}" class="px-2 py-1 border rounded text-xs bg-slate-50 focus:ring-1 focus:ring-blue-500">
            <option value="Hadir" selected>Hadir</option>
            <option value="Izin">Izin</option>
            <option value="Sakit">Sakit</option>
            <option value="Alpa">Alpa</option>
          </select>
        </div>
      `;
    });
  }

  html += `
    </div>
    <button onclick="simpanAbsensiGuru()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-xs shadow transition-all">
      Simpan Absensi Kelas
    </button>
  `;
  container.innerHTML = html;
}

async function simpanAbsensiGuru() {
  const tanggal = document.getElementById("absensi-tanggal").value;
  const kelas = document.getElementById("guru-kelas-select").value;

  const dataAbsensi = currentMuridList.map((m) => {
    const status = document.getElementById(`absen-${m.ID_Murid}`).value;
    return { tanggal, kelas, idMurid: m.ID_Murid, status };
  });

  const res = await callApi({ action: "saveAttendance", dataAbsensi });
  alert(res.message);
}

function renderInputNilaiGuru(container) {
  let html = `
    <h3 class="font-bold text-slate-700 text-sm mb-3"><i class="fa-solid fa-pen-to-square text-emerald-600"></i> Input Nilai Ujian / UH</h3>
    <div class="mb-4">
      <label class="block text-xs font-bold text-slate-600 mb-1">Kategori Penilaian</label>
      <select id="kategori-nilai" class="w-full px-3 py-2 border rounded-lg text-xs">
        <option value="UH1">Ulangan Harian 1</option>
        <option value="UH2">Ulangan Harian 2</option>
        <option value="UTS">Ujian Tengah Semester</option>
        <option value="UAS">Ujian Akhir Semester</option>
      </select>
    </div>
    <div class="divide-y divide-slate-100 max-h-80 overflow-y-auto mb-4">
  `;

  currentMuridList.forEach((m) => {
    html += `
      <div class="py-2 flex items-center justify-between gap-2">
        <span class="text-xs font-semibold text-slate-700 w-1/2 truncate">${m.Nama_Lengkap}</span>
        <input type="number" id="nilai-${m.ID_Murid}" placeholder="0-100" min="0" max="100" class="w-20 px-2 py-1 border rounded text-xs text-center">
      </div>
    `;
  });

  html += `
    </div>
    <button onclick="simpanNilaiGuru()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-xs shadow">
      Simpan Nilai Kelas
    </button>
  `;
  container.innerHTML = html;
}

async function simpanNilaiGuru() {
  const kategori = document.getElementById("kategori-nilai").value;
  const kelas = document.getElementById("guru-kelas-select").value;

  const dataNilai = currentMuridList
    .map((m) => {
      const val = document.getElementById(`nilai-${m.ID_Murid}`).value;
      return val ? { idMurid: m.ID_Murid, kelas, kategori, nilai: Number(val) } : null;
    })
    .filter((item) => item !== null);

  if (dataNilai.length === 0) return alert("Isi minimal satu nilai murid!");

  const res = await callApi({ action: "saveGrade", dataNilai });
  alert(res.message);
}

function renderInputSikapGuru(container) {
  let html = `
    <h3 class="font-bold text-slate-700 text-sm mb-3"><i class="fa-solid fa-star text-amber-500"></i> Apresiasi Keaktifan (Bintang Sikap)</h3>
    <div class="divide-y divide-slate-100 max-h-96 overflow-y-auto">
  `;

  currentMuridList.forEach((m) => {
    html += `
      <div class="py-2.5 flex items-center justify-between gap-2">
        <span class="text-xs font-semibold text-slate-700">${m.Nama_Lengkap}</span>
        <button onclick="tambahBintang('${m.ID_Murid}')" class="bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1 border border-amber-300">
          +1 Star ★
        </button>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

async function tambahBintang(idMurid) {
  const kelas = document.getElementById("guru-kelas-select").value;
  const res = await callApi({ action: "addStar", idMurid, kelas, catatan: "Aktif bertanya/menjawab" });
  alert(res.message);
}

function renderUploadMateriGuru(container) {
  container.innerHTML = `
    <h3 class="font-bold text-slate-700 text-sm mb-3"><i class="fa-solid fa-upload text-indigo-600"></i> Upload Modul / Video IPS</h3>
    <div class="space-y-3">
      <div>
        <label class="block text-xs font-bold text-slate-600 mb-1">Sub-Materi IPS</label>
        <select id="materi-sub" class="w-full px-3 py-2 border rounded-lg text-xs">
          <option value="Geografi">Geografi</option>
          <option value="Sejarah">Sejarah</option>
          <option value="Sosiologi">Sosiologi</option>
          <option value="Ekonomi">Ekonomi</option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-600 mb-1">Judul Materi</label>
        <input type="text" id="materi-judul" placeholder="Contoh: Bab 1 Kondisi Geografis Indonesia" class="w-full px-3 py-2 border rounded-lg text-xs">
      </div>
      
      <!-- KOLOM DESKRIPSI UNTUK GURU -->
      <div>
        <label class="block text-xs font-bold text-slate-600 mb-1">Deskripsi / Penjelasan Singkat</label>
        <textarea id="materi-deskripsi" rows="3" placeholder="Tulis deskripsi atau petunjuk pengerjaan di sini..." class="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"></textarea>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-600 mb-1">Link Google Drive (Modul/PDF)</label>
        <input type="text" id="materi-pdf" placeholder="https://drive.google.com/..." class="w-full px-3 py-2 border rounded-lg text-xs">
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-600 mb-1">Link Video YouTube</label>
        <input type="text" id="materi-youtube" placeholder="https://youtube.com/watch?v=..." class="w-full px-3 py-2 border rounded-lg text-xs">
      </div>
      <button onclick="simpanMateriGuru()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-xs shadow transition-all">
        Upload Materi
      </button>
    </div>
  `;
}

async function simpanMateriGuru() {
  const kelas = document.getElementById("guru-kelas-select").value;
  const dataMateri = {
    kelas,
    subIps: document.getElementById("materi-sub").value,
    judul: document.getElementById("materi-judul").value,
    deskripsi: document.getElementById("materi-deskripsi").value.trim(),
    linkDrivePdf: document.getElementById("materi-pdf").value,
    linkYoutube: document.getElementById("materi-youtube").value,
  };

  if (!dataMateri.judul) return alert("Judul materi wajib diisi!");
  const res = await callApi({ action: "addMaterial", dataMateri });
  alert(res.message);
}

// MODUL MURID
async function loadDashboardMurid() {
  document.getElementById("murid-welcome-name").innerText = currentUser.nama;
  document.getElementById("murid-welcome-class").innerText = `Kelas ${currentUser.kelas.toUpperCase()}`;

  const res = await callApi({ action: "getMuridDashboard", idMurid: currentUser.idMurid });
  if (res.status === "success") {
    document.getElementById("stat-bintang").innerText = `${res.data.totalBintang || 0} ★`;
    document.getElementById("stat-kehadiran").innerText = `${res.data.absensi.length} Hari`;
    
    currentUser.dashboardData = res.data;
    switchMuridTab("nilai");
  }
}

function switchMuridTab(tab) {
  const container = document.getElementById("murid-tab-content");
  const data = currentUser.dashboardData || { nilai: [], absensi: [] };

  // Update indikator UI Tab yang aktif
  const tabs = {
    nilai: document.getElementById("btn-murid-nilai"),
    materi: document.getElementById("btn-murid-materi"),
    tugas: document.getElementById("btn-murid-tugas")
  };

  const activeStyle = "murid-nav-btn py-3 px-4 text-xs font-bold border-b-2 border-blue-600 text-blue-600 transition-all";
  const inactiveStyle = "murid-nav-btn py-3 px-4 text-xs font-bold text-slate-500 border-b-2 border-transparent hover:text-slate-700 transition-all";

  Object.keys(tabs).forEach(key => {
    if (tabs[key]) tabs[key].className = key === tab ? activeStyle : inactiveStyle;
  });

  // Render konten sesuai tab
  if (tab === "nilai") {
    let html = `<h3 class="font-bold text-slate-700 text-sm mb-3">Rekap Nilai IPS Saya</h3>`;
    if (data.nilai.length === 0) {
      html += `<p class="text-xs text-slate-400 py-4 text-center">Belum ada nilai yang diinput oleh guru.</p>`;
    } else {
      html += `<div class="space-y-2">`;
      data.nilai.forEach(n => {
        html += `
          <div class="flex justify-between items-center p-3 bg-slate-50 border rounded-lg">
            <span class="text-xs font-semibold text-slate-700">${n.Kategori}</span>
            <span class="text-sm font-black text-blue-600">${n.Nilai}</span>
          </div>
        `;
      });
      html += `</div>`;
    }
    container.innerHTML = html;

  } else if (tab === "materi") {
    loadMateriMurid(container);
  } else if (tab === "tugas") {
    renderKumpulTugasMurid(container);
  }
}

async function loadMateriMurid(container) {
  const res = await callApi({ action: "getMaterials", kelas: currentUser.kelas });
  let html = `<h3 class="font-bold text-slate-700 text-sm mb-3">Daftar Modul Pembelajaran IPS</h3>`;

  if (res.status === "success" && res.data.length > 0) {
    html += `<div class="space-y-3">`;
    res.data.forEach(m => {
      html += `
        <div class="p-3 border rounded-xl bg-slate-50 space-y-2">
          <div class="flex justify-between items-start">
            <span class="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">${m.Sub_IPS || 'IPS'}</span>
            <span class="text-[10px] text-slate-400">Kelas ${m.Kelas}</span>
          </div>
          <h4 class="text-xs font-bold text-slate-800">${m.Judul}</h4>
          <p class="text-xs text-slate-600 mt-1">${m.Deskripsi || ''}</p>
          <div class="flex gap-2 pt-1">
            ${m.Link_Drive_PDF ? `<a href="${m.Link_Drive_PDF}" target="_blank" class="text-[11px] bg-red-600 text-white px-2.5 py-1 rounded font-medium"><i class="fa-solid fa-file-pdf"></i> Baca Materi</a>` : ''}
            ${m.Link_Youtube ? `<a href="${m.Link_Youtube}" target="_blank" class="text-[11px] bg-red-100 text-red-600 px-2.5 py-1 rounded font-medium"><i class="fa-brands fa-youtube"></i> Tonton Video</a>` : ''}
          </div>
        </div>
      `;
    });
    html += `</div>`;
  } else {
    html += `<p class="text-xs text-slate-400 py-4 text-center">Belum ada materi IPS untuk kelas ini.</p>`;
  }
  container.innerHTML = html;
}

async function renderKumpulTugasMurid(container) {
  container.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">Memuat daftar tugas...</p>`;

  // Ambil daftar tugas dari guru berdasarkan kelas murid
  const res = await callApi({ action: "getTasksByClass", kelas: currentUser.kelas });
  const daftarTugas = (res.status === "success") ? res.data : [];

  let html = `
    <div class="space-y-6">
      <!-- BAGIAN 1: DAFTAR TUGAS DARI GURU -->
      <div>
        <h3 class="font-bold text-slate-700 text-sm mb-3"><i class="fa-solid fa-list-check text-blue-600"></i> Daftar Tugas Hari Ini</h3>
  `;

  if (daftarTugas.length === 0) {
    html += `<p class="text-xs text-slate-400 p-3 bg-slate-50 rounded-lg text-center">Belum ada tugas yang diberikan oleh guru.</p>`;
  } else {
    html += `<div class="space-y-3">`;
    daftarTugas.forEach(t => {
      html += `
        <div class="p-3.5 border rounded-xl bg-slate-50 space-y-2">
          <div class="flex justify-between items-start">
            <span class="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">${t.Tipe_Tugas || 'Tugas'}</span>
            <label class="flex items-center gap-1.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 px-2.5 py-1 rounded-lg transition-all">
              <input type="checkbox" onchange="tandaiSelesaiTugas('${t.Judul_Tugas}', this)" class="w-3.5 h-3.5 accent-emerald-600 rounded cursor-pointer">
              <span class="text-[11px] font-bold">Selesai</span>
            </label>
          </div>
          <h4 class="text-xs font-bold text-slate-800">${t.Judul_Tugas}</h4>
          
          <!-- Tampilan Instruksi berdasarkan tipe -->
          <div class="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
            ${t.Tipe_Tugas === 'Link/Google Form' 
              ? `<p class="mb-1">Silakan kerjakan melalui link berikut:</p><a href="${t.Detail_Atau_Link}" target="_blank" class="text-blue-600 font-bold underline flex items-center gap-1"><i class="fa-solid fa-arrow-up-right-from-square"></i> Buka Link / Form Tugas</a>`
              : `<p class="whitespace-pre-line">${t.Detail_Atau_Link}</p>`
            }
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  html += `
      </div>

      <hr class="border-slate-200">

      <!-- BAGIAN 2: FORM KIRIM TUGAS (UNGGAH FILE) -->
      <div>
        <h3 class="font-bold text-slate-700 text-sm mb-3"><i class="fa-solid fa-paper-plane text-blue-600"></i> Kirim Tugas (Link Drive / Foto)</h3>
        <div class="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Judul Tugas</label>
            <input type="text" id="tugas-judul" placeholder="Contoh: Tugas Video Perubahan Sosial" class="w-full px-3 py-2 border rounded-lg text-xs bg-white">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Link File (Google Drive / Youtube / Foto)</label>
            <input type="text" id="tugas-link" placeholder="Paste link di sini..." class="w-full px-3 py-2 border rounded-lg text-xs bg-white">
          </div>
          <button onclick="kirimTugasMurid()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-xs shadow transition-all">
            Kirimkan Tugas
          </button>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// Fungsi Centang Selesai Tugas
async function tandaiSelesaiTugas(judulTugas, checkboxEl) {
  if (!checkboxEl.checked) return;

  const confirmDone = confirm(`Tandai tugas "${judulTugas}" sebagai selesai? Nilai akan otomatis masuk ke Rekap Nilai.`);
  if (!confirmDone) {
    checkboxEl.checked = false;
    return;
  }

  checkboxEl.disabled = true;
  const res = await callApi({
    action: "markTaskDone",
    idMurid: currentUser.idMurid,
    kelas: currentUser.kelas,
    judulTugas: judulTugas
  });

  alert(res.message);
  // Reload dashboard murid agar status rekap nilai terbarui di memori
  loadDashboardMurid();
}

async function kirimTugasMurid() {
  const dataTugas = {
    idMurid: currentUser.idMurid,
    judulTugas: document.getElementById("tugas-judul").value,
    linkFileDrive: document.getElementById("tugas-link").value
  };

  if (!dataTugas.judulTugas || !dataTugas.linkFileDrive) return alert("Lengkapi judul dan link tugas!");
  const res = await callApi({ action: "submitTask", dataTugas });
  alert(res.message);
}
