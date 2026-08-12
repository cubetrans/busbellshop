// supabase api 가져오기 -- 서울교덕 제작[cite: 2]
const SUPABASE_URL = 'https://ipgzhipiebcnkfqzufgm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZ3poaXBpZWJjbmtmcXp1ZmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5ODMxMTgsImV4cCI6MjEwMTU1OTExOH0.byzqUDMvoAIbybPYbyKsR6KoPnpLPs0jsdawAnW0Eww';

// 안전한 Supabase 클라이언트 초기화
let supabaseClient = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.error('Supabase SDK가 로드되지 않았습니다.');
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  initAuthHeader();
  initMarketSystem();
  initCommunitySystem();
  initMypageSystem();
  initAdminSystem();
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

// 로그인 상태 및 환영 메시지 관리 + 로그인/로그아웃 버튼 동적 변경
function initAuthHeader() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
  const userGreetingEls = document.querySelectorAll('.user-greeting, .mobile-user-greeting');
  const authActionBtns = document.querySelectorAll('.auth-action');

  userGreetingEls.forEach(el => {
    if (currentUser) {
      el.textContent = `${currentUser.username}님 환영합니다`;
    } else {
      el.textContent = '로그인이 필요합니다';
    }
  });

  // 상단 배너의 로그인 버튼을 로그아웃 버튼으로 동적 변환
  authActionBtns.forEach(btn => {
    if (btn.textContent.includes('로그인')) {
      if (currentUser) {
        btn.textContent = '로그아웃';
        btn.href = '#';
        btn.onclick = (e) => {
          e.preventDefault();
          localStorage.removeItem('currentUser');
          alert('로그아웃 되었습니다.');
          window.location.href = 'index.html';
        };
      }
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
  if (!supabaseClient) {
    alert('데이터베이스 연결 설정이 올바르지 않습니다.');
    return;
  }

  if (isLoginMode) {
    const { data, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('nickname', nickname)
      .eq('password', password)
      .single();

    if (error || !data) {
      alert('아이디나 비밀번호가 잘못되었습니다. 다시 확인하세요.');
      return;
    }

    const currentUser = {
      username: data.nickname,
      role: data.role || '일반회원',
      accountNum: data.account_number || ''
    };

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    alert(`${currentUser.username}님 환영합니다!`);
    window.location.href = 'index.html';
  } else {
    // 회원가입 시 기본 권한은 '일반회원'
    const { error } = await supabaseClient
      .from('users')
      .insert([{ nickname, password, role: '일반회원' }]);

    if (error) {
      alert('이미 사용중인 아이디입니다. 다른 아이디로 설정해주세요.');
      return;
    }

    alert('회원가입이 완료되었습니다! 로그인해 주세요.');
    window.location.reload();
  }
}

async function initMypageSystem() {
  const myNicknameEl = document.getElementById('my-nickname');
  if (!myNicknameEl) return;

  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return (window.location.href = 'login.html');

  const { data: userData } = await supabaseClient.from('users').select('*').eq('nickname', user.username).single();
  if (!userData) return;

  myNicknameEl.textContent = userData.nickname;
  document.getElementById('my-role').textContent = userData.role || '일반회원';
  
  // 기존 저장된 정보를 입력란에 미리 채워넣기 (Prefill)
  document.getElementById('my-bank-name').value = userData.bank_name || '';
  document.getElementById('my-account-holder').value = userData.account_holder || '';
  document.getElementById('my-account-num').value = userData.account_number || '';
  document.getElementById('my-address').value = userData.shipping_address || '';

  if (userData.role === '관리자') {
    const adminLink = document.getElementById('admin-link-container');
    if (adminLink) adminLink.style.display = 'block';
  }

  // 개인정보 및 배송지/계좌/예금주 수정 저장
  const form = document.getElementById('profile-update-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bank_name = document.getElementById('my-bank-name').value;
      const account_holder = document.getElementById('my-account-holder').value;
      const account_number = document.getElementById('my-account-num').value;
      const shipping_address = document.getElementById('my-address').value;

      const { error } = await supabaseClient.from('users').update({ 
        bank_name, 
        account_holder, 
        account_number, 
        shipping_address 
      }).eq('nickname', user.username);
      
      if (error) return alert('수정 실패');
      alert('정보가 성공적으로 저장되었습니다.');
    });
  }

  // 내 주문 내역 로드
  const orderContainer = document.getElementById('my-orders-list');
  if (orderContainer) {
    const { data: orders } = await supabaseClient.from('orders').select('*').eq('buyer_name', user.username).order('created_at', { ascending: false });
    orderContainer.innerHTML = '';
    if (!orders || orders.length === 0) {
      orderContainer.innerHTML = '<p style="margin-top:10px;">주문 내역이 없습니다.</p>';
    } else {
      orders.forEach(o => {
        orderContainer.innerHTML += `
          <div style="border:1px solid var(--input-border); padding:10px; margin-top:10px; border-radius:4px;">
            <p><strong>상품:</strong> ${escapeHtml(o.item_title)} (${escapeHtml(o.price)}원)</p>
            <p><strong>입금자명:</strong> ${escapeHtml(o.deposit_name)}</p>
            <p><strong>상태:</strong> <span style="color:blue;">${escapeHtml(o.status)}</span> ${o.rejection_reason ? `(사유: ${escapeHtml(o.rejection_reason)})` : ''}</p>
          </div>
        `;
      });
    }
  }
}

// 관리자 대시보드 시스템 (권한 체크 및 전체 정보 관리)
async function initAdminSystem() {
  const tableBody = document.getElementById('admin-user-tbody');
  if (!tableBody) return;

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    alert('로그인이 필요합니다.');
    window.location.href = 'login.html';
    return;
  }

  // DB에서 현재 사용자 권한 재확인 (비로그인 및 관리자 권한 없는 사용자 접근 원천 차단)
  const { data: userData, error: userError } = await supabaseClient
    .from('users')
    .select('role')
    .eq('nickname', currentUser.username)
    .single();

  if (userError || !userData || userData.role !== '관리자') {
    alert('관리자 권한이 없습니다.');
    window.location.href = 'index.html';
    return;
  }

  renderAdminUsers();
  renderAdminOrders();
}

