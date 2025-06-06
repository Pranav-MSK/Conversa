/* ---------- Firebase initialisation ---------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ---- your project credentials ---- */
const firebaseConfig = {
  apiKey:            "AIzaSyBcU-gzeWLdoAtu4jSmH_F8No74c6ncnvY",
  authDomain:        "realtime-chat-app-c1e8f.firebaseapp.com",
  projectId:         "realtime-chat-app-c1e8f",
  storageBucket:     "realtime-chat-app-c1e8f.appspot.com",
  messagingSenderId: "51484796172",
  appId:             "1:51484796172:web:3b1d7fdeb7d0bb5fe89529"
};

initializeApp(firebaseConfig);
const auth = getAuth();
const db   = getFirestore();

/* ---------- Global refs ---------- */
const chatBox      = document.getElementById("chat-box");
const chatInput    = document.getElementById("chatInput");
const nicknameInput= document.getElementById("nickname");
let   currentUser  = null;
let   userNickname = "";
let   socket       = null;

/* ---------- WebSocket endpoint ---------- */
const WEBSOCKET_URL = "wss://av9x5vcb3l.execute-api.ap-south-1.amazonaws.com/dev";

/* ---------- Helper: escape HTML ---------- */
const escapeHTML = s =>
  s.replace(/&/g,"&amp;").replace(/</g,"&lt;")
   .replace(/>/g,"&gt;").replace(/"/g,"&quot;");

/* ======================================================================
   1.  AUTH FLOW (Firebase)
   ====================================================================== */
window.signUp = async () => {
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const nickname = nicknameInput.value.trim() || "Anonymous";

  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", user.uid), { nickname });
  } catch (err) {
    document.getElementById("auth-error").innerText = err.message;
  }
};

window.signIn = async () => {
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    document.getElementById("auth-error").innerText = err.message;
  }
};

window.signOutUser = () => signOut(auth);

/* ---------- On auth state change ---------- */
onAuthStateChanged(auth, async user => {
  if (!user) {
    document.getElementById("auth-section").style.display = "block";
    return;
  }

  document.getElementById("auth-section").style.display = "none";
  currentUser = user;

  /* Fetch or create nickname */
  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) {
    userNickname = snap.data().nickname;
  } else {
    userNickname = nicknameInput.value.trim() || "Anonymous";
    await setDoc(doc(db, "users", user.uid), { nickname: userNickname });
  }

  initWebSocket();      // 🔗 connect once authenticated
});

/* ======================================================================
   2.  WEBSOCKET HANDLING
   ====================================================================== */
function initWebSocket() {
  if (socket && socket.readyState === WebSocket.OPEN) return;   // already open

  socket = new WebSocket(WEBSOCKET_URL);

  socket.onopen = () => {
    console.log("✅ WebSocket connected");
    /* Optionally register uid so back-end can map userId → connectionId */
    socket.send(JSON.stringify({
      action : "register",
      userId : currentUser.uid            // Lambda $connect can store this
    }));
  };

  socket.onmessage = evt => {
    const { message, from } = JSON.parse(evt.data);
    displayIncomingMessage(message, from);
  };

  socket.onclose = () => console.warn("❌ WebSocket closed");
  socket.onerror = err => console.error("⚠️ WebSocket error", err);
}

/* ======================================================================
   3.  SENDING & RECEIVING MESSAGES
   ====================================================================== */
function getRecipientUserId() {
  /* 👉 For demo, echo to yourself.
     ── Replace with logic (dropdown, chat room, etc.) that returns the
        Firebase uid of the person you’re chatting with. */
  return currentUser.uid;
}

window.handleSendMessage = () => {
  const text = chatInput.value.trim();
  const targetUserId = getRecipientUserId();

  if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify({
    action       : "sendMessage",
    targetUserId,
    message      : text
  }));

  displayOutgoingMessage(text);
  chatInput.value = "";
};

/* ======================================================================
   4.  UI HELPERS
   ====================================================================== */
function displayOutgoingMessage(msg) {
  const div = document.createElement("div");
  div.className = "message-row outgoing";
  div.innerHTML = `<div class="message">You:<br>${escapeHTML(msg)}</div>`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function displayIncomingMessage(msg, from) {
  const div = document.createElement("div");
  div.className = "message-row incoming";
  div.innerHTML = `<div class="message"><b>${escapeHTML(from)}</b>:<br>${escapeHTML(msg)}</div>`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* ======================================================================
   5.  MISC (dark-mode)
   ====================================================================== */
window.toggleDarkMode = () => document.body.classList.toggle("dark-mode");
