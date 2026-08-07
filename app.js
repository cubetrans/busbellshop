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
  initAdminManagement();
  initCustomerService();
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

// 장터 시스템 및 에스크로 결제 구현
function initMarketSystem() {
  if (!localStorage.getItem('market_posts')) {
    const defaultPosts = [
      { id: 1, title: '현대 버스 하차벨 판매합니다', author: '서울교덕', authorId: 'user1', price: '15000', content: '실사용감 적은 현대 저상버스 하차벨입니다.' },
      { id: 2, title: '대우버스 안내방송기 팝니다', author: '교통동호인', authorId: 'user2', price: '30000', content: '대우 bs110 음성합성기 작동 잘 됩니다.' }
    ];
    localStorage.setItem('market_posts', JSON.stringify(defaultPosts));
  }

  const marketListContainer = document.getElementById('market-list');
  if (!marketListContainer) return;

  // 상품 등록 폼 토글 버튼
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
      formContainer.style.display = 'none';
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
    const numericPrice = parseInt(String(post.price).replace(/[^0-9]/g, '')) || 0;
    const formattedPrice = numericPrice ? numericPrice.toLocaleString() + '원' : post.price;

    card.innerHTML = `
      <h3>${escapeHtml(post.title)}</h3>
      <p><strong>가격:</strong> ${escapeHtml(formattedPrice)} | <strong>작성자:</strong> ${escapeHtml(post.author)}</p>
      <p style="margin-top: 10px;">${escapeHtml(post.content)}</p>
      <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="btn btn-primary btn-sm escrow-buy-btn" data-id="${post.id}" data-price="${numericPrice}">안심 에스크로 구매</button>
        ${isAuthorOrAdmin ? `
          <button class="btn btn-outline btn-sm edit-post-btn" data-id="${post.id}">수정</button>
          <button class="btn btn-danger btn-sm delete-post-btn" data-id="${post.id}">삭제</button>
        ` : ''}
      </div>
    `;
    container.appendChild(card);
  });

  // 에스크로 구매 시스템 연동
  document.querySelectorAll('.escrow-buy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        alert('구매를 위해 로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
      }
      const priceVal = parseInt(e.target.getAttribute('data-price')) || 0;
      const fee = Math.floor(priceVal * 0.02);
      const sellerAmount = priceVal - fee;

      alert(
        `[에스크로 안전결제 안내]\n\n` +
        `구매자는 아래 관리진 계좌로 상품 정가(${priceVal.toLocaleString()}원)를 입금해 주세요.\n\n` +
        `• 입금 계좌: 하나은행 154-910580-98807 (안수현)\n` +
        `• 결제 금액: ${priceVal.toLocaleString()}원\n` +
        `• 정산 안내: 플랫폼 수수료 2%(${fee.toLocaleString()}원)를 제외한 98%(${sellerAmount.toLocaleString()}원)가 판매자에게 안전하게 입금됩니다.\n\n` +
        `입금 후 고객센터 또는 관리자를 통해 문의해 주시면 확인 후 배송 조치가 진행됩니다.`
      );
    });
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

