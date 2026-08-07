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

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
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

// 공통 헤더 네비게이션 렌더링 검사
document.addEventListener('DOMContentLoaded', () => {
  const user = getLoggedInUser();
  const authArea = document.getElementById('auth-menu-area');
  const adminNav = document.getElementById('admin-nav');

  if (authArea) {
    if (user) {
      authArea.innerHTML = `
        <span style="font-size: 13px; font-weight: bold;">${user.nickname} (${user.role})님</span>
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
