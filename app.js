document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  initAuthHeader();
  initMarketActions();
  initAdminManagement();
  initSearch();
  initCustomerService();
});

// 테마 변경 기능 (이모지만 표시하여 줄바꿈 원천 차단)
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

// 로그인 상태 및 사용자 환영 메시지 관리 (모바일 햄버거 내부 포함)
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

// 장터 글 수정/삭제 버튼 오류 수정 및 관리자/작성자 권한 처리
function initMarketActions() {
  if (!localStorage.getItem('market_posts')) {
    const defaultPosts = [
      { id: 1, title: '현대 버스 하차벨 판매합니다', author: '서울교덕', authorId: 'user1', price: '15,000원', content: '실사용감 적은 현대 저상버스 하차벨입니다.' },
      { id: 2, title: '대우버스 안내방송기 구해요', author: '교통동호인', authorId: 'user2', price: '구함', content: '대우 bs110 음성합성기 구합니다.' }
    ];
    localStorage.setItem('market_posts', JSON.stringify(defaultPosts));
  }

  const marketListContainer = document.getElementById('market-list');
  if (!marketListContainer) return;

  renderMarketPosts();

  const postForm = document.getElementById('market-post-form');
  if (postForm) {
    postForm.addEventListener('submit', (e) => {
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

      const posts = JSON.parse(localStorage.getItem('market_posts')) || [];
      const newPost = {
        id: Date.now(),
        title,
        price,
        author: currentUser.username,
        authorId: currentUser.id || currentUser.username,
        content
      };

      posts.unshift(newPost);
      localStorage.setItem('market_posts', JSON.stringify(posts));
      postForm.reset();
      renderMarketPosts();
    });
  }
}

function renderMarketPosts() {
  const container = document.getElementById('market-list');
  if (!container) return;

  const posts = JSON.parse(localStorage.getItem('market_posts')) || [];
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  container.innerHTML = '';
  if (posts.length === 0) {
    container.innerHTML = '<p>등록된 장터 글이 없습니다.</p>';
    return;
  }

  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'card';
    
    const isAuthorOrAdmin = currentUser && (currentUser.role === 'admin' || currentUser.username === post.author || currentUser.id === post.authorId);

    card.innerHTML = `
      <h3>${escapeHtml(post.title)}</h3>
      <p><strong>가격:</strong> ${escapeHtml(post.price)} | <strong>작성자:</strong> ${escapeHtml(post.author)}</p>
      <p style="margin-top: 10px;">${escapeHtml(post.content)}</p>
      ${isAuthorOrAdmin ? `
        <div style="margin-top: 15px; display: flex; gap: 10px;">
          <button class="btn btn-primary btn-sm edit-post-btn" data-id="${post.id}">수정</button>
          <button class="btn btn-danger btn-sm delete-post-btn" data-id="${post.id}">삭제</button>
        </div>
      ` : ''}
    `;
    container.appendChild(card);
  });

  document.querySelectorAll('.delete-post-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.target.getAttribute('data-id'));
      if (confirm('정말 이 게시글을 삭제하시겠습니까?')) {
        let posts = JSON.parse(localStorage.getItem('market_posts')) || [];
        posts = posts.filter(p => p.id !== id);
        localStorage.setItem('market_posts', JSON.stringify(posts));
        renderMarketPosts();
      }
    });
  });

  document.querySelectorAll('.edit-post-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.target.getAttribute('data-id'));
      let posts = JSON.parse(localStorage.getItem('market_posts')) || [];
      const post = posts.find(p => p.id === id);
      if (!post) return;

      const newTitle = prompt('수정할 제목:', post.title);
      const newPrice = prompt('수정할 가격:', post.price);
      const newContent = prompt('수정할 내용:', post.content);

      if (newTitle !== null && newPrice !== null && newContent !== null) {
        post.title = newTitle;
        post.price = newPrice;
        post.content = newContent;
        localStorage.setItem('market_posts', JSON.stringify(posts));
        renderMarketPosts();
      }
    });
  });
}

// 관리자 페이지: 이메일 대신 계좌번호/비밀번호 표시 및 역할 변경 오류 해결
function initAdminManagement() {
  const adminTableBody = document.getElementById('admin-users-table-body');
  if (!adminTableBody) return;

  if (!localStorage.getItem('all_users')) {
    const defaultUsers = [
      { id: 'user1', username: '서울교덕', accountNum: '110-123-456789', password: 'password123', role: 'user' },
      { id: 'admin1', username: '관리자', accountNum: '333-987-654321', password: 'adminpassword', role: 'admin' },
      { id: 'user2', username: '교통동호인', accountNum: '1002-555-778899', password: 'password456', role: 'user' }
    ];
    localStorage.setItem('all_users', JSON.stringify(defaultUsers));
  }

  renderAdminUsers();
}

