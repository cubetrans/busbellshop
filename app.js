(function() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  }
})();

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

const SUPABASE_URL = 'https://ipgzhipiebcnkfqzufgm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZ3poaXBpZWJjbmtmcXp1ZmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5ODMxMTgsImV4cCI6MjEwMTU1OTExOH0.byzqUDMvoAIbybPYbyKsR6KoPnpLPs0jsdawAnW0Eww';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getLoggedInUser() {
  const data = localStorage.getItem('busbell_user');
  return data ? JSON.parse(data) : null;
}

function setLoggedInUser(userObj) {
  localStorage.setItem('busbell_user', JSON.stringify(userObj));
}

function logout() {
  localStorage.removeItem('busbell_user');
  alert('로그아웃 되었습니다.');
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const user = getLoggedInUser();
  const authArea = document.getElementById('auth-menu-area');
  const adminNav = document.getElementById('admin-nav');

  if (authArea) {
    if (user) {
      authArea.innerHTML = `
        <span style="font-size: 13px; font-weight: bold;">${user.nickname}님 환영합니다</span>
        <a href="mypage.html">마이페이지</a>
        <button onclick="logout()">로그아웃</button>
      `;
    } else {
      authArea.innerHTML = `
        <a href="login.html">로그인/회원가입</a>
      `;
    }
  }

  if (adminNav && user && user.role === '관리자') {
    adminNav.style.display = 'block';
  }
});
