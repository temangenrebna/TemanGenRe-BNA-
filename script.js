// ===== Firebase: Curhat Publik + Balasan Anonim (Realtime) =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, onSnapshot, doc, updateDoc, arrayUnion
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

// === Firebase Config (punya kamu) ===
const firebaseConfig = {
  apiKey: "AIzaSyBzPoqQI9ts-t_4EZOEDW-XEJBypabzNyw",
  authDomain: "temangenre-bna.firebaseapp.com",
  projectId: "temangenre-bna",
  storageBucket: "temangenre-bna.firebasestorage.app",
  messagingSenderId: "102543073872",
  appId: "1:102543073872:web:edb8f8709457fa2399f755"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
await signInAnonymously(auth);

// Helper
const $ = (s) => document.querySelector(s);
function esc(s){
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
function fmt(t){
  try {
    return t?.toDate().toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"});
  } catch { return ""; }
}

// Element
const form = $("#curhatForm");
const list = $("#curhatList");

// Kirim curhat
form?.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const name = $("#nama")?.value.trim() || "Anonim";
  const text = $("#curhatText")?.value.trim();
  if(!text) return;

  $("#curhatText").value = "";
  await addDoc(collection(db,"curhat"),{
    name, text,
    createdAt: serverTimestamp(),
    replies:[]
  });
});

// Ambil & tampilkan curhat realtime
const q = query(collection(db,"curhat"), orderBy("createdAt","desc"));
onSnapshot(q,(snap)=>{
  if(!snap.size){
    list.innerHTML = `<div class="muted">Belum ada curhat.</div>`;
    return;
  }

  list.innerHTML = snap.docs.map(d=>{
    const c = d.data();
    const repliesHTML = (c.replies||[]).map(r=>`
      <div class="reply">
        <div class="meta">
          <span class="who">${esc(r.name||"Anonim")}</span>
          <span class="muted">${new Date(r.at).toLocaleString("id-ID")}</span>
        </div>
        <div>${esc(r.text)}</div>
      </div>
    `).join("");

    return `
      <div class="item">
        <div class="item-top">
          <span class="badge">${esc(c.name)}</span>
          <span class="muted">${fmt(c.createdAt)}</span>
        </div>

        <div>${esc(c.text)}</div>

        <div class="replybox">
          ${repliesHTML || `<div class="muted tiny">Belum ada balasan</div>`}

          <form class="reply-form" data-id="${d.id}">
            <input placeholder="Nama (opsional)">
            <input placeholder="Balas..." required>
            <button class="btn" type="submit">Balas</button>
          </form>
        </div>
      </div>
    `;
  }).join("");

  // Handler balasan
  document.querySelectorAll(".reply-form").forEach(f=>{
    if(f._bind) return;
    f._bind = true;
    f.addEventListener("submit", async (e)=>{
      e.preventDefault();
      const id = f.dataset.id;
      const name = f.children[0].value || "Anonim";
      const text = f.children[1].value;
      if(!text) return;

      f.children[1].value = "";
      await updateDoc(doc(db,"curhat",id),{
        replies: arrayUnion({ name, text, at: Date.now() })
      });
    });
  });
});
