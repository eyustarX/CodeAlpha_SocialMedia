/**
 * Shared authentication helpers for frontend
 */
const auth = {
  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  renderNav() {
    const authContainer = document.getElementById('nav-auth-container');
    if (!authContainer) return;

    const user = this.getUser();

    if (user) {
      authContainer.innerHTML = `
        <a href="profile.html?username=${user.username}" style="display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: var(--text-main); font-weight: 700;">
          <img src="${user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
          <span>@${user.username}</span>
        </a>
        <button id="logout-btn" style="background: none; border: none; color: var(--danger); font-weight: 600; cursor: pointer;">Logout</button>
      `;

      document.getElementById('logout-btn')?.addEventListener('click', () => {
        auth.logout();
      });
    } else {
      authContainer.innerHTML = `
        <a href="login.html" class="btn btn-outline" style="padding: 0.4rem 1rem;">Log in</a>
        <a href="register.html" class="btn" style="padding: 0.4rem 1rem;">Sign up</a>
      `;
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  auth.renderNav();
});
