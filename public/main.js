import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    limit
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
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

//Comfiguration Details
const firebaseConfig = {
    apiKey: "AIzaSyBcU-gzeWLdoAtu4jSmH_F8No74c6ncnvY",
    authDomain: "realtime-chat-app-c1e8f.firebaseapp.com",
    projectId: "realtime-chat-app-c1e8f",
    storageBucket: "realtime-chat-app-c1e8f.firebasestorage.app",
    messagingSenderId: "51484796172",
    appId: "1:51484796172:web:3b1d7fdeb7d0bb5fe89529"
};

//Initializing Firebase App
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

//Firebase Auth functions for Auth Handling
const auth = getAuth();
let currentUser = null;
let userNickname = "";

const nicknameInput = document.getElementById("nickname");

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
  } else {
    document.getElementById("auth-section").style.display = "block";
  }
});

//Login and Set-up functions
window.signUp = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const nickname = nicknameInput.value.trim();

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Store nickname
    await setDoc(doc(db, "users", uid), {
      nickname: nickname || "Anonymous"
    });
  } catch (error) {
    document.getElementById("auth-error").innerText = error.message;
  }
};

//Sign-in
window.signIn = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    document.getElementById("auth-error").innerText = error.message;
  }
};

//Sign out
window.signOutUser = async function () {
  await signOut(auth);
};

const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message');

const escapeHTML = (str) =>
    str.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

window.sendMessage = async function () {
    const sender = userNickname || "Anonymous";
    const text = messageInput.value.trim();
    if (!currentUser || !userNickname) {
        alert("Please wait for authentication to complete.");
        return;
    }

    if (text.length === 0 || text.length > 500) return;

    await addDoc(collection(db, "messages"), {
    sender: sender,
    text: text,
    timestamp: serverTimestamp()
    });

    messageInput.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;
};

//"Enter" to send message
messageInput.addEventListener("keyup", function (e) {
    if (e.key === "Enter") sendMessage();
});

//Dark Mode script
window.toggleDarkMode = function () {
    document.body.classList.toggle("dark-mode");
};

const q = query(collection(db, "messages"), orderBy("timestamp"), limit(100));

//Display of text on screen
onSnapshot(q, (snapshot) => {
    const currentUsername = userNickname || "Anonymous";
    chatBox.innerHTML = ""; // Clear chatBox before re-rendering

    snapshot.forEach(doc => {
        const msg = doc.data();
        const msgId = doc.id;
        const safeText = escapeHTML(msg.text);
        const sender = escapeHTML(msg.sender);
        const time = msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "";

        const isMine = sender === currentUsername;
        const rowClass = isMine ? "message-row outgoing" : "message-row incoming";
        const avatarImg = `<img src="./userProfile.png" alt="${sender}" />`;

        // Optional buttons if it's the user's own message
        let buttons = "";
        if (isMine) {
            buttons = `
                <div style="margin-top: 4px; text-align: right;">
                <button onclick="deleteMessage('${msgId}')">🗑️</button>
                <button onclick="editMessage('${msgId}', '${safeText.replace(/'/g, "\\'")}')">✏️</button>
                </div>
            `;
        }

        // Create the message row
        const msgRow = document.createElement("div");
        msgRow.className = rowClass;

        // Compose the message bubble HTML
        msgRow.innerHTML = isMine
        ? `
            <div>
            <div class="message">${safeText}<br><small>${time}</small></div>
            ${buttons}
            </div>
            ${avatarImg}
        `
        : `
            ${avatarImg}
            <div>
            <div class="message"><strong>${sender}</strong><br>${safeText}<br><small>${time}</small></div>
            </div>
        `;

        chatBox.appendChild(msgRow);
        });

    chatBox.scrollTop = chatBox.scrollHeight;
});

//Delete functionality
window.deleteMessage = async function(id) {
    await deleteDoc(doc(db, "messages", id));
};

//Edit functionality
window.editMessage = function(id, oldText) {
    const newText = prompt("Edit your message:", oldText);
    if (newText && newText.trim()) {
    updateDoc(doc(db, "messages", id), {
        text: newText.trim(),
        timestamp: serverTimestamp()
    });
    }
};
