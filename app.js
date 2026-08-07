// 테마 깜빡임 방지 및 관리
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

// Supabase 설정 (사용자 환경에 맞게 URL 및 ANON_KEY 입력 필요)
const SUPABASE_URL = 'https://ipgzhipiebcnkfqzufgm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZ3poaXBpZWJjbmtmcXp1ZmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5ODMxMTgsImV4cCI6MjEwMTU1OTExOH0.byzqUDMvoAIbybPYbyKsR6KoPnpLPs0jsdawAnW0Eww';

// Supabase 클라이언트 초기화 (CDN 로드 전제)
let supabaseClient = null;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// 현재 로그인한 유저 정보 관리 (localStorage 활용)
function getCurrentUser() {
  const userStr = localStorage.getItem('busbell_user');
  return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(userData) {
  localStorage.setItem('busbell_user', JSON.stringify(userData));
}

function logoutUser() {
  localStorage.removeItem('busbell_user');
  alert('로그아웃 되었습니다.');
  window.location.reload();
}