async function renderAdminUsers() {
  const tbody = document.getElementById('admin-user-tbody');
  if (!tbody) return;

  const { data: users } = await supabaseClient.from('users').select('*').order('nickname');
  tbody.innerHTML = '';
  
  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="padding: 20px; text-align: center;">사용자가 없습니다.</td></tr>';
    return;
  }

  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--input-border)';
    tr.innerHTML = `
      <td style="padding: 8px; font-size: 11px;">${u.id}</td>
      <td style="padding: 8px;"><input type="text" value="${escapeHtml(u.nickname)}" class="ed-nick" data-id="${u.id}" style="width: 90px; padding: 4px;"></td>
      <td style="padding: 8px;"><input type="text" value="${escapeHtml(u.password)}" class="ed-pw" data-id="${u.id}" style="width: 80px; padding: 4px;"></td>
      <td style="padding: 8px;"><input type="text" value="${escapeHtml(u.bank_name || '')}" class="ed-bank" data-id="${u.id}" style="width: 80px; padding: 4px;" placeholder="은행명"></td>
      <td style="padding: 8px;"><input type="text" value="${escapeHtml(u.account_number || '')}" class="ed-acc" data-id="${u.id}" style="width: 100px; padding: 4px;" placeholder="계좌번호"></td>
      <td style="padding: 8px;"><input type="text" value="${escapeHtml(u.shipping_address || '')}" class="ed-addr" data-id="${u.id}" style="width: 120px; padding: 4px;" placeholder="배송지"></td>
      <td style="padding: 8px;">
        <select class="ed-role" data-id="${u.id}" style="padding: 4px;">
          <option value="일반회원" ${u.role === '일반회원' ? 'selected' : ''}>일반회원</option>
          <option value="특수회원" ${u.role === '특수회원' ? 'selected' : ''}>특수회원</option>
          <option value="관리자" ${u.role === '관리자' ? 'selected' : ''}>관리자</option>
        </select>
      </td>
      <td style="padding: 8px;">
        <button class="btn btn-primary save-u" data-id="${u.id}" style="padding: 4px 8px; font-size: 11px; margin-right: 4px;">저장</button>
        <button class="btn btn-outline del-u" data-id="${u.id}" style="padding: 4px 8px; font-size: 11px; color: red; border-color: red;">삭제</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // 저장 버튼 이벤트
  document.querySelectorAll('.save-u').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      const row = e.target.closest('tr');
      const nickname = row.querySelector('.ed-nick').value;
      const password = row.querySelector('.ed-pw').value;
      const bank_name = row.querySelector('.ed-bank').value;
      const account_number = row.querySelector('.ed-acc').value;
      const shipping_address = row.querySelector('.ed-addr').value;
      const role = row.querySelector('.ed-role').value;

      const { error } = await supabaseClient.from('users').update({ nickname, password, bank_name, account_number, shipping_address, role }).eq('id', id);
      if (error) return alert('수정 실패');
      alert('사용자 정보가 수정되었습니다.');
      renderAdminUsers();
    });
  });

  // 삭제 버튼 이벤트
  document.querySelectorAll('.del-u').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (!confirm('정말 삭제하시겠습니까?')) return;
      const { error } = await supabaseClient.from('users').delete().eq('id', e.target.dataset.id);
      if (error) return alert('삭제 실패');
      alert('삭제되었습니다.');
      renderAdminUsers();
    });
  });
}
// 장터 시스템
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
      if (!supabaseClient) return alert('DB 연결 오류');

      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        alert('로그인 후 작성 가능합니다.');
        window.location.href = 'login.html';
        return;
      }

      const title = document.getElementById('post-title').value;
      const price = document.getElementById('post-price').value;
      const content = document.getElementById('post-content').value;

      const { error } = await supabaseClient.from('market_posts').insert([
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

// --- 1. 장터 글 목록 렌더링 (구매, 수정, 삭제 버튼 포함) ---
async function renderMarketPosts(searchTerm = '') {
  const container = document.getElementById('market-list');
  if (!container) return;

  let query = supabaseClient.from('market_posts').select('*').order('created_at', { ascending: false });
  if (searchTerm) query = query.ilike('title', `%${searchTerm}%`);

  const { data: posts } = await query;
  container.innerHTML = '';
  if (!posts || posts.length === 0) {
    container.innerHTML = '<p>등록된 상품이 없습니다.</p>';
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '15px';

    // 구매하기 버튼 (누구나 구매 가능)
    let actionBtns = `<button onclick="buyMarketItem('${escapeHtml(post.author_name)}', '${escapeHtml(post.title)}', '${escapeHtml(post.price)}')" class="btn btn-primary" style="margin-top:10px; margin-right:5px;">구매하기</button>`;

    // 작성자 본인 또는 관리자일 경우 수정/삭제 버튼 추가
    if (currentUser && (currentUser.username === post.author_name || currentUser.role === '관리자')) {
      actionBtns += `
        <button onclick="editMarketPost('${post.id}', '${escapeHtml(post.title)}', '${escapeHtml(post.price)}', '${escapeHtml(post.content)}')" class="btn btn-outline" style="margin-top:10px; margin-right:5px;">수정</button>
        <button onclick="deleteMarketPost('${post.id}')" class="btn btn-outline" style="margin-top:10px; color:red; border-color:red;">삭제</button>
      `;
    }

    card.innerHTML = `
      <h3>${escapeHtml(post.title)}</h3>
      <p><strong>가격:</strong> ${escapeHtml(post.price)} | <strong>작성자:</strong> ${escapeHtml(post.author_name)}</p>
      <p style="margin-top:5px;">${escapeHtml(post.content)}</p>
      ${actionBtns}
    `;
    container.appendChild(card);
  });
}
// 커뮤니티 시스템
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
      if (!supabaseClient) return alert('DB 연결 오류');

      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        alert('로그인 후 작성 가능합니다.');
        window.location.href = 'login.html';
        return;
      }

      const category = document.getElementById('post-category-select').value;
      if (category === '공지게시판' && currentUser.role !== '관리자') {
        alert('공지게시판은 관리자만 작성할 수 있습니다.');
        return;
      }

      const title = document.getElementById('community-post-title').value;
      const content = document.getElementById('community-post-content').value;

      const { error } = await supabaseClient.from('community_posts').insert([
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

// --- 4. 커뮤니티 글 목록 렌더링 (수정, 삭제 포함) ---
async function renderCommunityPosts(category) {
  const container = document.getElementById('community-list');
  if (!container) return;

  const { data: posts } = await supabaseClient.from('community_posts').select('*').eq('category', category).order('created_at', { ascending: false });
  container.innerHTML = '';
  if (!posts || posts.length === 0) {
    container.innerHTML = '<p>등록된 글이 없습니다.</p>';
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '15px';

    let authorBtns = '';
    if (currentUser && (currentUser.username === post.author_name || currentUser.role === '관리자')) {
      authorBtns = `
        <button onclick="editCommunityPost('${post.id}', '${escapeHtml(post.title)}', '${escapeHtml(post.content)}')" class="btn btn-outline" style="margin-top:10px; margin-right:5px;">수정</button>
        <button onclick="deleteCommunityPost('${post.id}')" class="btn btn-outline" style="margin-top:10px; color:red; border-color:red;">삭제</button>
      `;
    }

    card.innerHTML = `
      <h3>[${escapeHtml(post.category)}] ${escapeHtml(post.title)}</h3>
      <p><strong>작성자:</strong> ${escapeHtml(post.author_name)}</p>
      <p style="margin-top:5px;">${escapeHtml(post.content)}</p>
      ${authorBtns}
    `;
    container.appendChild(card);
  });
}

async function editCommunityPost(id, oldTitle, oldContent) {
  const newTitle = prompt('수정할 제목을 입력하세요:', oldTitle);
  if (newTitle === null) return;
  const newContent = prompt('수정할 내용을 입력하세요:', oldContent);
  if (newContent === null) return;

  const { error } = await supabaseClient.from('community_posts').update({
    title: newTitle,
    content: newContent
  }).eq('id', id);

  if (error) return alert('수정 중 오류가 발생했습니다.');
  alert('글이 수정되었습니다.');
  location.reload();
}

async function deleteCommunityPost(id) {
  if (!confirm('삭제하시겠습니까?')) return;
  await supabaseClient.from('community_posts').delete().eq('id', id);
  alert('삭제되었습니다.');
  location.reload();
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

// --- 주문 시스템 (장터 구매 및 관리자용) ---

// 입금자명 생성 함수
function generateDepositName(seller, buyer, item) {
    const s = (seller || '판매').slice(0, 2);
    const b = (buyer || '구매').slice(0, 2);
    const i = (item || '상품').slice(0, 5);
    const r = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A~Z 난수 1개
    return `${s}${b}${i}${r}`;
}

// 상품 구매 로직 (장터 게시글 내 "구매하기" 버튼 클릭 시)
async function purchaseItem(seller, title, price) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return alert('로그인 후 구매 가능합니다.');
    
    const depositName = generateDepositName(seller, currentUser.username, title);
    
    const { error } = await supabaseClient.from('orders').insert([{
        buyer_name: currentUser.username,
        seller_name: seller,
        item_title: title,
        price: price,
        deposit_name: depositName,
        status: '입금확인중'
    }]);

    if (error) return alert('주문 실패');
    
    alert(`[에스크로 안내]\n\n구매가 요청되었습니다.\n관리진 계좌: (예시) 카카오뱅크 3333-01-1234567\n\n입금자명: ${depositName}\n\n입금 완료 버튼을 누르시면 확인 후 배송이 진행됩니다.`);
}

// 주문 상태 업데이트 (관리자용)
async function updateOrderStatus(orderId, newStatus) {
    let reason = null;
    if (newStatus === '처리불가' || newStatus === '보류') {
        reason = prompt('사유를 입력하세요:');
        if (!reason) return alert('사유는 필수입니다.');
    }

    const { error } = await supabaseClient
        .from('orders')
        .update({ status: newStatus, rejection_reason: reason })
        .eq('id', orderId);

    if (error) alert('수정 실패');
    else {
        alert('상태가 업데이트되었습니다.');
        renderAdminOrders(); // 관리자 페이지 새로고침
    }
}

// --- 입금자명 생성 및 구매 로직 ---
function generateDepositName(seller, buyer, item) {
    const s = (seller || '판매').slice(0, 2);
    const b = (buyer || '구매').slice(0, 2);
    const i = (item || '상품').slice(0, 5);
    const r = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `${s}${b}${i}${r}`;
}

// --- 2. 장터 상품 구매 기능 ---
async function buyMarketItem(seller, title, price) {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) {
    alert('로그인이 필요합니다.');
    return window.location.href = 'login.html';
  }

  // 입금자명 생성: 판매자명 앞2글자 + 구매자명 앞2글자 + 상품명 앞5글자 + 임의난수 1글자
  const s = seller.slice(0, 2);
  const b = user.username.slice(0, 2);
  const t = title.slice(0, 5);
  const randChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const depositName = `${s}${b}${t}${randChar}`;

  const { error } = await supabaseClient.from('orders').insert([{
    buyer_name: user.username,
    seller_name: seller,
    item_title: title,
    price: price,
    deposit_name: depositName,
    status: '입금확인중'
  }]);

  if (error) return alert('주문 요청 중 오류가 발생했습니다.');

  alert(`[관리진 계좌 안내]\n카카오뱅크 3333-01-9999999 (예금주: 버스벨샵)\n\n입금자명: ${depositName}\n\n확인되었습니다. 추후 입금 확인 후 배송 진행 예정입니다.`);
  location.reload();
}

async function editMarketPost(id, oldTitle, oldPrice, oldContent) {
  const newTitle = prompt('수정할 제목을 입력하세요:', oldTitle);
  if (newTitle === null) return;
  const newPrice = prompt('수정할 가격을 입력하세요:', oldPrice);
  if (newPrice === null) return;
  const newContent = prompt('수정할 내용을 입력하세요:', oldContent);
  if (newContent === null) return;

  const { error } = await supabaseClient.from('market_posts').update({
    title: newTitle,
    price: newPrice,
    content: newContent
  }).eq('id', id);

  if (error) return alert('수정 중 오류가 발생했습니다.');
  alert('상품 정보가 수정되었습니다.');
  renderMarketPosts();
}

async function deleteMarketPost(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  await supabaseClient.from('market_posts').delete().eq('id', id);
  alert('삭제되었습니다.');
  renderMarketPosts();
}

// 관리자 주문 목록 불러오기
async function renderAdminOrders() {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  const { data: orders, error } = await supabaseClient
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('주문 불러오기 에러:', error);
    return;
  }

  tbody.innerHTML = '';
  if (!orders || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="padding: 20px; text-align: center;">주문 내역이 없습니다.</td></tr>';
    return;
  }

  orders.forEach(o => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--input-border)';
    tr.innerHTML = `
      <td style="padding:8px;">${escapeHtml(o.buyer_name)}</td>
      <td style="padding:8px;">${escapeHtml(o.seller_name)}</td>
      <td style="padding:8px;">${escapeHtml(o.item_title)}</td>
      <td style="padding:8px;"><b>${escapeHtml(o.deposit_name)}</b></td>
      <td style="padding:8px;">
        <select onchange="changeOrderStatus('${o.id}', this.value)" style="padding:4px;">
          <option value="입금확인중" ${o.status === '입금확인중' ? 'selected' : ''}>입금확인중</option>
          <option value="입금확인완료" ${o.status === '입금확인완료' ? 'selected' : ''}>입금확인완료</option>
          <option value="처리중" ${o.status === '처리중' ? 'selected' : ''}>처리중</option>
          <option value="처리불가" ${o.status === '처리불가' ? 'selected' : ''}>처리불가</option>
          <option value="보류" ${o.status === '보류' ? 'selected' : ''}>보류</option>
          <option value="처리완료" ${o.status === '처리완료' ? 'selected' : ''}>처리완료</option>
        </select>
      </td>
      <td style="padding:8px;">${escapeHtml(o.rejection_reason || '-')}</td>
      <td style="padding:8px;"><button onclick="deleteOrder('${o.id}')" class="btn btn-outline" style="color:red; border-color:red; padding:2px 6px; font-size:11px;">삭제</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// 주문 상태 변경 함수
async function changeOrderStatus(id, status) {
  let rejection_reason = null;
  if (status === '처리불가' || status === '보류') {
    rejection_reason = prompt('사유를 입력하세요:');
    if (!rejection_reason) {
      alert('사유는 필수입니다.');
      renderAdminOrders();
      return;
    }
  }

  const { error } = await supabaseClient.from('orders').update({ status, rejection_reason }).eq('id', id);
  if (error) return alert('상태 변경 실패');
  alert('상태가 변경되었습니다.');
  renderAdminOrders();
}

// 주문 삭제 함수
async function deleteOrder(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  const { error } = await supabaseClient.from('orders').delete().eq('id', id);
  if (error) return alert('삭제 실패');
  renderAdminOrders();
}
