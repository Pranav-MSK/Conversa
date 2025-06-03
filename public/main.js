import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  limit,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBcU-gzeWLdoAtu4jSmH_F8No74c6ncnvY",
  authDomain: "realtime-chat-app-c1e8f.firebaseapp.com",
  projectId: "realtime-chat-app-c1e8f",
  storageBucket: "realtime-chat-app-c1e8f.appspot.com",
  messagingSenderId: "51484796172",
  appId: "1:51484796172:web:3b1d7fdeb7d0bb5fe89529"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

let currentUser = null;
let userNickname = "";

const nicknameInput = document.getElementById("nickname");
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message');
const sendBtn = document.getElementById('sendBtn');

const escapeHTML = (str) =>
  str.replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const uid = user.uid;
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      userNickname = userSnap.data().nickname;
    } else {
      userNickname = nicknameInput.value.trim() || "Anonymous";
      await setDoc(userRef, { nickname: userNickname });
    }

    document.getElementById("auth-section").style.display = "none";
    await loadMessages();
  } else {
    document.getElementById("auth-section").style.display = "block";
  }
});

window.signUp = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const nickname = nicknameInput.value.trim();

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    await setDoc(doc(db, "users", uid), { nickname: nickname || "Anonymous" });
  } catch (error) {
    document.getElementById("auth-error").innerText = error.message;
  }
};

window.signIn = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    document.getElementById("auth-error").innerText = error.message;
  }
};

window.signOutUser = async function () {
  await signOut(auth);
};

window.sendMessage = async function () {
  const text = messageInput.value.trim();
  if (!currentUser || !userNickname) {
    alert("Please wait for authentication to complete.");
    return;
  }
  if (text.length === 0 || text.length > 500) return;

  const message = {
    sender: userNickname,
    text: text,
    timestamp: new Date().toISOString()
  };

  await MessageStorage.addMessage(message);
  messageInput.value = "";
  loadMessages(); // 👈 call a new function to render messages
};


messageInput.addEventListener("keyup", function (e) {
  if (e.key === "Enter") sendMessage();
});

window.toggleDarkMode = function () {
  document.body.classList.toggle("dark-mode");
};

const q = query(collection(db, "messages"), orderBy("timestamp"), limit(100));

/*onSnapshot(q, (snapshot) => {
  const currentUsername = userNickname || "Anonymous";
  chatBox.innerHTML = "";

  snapshot.forEach(doc => {
    const msg = doc.data();
    const msgId = doc.id;
    const safeText = escapeHTML(msg.text);
    const sender = escapeHTML(msg.sender);
    const time = msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "";

    const isMine = sender === currentUsername;
    const rowClass = isMine ? "message-row outgoing" : "message-row incoming";
    const avatarImg = `<img src="./assets/userProfile.png" alt="${sender}" />`;

    let icons = "";
    if (isMine) {
      icons = `
        <div class="msg-icons">
          <button onclick="deleteMessage('${msgId}')">🗑️</button>
          <button onclick="editMessage('${msgId}', '${safeText.replace(/'/g, "\\'")}')">✏️</button>
        </div>
      `;
    }

    const msgRow = document.createElement("div");
    msgRow.className = rowClass;

    msgRow.innerHTML = isMine
      ? `
        <div class="msg-bubble own">
          ${icons}
          <div class="msg-text">${safeText}</div>
          <div class="timestamp">${time}</div>
        </div>
        ${avatarImg}
      `
      : `
        ${avatarImg}
        <div class="msg-bubble other">
          <div class="msg-text"><strong>${sender}</strong><br>${safeText}</div>
          <div class="timestamp">${time}</div>
        </div>
      `;

    chatBox.appendChild(msgRow);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
});*/

async function loadMessages() {
  const messages = await MessageStorage.getMessages();
  const currentUsername = userNickname || "Anonymous";
  chatBox.innerHTML = "";

  messages.forEach((msg, index) => {
    const safeText = escapeHTML(msg.text);
    const sender = escapeHTML(msg.sender);
    const time = msg.timestamp? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }): "";

    const isMine = sender === currentUsername;
    const rowClass = isMine ? "message-row outgoing" : "message-row incoming";
    const avatarImg = `<img src="./assets/userProfile.png" alt="${sender}" />`;

    let icons = "";
    if (isMine) {
      icons = `
        <div class="msg-icons">
          <button onclick="deleteMessage(${index})">🗑️</button>
        </div>
      `;
    }

    const msgRow = document.createElement("div");
    msgRow.className = rowClass;
    msgRow.innerHTML = isMine
      ? `
        <div class="msg-bubble own">
          ${icons}
          <div class="msg-text">${safeText}</div>
          <div class="timestamp">${time}</div>
        </div>
        ${avatarImg}
      `
      : `
        ${avatarImg}
        <div class="msg-bubble other">
          <div class="msg-text"><strong>${sender}</strong><br>${safeText}</div>
          <div class="timestamp">${time}</div>
        </div>
      `;

    chatBox.appendChild(msgRow);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

onAuthStateChanged(auth, async (user) => {
  // existing code...
  if (user) {
    // after setting nickname...
    await loadMessages(); // <-- add this
  }
});



window.deleteMessage = async function (index) {
  await MessageStorage.deleteMessage(index);
  loadMessages();
};


window.editMessage = function(id, oldText) {
  const newText = prompt("Edit your message:", oldText);
  if (newText && newText.trim()) {
    updateDoc(doc(db, "messages", id), {
      text: newText.trim(),
      timestamp: serverTimestamp()
    });
  }
};

//Logout Button Functionality
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "auth.html";
});

//LogIn Page redirecter
window.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("currentUser");
  if (!user) {
    window.location.href = "auth.html";
  }
});






//Firebase Database switch - Dont Touch 
// Toggle this to switch between localStorage and Firebase
const useFirebase = false; //Change to true before final deployment

// Message Storage Abstraction
const MessageStorage = {
  async getMessages(chatId = "default") {
    if (useFirebase) {
      const messagesRef = collection(db, "chats", chatId, "messages");
      const snapshot = await getDocs(messagesRef);
      return snapshot.docs.map(doc => doc.data());
    } else {
      const raw = localStorage.getItem(`messages-${chatId}`);
      return JSON.parse(raw || "[]");
    }
  },

  async saveMessages(messages, chatId = "default") {
    if (useFirebase) {
      const messagesRef = collection(db, "chats", chatId, "messages");
      for (const msg of messages) {
        await addDoc(messagesRef, msg);
      }
    } else {
      localStorage.setItem(`messages-${chatId}`, JSON.stringify(messages));
    }
  },

  async addMessage(message, chatId = "default") {
    if (useFirebase) {
      const messagesRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesRef, message);
    } else {
      const messages = await this.getMessages(chatId);
      messages.push(message);
      localStorage.setItem(`messages-${chatId}`, JSON.stringify(messages));
    }
  },

  async deleteMessage(index, chatId = "default") {
    if (useFirebase) {
      // Placeholder – in real Firebase you'd delete by ID
    } else {
      const messages = await this.getMessages(chatId);
      messages.splice(index, 1);
      localStorage.setItem(`messages-${chatId}`, JSON.stringify(messages));
    }
  },

  async clearMessages(chatId = "default") {
    if (useFirebase) {
      // Not recommended unless admin control
    } else {
      localStorage.removeItem(`messages-${chatId}`);
    }
  }
};
