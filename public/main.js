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

//Comfiguration Details
const firebaseConfig = {
    apiKey: "AIzaSyBcU-gzeWLdoAtu4jSmH_F8No74c6ncnvY",
    authDomain: "realtime-chat-app-c1e8f.firebaseapp.com",
    projectId: "realtime-chat-app-c1e8f",
    storageBucket: "realtime-chat-app-c1e8f.firebasestorage.app",
    messagingSenderId: "51484796172",
    appId: "1:51484796172:web:3b1d7fdeb7d0bb5fe89529"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message');
const usernameInput = document.getElementById('username');

const escapeHTML = (str) =>
    str.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

window.sendMessage = async function () {
    const username = usernameInput.value.trim() || "Anonymous";
    const text = messageInput.value.trim();

    if (text.length === 0 || text.length > 500) return;

    await addDoc(collection(db, "messages"), {
    sender: username,
    text: text,
    timestamp: serverTimestamp()
    });

    messageInput.value = "";
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
    chatBox.innerHTML = "";
    const currentUsername = usernameInput.value.trim() || "Anonymous";

    snapshot.forEach(doc => {
    const msg = doc.data();
    const msgId = doc.id; // <-- add this line to get document ID
    const safeText = escapeHTML(msg.text);
    const sender = escapeHTML(msg.sender);
    const time = msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "";

    const isMine = sender === currentUsername;
    const msgClass = isMine ? "own" : "other";

    // Add buttons only if message belongs to current user
    let buttons = "";
    if (isMine) {
        buttons = `
        <button onclick="deleteMessage('${msgId}')">🗑️</button>
        <button onclick="editMessage('${msgId}', '${safeText.replace(/'/g, "\\'")}')">✏️</button>
        `;
    }

    const msgDiv = `<div class="message ${msgClass}">
        <strong>${sender}</strong> [${time}]: ${safeText} ${buttons}
    </div>`;

    chatBox.innerHTML += msgDiv;
    });


    chatBox.scrollTop = chatBox.scrollHeight;
});

//Delete and Update modules
import { doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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