// 커뮤니티 시스템 구현 (카테고리별, 권한별)
function initCommunitySystem() {
  if (!localStorage.getItem('community_posts')) {
    const defaultCommunityPosts = [
      { id: 1, category: '공지게시판', title: '버스벨샵 이용 수칙 안내', author: '관리자', authorId: 'admin1', content: '상호 존중하는 커뮤니티를 만들어 봅시다.' },
      { id: 2, category: '질문게시판', title: '하차벨 배선 연결 어떻게 하나요?', author: '서울교덕', authorId: 'user1', content: '건전지 연결 법이 궁금합니다.' },
      { id: 3, category: '수집/자랑게시판', title: '제가 수집한 하차벨 세트입니다!', author: '교통동호인', authorId: 'user2', content: '실제 버스 부품들 모아둔 박스입니다.' }
    ];
    localStorage.setItem('community_posts', JSON.stringify(defaultCommunityPosts));
  }

  const communityListContainer = document.getElementById('community-list');
  if (!communityListContainer) return;

  let currentCategory = '공지게시판';

  // 카테고리 탭 버튼 이벤트
  const categoryBtns = document.querySelectorAll('.category-btn');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.getAttribute('data-category');
      renderCommunityPosts(currentCategory);
    });
  });

  // 글쓰기 폼 토글
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

  const postForm = document.getElementById('community-post-form');
  if (postForm) {
    postForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        alert('로그인 후 작성 가능합니다.');
        window.location.href = 'login.html';
        return;
      }

      const category = document.getElementById('post-category-select').value;
      
      // 공지게시판은 관리자만 작성 가능
      if (category === '공지게시판' && currentUser.role !== 'admin') {
        alert('공지게시판은 관리자만 작성할 수 있습니다.');
        return;
      }

      const title = document.getElementById('community-post-title').value;
      const content = document.getElementById('community-post-content').value;

      const posts = JSON.parse(localStorage.getItem('community_posts')) || [];
      const newPost = {
        id: Date.now(),
        category,
        title,
        content,
        author: currentUser.username,
        authorId: currentUser.id || currentUser.username
      };

      posts.unshift(newPost);
      localStorage.setItem('community_posts', JSON.stringify(posts));
      postForm.reset();
      formContainer.style.display = 'none';
      renderCommunityPosts(currentCategory);
    });
  }
}

function renderCommunityPosts(category) {
  const container = document.getElementById('community-list');
  if (!container) return;

  const posts = JSON.parse(localStorage.getItem('community_posts')) || [];
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  const filteredPosts = posts.filter(p => p.category === category);

  container.innerHTML = '';
  if (filteredPosts.length === 0) {
    container.innerHTML = `<p>[${category}]에 등록된 글이 없습니다.</p>`;
    return;
  }

  filteredPosts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'card';
    
    const isAuthorOrAdmin = currentUser && (currentUser.role === 'admin' || currentUser.username === post.author || currentUser.id === post.authorId);

    card.innerHTML = `
      <h3>[${escapeHtml(post.category)}] ${escapeHtml(post.title)}</h3>
      <p><strong>작성자:</strong> ${escapeHtml(post.author)}</p>
      <p style="margin-top: 10px;">${escapeHtml(post.content)}</p>
      ${isAuthorOrAdmin ? `
        <div style="margin-top: 15px; display: flex; gap: 10px;">
          <button class="btn btn-outline btn-sm edit-community-btn" data-id="${post.id}">수정</button>
          <button class="btn btn-danger btn-sm delete-community-btn" data-id="${post.id}">삭제</button>
        </div>
      ` : ''}
    `;
    container.appendChild(card);
  });

  document.querySelectorAll('.delete-community-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.target.getAttribute('data-id'));
      if (confirm('정말 이 게시글을 삭제하시겠습니까?')) {
        let posts = JSON.parse(localStorage.getItem('community_posts')) || [];
        posts = posts.filter(p => p.id !== id);
        localStorage.setItem('community_posts', JSON.stringify(posts));
        renderCommunityPosts(category);
      }
    });
  });

  document.querySelectorAll('.edit-community-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.target.getAttribute('data-id'));
      let posts = JSON.parse(localStorage.getItem('community_posts')) || [];
      const post = posts.find(p => p.id === id);
      if (!post) return;

      const newTitle = prompt('수정할 제목:', post.title);
      const newContent = prompt('수정할 내용:', post.content);

      if (newTitle !== null && newContent !== null) {
        post.title = newTitle;
        post.content = newContent;
        localStorage.setItem('community_posts', JSON.stringify(posts));
        renderCommunityPosts(category);
      }
    });
  });
}

// 관리자 페이지 회원 관리
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
