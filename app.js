// supabase api 가져오기 -- 서울교덕 제작
const SUPABASE_URL = 'https://ipgzhipiebcnkfqzufgm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZ3poaXBpZWJjbmtmcXp1ZmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5ODMxMTgsImV4cCI6MjEwMTU1OTExOH0.byzqUDMvoAIbybPYbyKsR6KoPnpLPs0jsdawAnW0Eww';

// Supabase 클라이언트 초기화
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  initAuthHeader();
  initMarketSystem();
  initCommunitySystem();
});

// 테마 변경 기능
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const toggleButtons = document.querySelectorAll('.theme-toggle-btn');
  toggleButtons.forEach(btn => {
    btn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    btn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      toggleButtons.forEach(b => {
        b.textContent = newTheme === 'dark' ? '☀️' : '🌙';
      });
    });
  });
}

// 모바일 햄버거 메뉴 토글
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
    });
  }
}

// 로그인 상태 및 환영 메시지 관리
function initAuthHeader() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
  const userGreetingEls = document.querySelectorAll('.user-greeting, .mobile-user-greeting');

  userGreetingEls.forEach(el => {
    if (currentUser) {
      el.textContent = `${currentUser.username}님 환영합니다`;
    } else {
      el.textContent = '로그인이 필요합니다';
    }
  });

  const logoutBtns = document.querySelectorAll('.logout-btn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('currentUser');
      alert('로그아웃 되었습니다.');
      window.location.href = 'index.html';
    });
  });
}

// Supabase 연동 로그인 및 회원가입 처리
async function handleAuth(nickname, password, isLoginMode) {
  if (isLoginMode) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('nickname', nickname)
      .eq('password', password)
      .single();

    if (error || !data) {
      alert('아이디(닉네임) 또는 비밀번호가 일치하지 않습니다.');
      return;
    }

    const currentUser = {
      username: data.nickname,
      role: data.role || 'user',
      accountNum: data.account_number || ''
    };

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    alert(`${currentUser.username}님 환영합니다!`);
    window.location.href = 'index.html';
  } else {
    const { error } = await supabase
      .from('users')
      .insert([{ nickname, password, role: 'user' }]);

    if (error) {
      alert('회원가입 실패: 이미 존재하는 닉네임이거나 입력 오류입니다.');
      return;
    }

    alert('회원가입이 완료되었습니다! 로그인해 주세요.');
    window.location.reload();
  }
}

// 장터 시스템 (Supabase + 검색 + 글 목록 표시)
function initMarketSystem() {
  const marketListContainer = document.getElementById('market-list');
  if (!marketListContainer) return;

  const toggleBtn = document.getElementById('toggle-market-form-btn');
  const formContainer = document.getElementById('market-form-container');
  if (toggleBtn && formContainer) {
    toggleBtn.addEventListener('click', () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        alert('로그인 후 상품 등록이 가능합니다.');
        window.location.href = 'login.html';
        return;
      }
      formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
    });
  }

  renderMarketPosts();

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderMarketPosts(e.target.value);
    });
  }

  const postForm = document.getElementById('market-post-form');
  if (postForm) {
    postForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        alert('로그인 후 작성 가능합니다.');
        window.location.href = 'login.html';
        return;
      }

      const title = document.getElementById('post-title').value;
      const price = document.getElementById('post-price').value;
      const content = document.getElementById('post-content').value;

      const { error } = await supabase.from('market_posts').insert([
        { title, price, content, author_name: currentUser.username }
      ]);

      if (error) {
        alert('상품 등록 중 오류가 발생했습니다.');
        return;
      }

      alert('상품이 성공적으로 등록되었습니다.');
      postForm.reset();
      if (formContainer) formContainer.style.display = 'none';
      renderMarketPosts();
    });
  }
}

async function renderMarketPosts(searchTerm = '') {
  const container = document.getElementById('market-list');
  if (!container) return;

  let query = supabase.from('market_posts').select('*').order('created_at', { ascending: false });
  if (searchTerm) {
    query = query.ilike('title', `%${searchTerm}%`);
  }

  const { data: posts, error } = await query;
  if (error) {
    container.innerHTML = '<p>게시글을 불러오는 중 오류가 발생했습니다.</p>';
    return;
  }

  container.innerHTML = '';
  if (!posts || posts.length === 0) {
    container.innerHTML = '<p>등록된 장터 글이 없습니다.</p>';
    return;
  }

  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${escapeHtml(post.title)}</h3>
      <p><strong>가격:</strong> ${escapeHtml(post.price)} | <strong>작성자:</strong> ${escapeHtml(post.author_name)}</p>
      <p style="margin-top: 10px;">${escapeHtml(post.content)}</p>
    `;
    container.appendChild(card);
  });
}

// 커뮤니티 시스템 (Supabase + 카테고리 + 검색 + 글 목록 표시)
function initCommunitySystem() {
  const communityListContainer = document.getElementById('community-list');
  if (!communityListContainer) return;

  let currentCategory = '공지게시판';

  const categoryBtns = document.querySelectorAll('.category-btn');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.getAttribute('data-category');
      const searchVal = document.getElementById('search-input')?.value || '';
      renderCommunityPosts(currentCategory, searchVal);
    });
  });

  const toggleBtn = document.getElementById('toggle-community-form-btn');
  const formContainer = document.getElementById('community-form-container');
  if (toggleBtn && formContainer) {
    toggleBtn.addEventListener('click', () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        alert('로그인 후 글 작성이 가능합니다.');
        window.location.href = 'login.html';
        return;
      }
      formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
    });
  }

  renderCommunityPosts(currentCategory);

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderCommunityPosts(currentCategory, e.target.value);
    });
  }

  const postForm = document.getElementById('community-post-form');
  if (postForm) {
    postForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        alert('로그인 후 작성 가능합니다.');
        window.location.href = 'login.html';
        return;
      }

      const category = document.getElementById('post-category-select').value;
      if (category === '공지게시판' && currentUser.role !== 'admin') {
        alert('공지게시판은 관리자만 작성할 수 있습니다.');
        return;
      }

      const title = document.getElementById('community-post-title').value;
      const content = document.getElementById('community-post-content').value;

      const { error } = await supabase.from('community_posts').insert([
        { category, title, content, author_name: currentUser.username }
      ]);

      if (error) {
        alert('글 작성 중 오류가 발생했습니다.');
        return;
      }

      alert('글이 성공적으로 등록되었습니다.');
      postForm.reset();
      if (formContainer) formContainer.style.display = 'none';
      renderCommunityPosts(currentCategory);
    });
  }
}

async function renderCommunityPosts(category, searchTerm = '') {
  const container = document.getElementById('community-list');
  if (!container) return;

  let query = supabase.from('community_posts').select('*').eq('category', category).order('created_at', { ascending: false });
  if (searchTerm) {
    query = query.ilike('title', `%${searchTerm}%`);
  }

  const { data: posts, error } = await query;
  if (error) {
    container.innerHTML = '<p>게시글을 불러오는 중 오류가 발생했습니다.</p>';
    return;
  }

  container.innerHTML = '';
  if (!posts || posts.length === 0) {
    container.innerHTML = `<p>[${category}]에 등록된 글이 없습니다.</p>`;
    return;
  }

  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>[${escapeHtml(post.category)}] ${escapeHtml(post.title)}</h3>
      <p><strong>작성자:</strong> ${escapeHtml(post.author_name)}</p>
      <p style="margin-top: 10px;">${escapeHtml(post.content)}</p>
    `;
    container.appendChild(card);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
