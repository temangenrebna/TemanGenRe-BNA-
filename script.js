// ===== Firebase: Curhat Publik Realtime =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// ===== Firebase Config (FIX API KEY) =====
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBzPoqQI9ts-t_4EZOEDW-XEJBYpabzNyw",
  authDomain: "temangenre-bna.firebaseapp.com",
  projectId: "temangenre-bna",
  storageBucket: "temangenre-bna.firebasestorage.app",
  messagingSenderId: "1025430753872",
  appId: "1:1025430753872:web:edb8f8709457fa2399f755",
  measurementId: "G-TV094CSPT4"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Anonymous login
await signInAnonymously(auth);
console.log("Anonymous login success");

// ===== ELEMENTS =====
const form = document.getElementById("curhatForm");
const namaInput = document.getElementById("nama");
const textInput = document.getElementById("curhatText");
const list = document.getElementById("curhatList");

// ===== SUBMIT CURHAT =====
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nama = namaInput.value || "Anonim";
  const text = textInput.value.trim();
  if (!text) return;

  await addDoc(collection(db, "curhat"), {
    nama,
    text,
    replies: [],
    createdAt: serverTimestamp()
  });

  textInput.value = "";
});

// ===== TAMPILKAN CURHAT REALTIME =====
const q = query(collection(db, "curhat"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  list.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <strong>${data.nama}</strong>
      <p>${data.text}</p>

      <div class="replies">
        ${(data.replies || []).map(r => `<div class="reply">💬 ${r}</div>`).join("")}
      </div>

      <input placeholder="Balas anonim..." />
      <button>Balas</button>
    `;

    const input = div.querySelector("input");
    const btn = div.querySelector("button");

    btn.onclick = async () => {
      if (!input.value.trim()) return;

      await updateDoc(doc(db, "curhat", docSnap.id), {
        replies: arrayUnion(input.value)
      });

      input.value = "";
    };

    list.appendChild(div);
  });
});
