// supabase api 가져오기 -- 서울교덕 제작 (변동 없음)
const SUPABASE_URL = 'https://ipgzhipiebcnkfqzufgm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZ3poaXBpZWJjbmtmcXp1ZmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5ODMxMTgsImV4cCI6MjEwMTU1OTExOH0.byzqUDMvoAIbybPYbyKsR6KoPnpLPs0jsdawAnW0Eww';

// Supabase 클라이언트 초기화
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  initAuthHeader();
  
  // 페이지별 초기화
  if (document.getElementById('market-list')) {
    renderMarketPosts();
    document.getElementById('search-input')?.addEventListener('input', (e) => renderMarketPosts(e.target.value));
  }
  if (document.getElementById('community-list')) {
    renderCommunityPosts('공지게시판');
    document.getElementById('search-input')?.addEventListener('input', (e) => renderCommunityPosts(document.querySelector('.category-btn.active').dataset.category, e.target.value));
  }
});

// 로그인 헤더 상태 표시 (환영 메시지)
function initAuthHeader() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
  const userGreetingEls = document.querySelectorAll('.user-greeting, .mobile-user-greeting');
  userGreetingEls.forEach(el => {
    el.textContent = currentUser ? `${currentUser.username}님 환영합니다` : '로그인이 필요합니다';
  });
}

// 테마 및 햄버거 메뉴 (기존과 동일)
function initTheme() { /* 기존 로직 유지 */ }
function initMobileMenu() { /* 기존 로직 유지 */ }

// --- Supabase 로직 ---

// 1. 로그인/회원가입 처리
async function loginProcess(nickname, password, isLoginMode) {
  if (isLoginMode) {
    const { data, error } = await supabase.from('users').select('*').eq('nickname', nickname).eq('password', password).single();
    if (error || !data) return alert('로그인 실패: 정보를 확인하세요.');
    localStorage.setItem('currentUser', JSON.stringify({ username: data.nickname, role: data.role }));
    window.location.href = 'index.html';
  } else {
    const { error } = await supabase.from('users').insert([{ nickname, password, role: 'user' }]);
    if (error) return alert('회원가입 실패 (이미 존재하는 닉네임일 수 있습니다).');
    alert('회원가입 성공! 로그인해주세요.');
    location.reload();
  }
}

// 2. 장터 게시글 로직
async function renderMarketPosts(searchTerm = '') {
  let query = supabase.from('market_posts').select('*').order('created_at', { ascending: false });
  if (searchTerm) query = query.ilike('title', `%${searchTerm}%`);
  const { data: posts } = await query;
  
  const container = document.getElementById('market-list');
  if(!container) return;
  container.innerHTML = posts.length ? '' : '<p>등록된 상품이 없습니다.</p>';
  
  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h3>${post.title}</h3><p>가격: ${post.price} | 작성자: ${post.author_name}</p><p>${post.content}</p>`;
    container.appendChild(card);
  });
}

// 3. 커뮤니티 게시글 로직
async function renderCommunityPosts(category, searchTerm = '') {
  let query = supabase.from('community_posts').select('*').eq('category', category).order('created_at', { ascending: false });
  if (searchTerm) query = query.ilike('title', `%${searchTerm}%`);
  const { data: posts } = await query;

  const container = document.getElementById('community-list');
  if(!container) return;
  container.innerHTML = posts.length ? '' : '<p>등록된 글이 없습니다.</p>';

  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h3>[${post.category}] ${post.title}</h3><p>작성자: ${post.author_name}</p><p>${post.content}</p>`;
    container.appendChild(card);
  });
}
