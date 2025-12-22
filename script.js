// ===== Utils =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
function nowID() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

// ===== Mental Check (simple, non-diagnostic) =====
const mentalForm = $("#mentalForm");
const mentalResult = $("#mentalResult");
const resetMentalBtn = $("#resetMental");

function mentalMessage(score) {
  if (score <= 2) {
    return {
      title: "Kondisi terlihat cukup stabil",
      text: "Tetap jaga pola tidur, makan, dan komunikasi. Kalau ada hal mengganggu, coba tulis jurnal atau ngobrol dengan orang tepercaya."
    };
  }
  if (score <= 5) {
    return {
      title: "Ada tanda kamu perlu istirahat mental",
      text: "Coba kurangi beban, atur jeda, dan cari dukungan. Aktivitas ringan seperti jalan santai/napas dalam bisa membantu."
    };
  }
  return {
    title: "Kamu terlihat cukup terbebani akhir-akhir ini",
    text: "Kamu nggak harus menanggung sendiri. Coba bicara dengan orang tepercaya (teman/keluarga/mentor) atau tenaga profesional bila memungkinkan."
  };
}

mentalForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const q1 = Number($("#q1").value);
  const q2 = Number($("#q2").value);
  const q3 = Number($("#q3").value);
  const score = q1 + q2 + q3;

  const msg = mentalMessage(score);
  mentalResult.hidden = false;
  mentalResult.innerHTML = `
    <div><strong>Skor:</strong> ${score}/9</div>
    <div style="margin-top:6px;"><strong>${escapeHTML(msg.title)}</strong></div>
    <div class="muted" style="margin-top:6px;">${escapeHTML(msg.text)}</div>
    <div class="muted" style="margin-top:10px; font-size:12px;">
      Catatan: ini bukan diagnosis. Jika kamu merasa tidak aman atau butuh bantuan segera, hubungi orang terdekat atau layanan profesional setempat.
    </div>
  `;

  saveJSON("genre_mental_last", { score, at: Date.now() });
});

resetMentalBtn?.addEventListener("click", () => {
  mentalForm.reset();
  mentalResult.hidden = true;
  mentalResult.innerHTML = "";
  localStorage.removeItem("genre_mental_last");
});

(function restoreMental() {
  const last = loadJSON("genre_mental_last", null);
  if (!last || !mentalResult) return;
  const msg = mentalMessage(last.score);
  mentalResult.hidden = false;
  mentalResult.innerHTML = `
    <div><strong>Skor terakhir:</strong> ${last.score}/9 <span class="muted" style="font-size:12px;">(${formatDate(last.at)})</span></div>
    <div style="margin-top:6px;"><strong>${escapeHTML(msg.title)}</strong></div>
    <div class="muted" style="margin-top:6px;">${escapeHTML(msg.text)}</div>
  `;
})();

// ===== Curhat (stored locally) =====
const curhatForm = $("#curhatForm");
const curhatList = $("#curhatList");
const clearCurhatBtn = $("#clearCurhat");

function renderCurhat() {
  if (!curhatList) return;
  const items = loadJSON("genre_curhat_items", []);
  if (!items.length) {
    curhatList.innerHTML = `<div class="muted">Belum ada curhat yang tersimpan di perangkat ini.</div>`;
    return;
  }

  curhatList.innerHTML = items
    .slice()
    .reverse()
    .map((it) => `
      <div class="item">
        <div class="item-top">
          <div><span class="badge">${escapeHTML(it.name || "Anonim")}</span></div>
          <div class="muted" style="font-size:12px;">${formatDate(it.at)}</div>
        </div>
        <div>${escapeHTML(it.text)}</div>
        <div class="row" style="margin-top:10px;">
          <button class="btn btn-ghost small" data-del="${escapeHTML(it.id)}">Hapus</button>
        </div>
      </div>
    `)
    .join("");

  $$("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      const next = loadJSON("genre_curhat_items", []).filter((x) => x.id !== id);
      saveJSON("genre_curhat_items", next);
      renderCurhat();
    });
  });
}

curhatForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#nama")?.value?.trim() || "";
  const text = $("#curhatText")?.value?.trim() || "";
  if (!text) return;

  const items = loadJSON("genre_curhat_items", []);
  items.push({ id: nowID(), name, text, at: Date.now() });
  saveJSON("genre_curhat_items", items);

  curhatForm.reset();
  renderCurhat();
});

clearCurhatBtn?.addEventListener("click", () => {
  const ok = confirm("Yakin mau hapus semua curhat yang tersimpan di perangkat ini?");
  if (!ok) return;
  localStorage.removeItem("genre_curhat_items");
  renderCurhat();
});

renderCurhat();

// ===== Challenges (7-day checkboxes, localStorage) =====
const CHALLENGES = {
  kenaldiri: { days: 7, gridId: "kenaldiriGrid", countId: "kenaldiriCount" },
  halbaik: { days: 7, gridId: "halbaikGrid", countId: "halbaikCount" }
};

function challengeKey(code) {
  return `genre_challenge_${code}`;
}
function getChallengeState(code) {
  const cfg = CHALLENGES[code];
  return loadJSON(challengeKey(code), Array(cfg.days).fill(false));
}
function setChallengeState(code, state) {
  saveJSON(challengeKey(code), state);
}

function renderChallenge(code) {
  const cfg = CHALLENGES[code];
  const state = getChallengeState(code);
  const done = state.filter(Boolean).length;

  const grid = document.getElementById(cfg.gridId);
  const count = document.getElementById(cfg.countId);
  if (!grid || !count) return;

  count.textContent = `${done}/${cfg.days}`;
  grid.innerHTML = "";

  state.forEach((isDone, idx) => {
    const day = idx + 1;
    const el = document.createElement("div");
    el.className = "check" + (isDone ? " done" : "");
    el.title = `Hari ${day}`;
    el.textContent = `Hari ${day}`;

    el.addEventListener("click", () => {
      const next = getChallengeState(code);
      next[idx] = !next[idx];
      setChallengeState(code, next);
      renderChallenge(code);
    });

    grid.appendChild(el);
  });
}

$$("[data-challenge]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const code = btn.getAttribute("data-challenge");
    renderChallenge(code);
    const cfg = CHALLENGES[code];
    document.getElementById(cfg.gridId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    alert("Challenge aktif! Klik kotak Hari 1–7 untuk tandai progres ✨");
  });
});

$$("[data-reset-challenge]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const code = btn.getAttribute("data-reset-challenge");
    const ok = confirm("Reset progres challenge ini?");
    if (!ok) return;
    const cfg = CHALLENGES[code];
    setChallengeState(code, Array(cfg.days).fill(false));
    renderChallenge(code);
  });
});

Object.keys(CHALLENGES).forEach(renderChallenge);