function renderAdminUsers() {
  const tbody = document.getElementById('admin-users-table-body');
  if (!tbody) return;

  const users = JSON.parse(localStorage.getItem('all_users')) || [];
  tbody.innerHTML = '';

  users.forEach((user, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(user.username)}</td>
      <td>${escapeHtml(user.accountNum || '계좌 미등록')}</td>
      <td>${escapeHtml(user.password || '비밀번호 없음')}</td>
      <td>
        <select class="role-select" data-index="${index}" style="padding: 5px; border-radius: 4px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-color);">
          <option value="user" ${user.role === 'user' ? 'selected' : ''}>일반 사용자</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>관리자</option>
        </select>
      </td>
      <td>
        <button class="btn btn-danger btn-sm delete-user-btn" data-index="${index}">삭제</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.role-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const index = Number(e.target.getAttribute('data-index'));
      const newRole = e.target.value;
      let users = JSON.parse(localStorage.getItem('all_users')) || [];
      
      if (users[index]) {
        users[index].role = newRole;
        localStorage.setItem('all_users', JSON.stringify(users));
        alert(`사용자 [${users[index].username}]의 역할이 [${newRole === 'admin' ? '관리자' : '일반 사용자'}]로 변경되었습니다.`);
      } else {
        alert('역할 변경 중 오류가 발생했습니다.');
      }
    });
  });

  document.querySelectorAll('.delete-user-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = Number(e.target.getAttribute('data-index'));
      let users = JSON.parse(localStorage.getItem('all_users')) || [];
      if (confirm(`정말 [${users[index].username}] 사용자를 삭제하시겠습니까?`)) {
        users.splice(index, 1);
        localStorage.setItem('all_users', JSON.stringify(users));
        renderAdminUsers();
      }
    });
  });
}

// 검색 기능 (장터 및 커뮤니티 전용)
function initSearch() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');

  if (searchInput && searchBtn) {
    searchBtn.addEventListener('click', () => {
      executeSearch(searchInput.value);
    });
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        executeSearch(searchInput.value);
      }
    });
  }
}

function executeSearch(query) {
  query = query.trim().toLowerCase();
  const isMarket = window.location.pathname.includes('market.html');
  const isCommunity = window.location.pathname.includes('community.html');

  if (isMarket) {
    const posts = JSON.parse(localStorage.getItem('market_posts')) || [];
    const filtered = posts.filter(p => p.title.toLowerCase().includes(query) || p.content.toLowerCase().includes(query));
    renderFilteredMarket(filtered);
  } else if (isCommunity) {
    const posts = JSON.parse(localStorage.getItem('community_posts')) || [];
    const filtered = posts.filter(p => p.title.toLowerCase().includes(query) || p.content.toLowerCase().includes(query));
    renderFilteredCommunity(filtered);
  } else {
    alert('검색은 장터와 커뮤니티 페이지에서 가능합니다.');
  }
}

function renderFilteredMarket(posts) {
  const container = document.getElementById('market-list');
  if (!container) return;

  container.innerHTML = '';
  if (posts.length === 0) {
    container.innerHTML = '<p>검색 결과가 없습니다.</p>';
    return;
  }

  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${escapeHtml(post.title)}</h3>
      <p><strong>가격:</strong> ${escapeHtml(post.price)} | <strong>작성자:</strong> ${escapeHtml(post.author)}</p>
      <p style="margin-top: 10px;">${escapeHtml(post.content)}</p>
    `;
    container.appendChild(card);
  });
}

function renderFilteredCommunity(posts) {
  const container = document.getElementById('community-list');
  if (!container) return;

  container.innerHTML = '';
  if (posts.length === 0) {
    container.innerHTML = '<p>검색 결과가 없습니다.</p>';
    return;
  }

  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${escapeHtml(post.title)}</h3>
      <p><strong>작성자:</strong> ${escapeHtml(post.author)}</p>
      <p style="margin-top: 10px;">${escapeHtml(post.content)}</p>
    `;
    container.appendChild(card);
  });
}

// 고객센터 구현
function initCustomerService() {
  if (!localStorage.getItem('inquiries')) {
    localStorage.setItem('inquiries', JSON.stringify([]));
  }

  const inquiryForm = document.getElementById('inquiry-form');
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        alert('로그인 후 문의 접수가 가능합니다.');
        window.location.href = 'login.html';
        return;
      }

      const title = document.getElementById('inquiry-title').value;
      const content = document.getElementById('inquiry-content').value;

      const inquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
      inquiries.unshift({
        id: Date.now(),
        author: currentUser.username,
        title,
        content,
        date: new Date().toLocaleDateString(),
        status: '접수 완료'
      });

      localStorage.setItem('inquiries', JSON.stringify(inquiries));
      alert('고객센터 문의가 성공적으로 접수되었습니다.');
      inquiryForm.reset();
      loadInquiriesList();
    });
  }

  loadInquiriesList();
}

function loadInquiriesList() {
  const container = document.getElementById('inquiry-list');
  if (!container) return;

  const inquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  container.innerHTML = '';
  if (inquiries.length === 0) {
    container.innerHTML = '<p>접수된 문의 내역이 없습니다.</p>';
    return;
  }

  inquiries.forEach(item => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.username === item.author)) {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>[${escapeHtml(item.status)}] ${escapeHtml(item.title)}</h3>
        <p><strong>작성자:</strong> ${escapeHtml(item.author)} | <strong>날짜:</strong> ${escapeHtml(item.date)}</p>
        <p style="margin-top: 10px;">${escapeHtml(item.content)}</p>
      `;
      container.appendChild(card);
    }
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
