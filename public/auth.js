const switchModeLink = document.getElementById("switch-mode");
const authTitle = document.getElementById("auth-title");
const submitBtn = document.getElementById("submit-btn");
const confirmPassword = document.getElementById("confirm-password");

let isSignUp = false;

switchModeLink.addEventListener("click", (e) => {
  e.preventDefault();
  isSignUp = !isSignUp;

  authTitle.textContent = isSignUp ? "Sign Up" : "Sign In";
  submitBtn.textContent = isSignUp ? "Sign Up" : "Sign In";
  confirmPassword.style.display = isSignUp ? "block" : "none";
  switchModeLink.textContent = isSignUp
    ? "Sign In"
    : "Sign Up";

  const toggleText = document.getElementById("toggle-auth");
  toggleText.innerHTML = isSignUp
    ? `Already have an account? <a href="#" id="switch-mode">Sign In</a>`
    : `Don't have an account? <a href="#" id="switch-mode">Sign Up</a>`;
});
