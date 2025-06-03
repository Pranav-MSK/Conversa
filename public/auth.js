const switchModeLink = document.getElementById("switch-mode");
const authTitle = document.getElementById("auth-title");
const submitBtn = document.getElementById("submit-btn");
const confirmPassword = document.getElementById("confirm-password");
const toggleText = document.getElementById("toggle-auth");

let isSignUp = false;

// Toggle between Sign In and Sign Up
function updateForm() {
  isSignUp = !isSignUp;

  authTitle.textContent = isSignUp ? "Sign Up" : "Sign In";
  submitBtn.textContent = isSignUp ? "Sign Up" : "Sign In";
  confirmPassword.style.display = isSignUp ? "block" : "none";

  toggleText.innerHTML = isSignUp
    ? `Already have an account? <a href="#" id="switch-mode">Sign In</a>`
    : `Don't have an account? <a href="#" id="switch-mode">Sign Up</a>`;

  document.getElementById("switch-mode").addEventListener("click", handleToggleClick);
}

function handleToggleClick(e) {
  e.preventDefault();
  updateForm();
}

document.getElementById("switch-mode").addEventListener("click", handleToggleClick);

// Handle form submit
document.getElementById("auth-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const confirmPass = document.getElementById("confirm-password").value;

  if (!username || !password) {
    alert("Please enter a username and password.");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || {};

  if (isSignUp) {
    if (users[username]) {
      alert("Username already exists.");
      return;
    }
    if (password !== confirmPass) {
      alert("Passwords do not match.");
      return;
    }

    users[username] = { password };
    localStorage.setItem("users", JSON.stringify(users));
    alert("Sign up successful! Please log in.");
    updateForm(); // switch to Sign In mode
  } else {
    if (!users[username] || users[username].password !== password) {
      alert("Invalid username or password.");
      return;
    }

    // Store session info
    localStorage.setItem("currentUser", username);
    window.location.href = "index.html"; // redirect to main chat
  }
});
