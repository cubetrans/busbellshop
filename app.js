// supabase api 가져오기 -- 서울교덕 제작
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
  initEmergencyBanner();
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
// 로그인 상태 및 환영 메시지 관리 + 로그인/로그아웃 버튼 동적 변경
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

// 입금자명 생성 함수
function generateDepositName(seller, buyer, item) {
  const s = (seller || '판매').slice(0, 2);
  const b = (buyer || '구매').slice(0, 2);
  const i = (item || '상품').slice(0, 5);
  const r = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${s}${b}${i}${r}`;
}

// 마이페이지 시스템
async function initMypageSystem() {
  const myNicknameEl = document.getElementById('my-nickname');
  if (!myNicknameEl) return;

  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return (window.location.href = 'login.html');

  const { data: userData } = await supabaseClient.from('users').select('*').eq('nickname', user.username).single();
  if (!userData) return;

  myNicknameEl.textContent = userData.nickname;
  document.getElementById('my-role').textContent = userData.role || '일반회원';
  
  document.getElementById('my-bank-name').value = userData.bank_name || '';
  document.getElementById('my-account-holder').value = userData.account_holder || '';
  document.getElementById('my-account-num').value = userData.account_number || '';
  document.getElementById('my-address').value = userData.shipping_address || '';

  if (userData.role === '관리자') {
    const adminLink = document.getElementById('admin-link-container');
    if (adminLink) adminLink.style.display = 'block';
  }

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
        const trackingHtml = o.tracking_number 
          ? `<p><strong>배송정보:</strong> <span style="color:green; font-weight:bold;">${escapeHtml(o.courier_company)} / ${escapeHtml(o.tracking_number)}</span></p>` 
          : `<p><strong>배송정보:</strong> <span style="color:gray;">배송 준비 중 (운송장 미등록)</span></p>`;

        orderContainer.innerHTML += `
          <div style="border:1px solid var(--input-border); padding:10px; margin-top:10px; border-radius:4px;">
            <p><strong>상품:</strong> ${escapeHtml(o.item_title)} (${escapeHtml(o.price)}원)</p>
            <p><strong>입금자명:</strong> ${escapeHtml(o.deposit_name)}</p>
            ${trackingHtml}
            <p><strong>상태:</strong> <span style="color:blue;">${escapeHtml(o.status)}</span> ${o.rejection_reason ? `(사유: ${escapeHtml(o.rejection_reason)})` : ''}</p>
          </div>
        `;
      });
    }
  }
  renderMySales(user.username);
}

// 관리자 대시보드 시스템
async function initAdminSystem() {
  const adminUsersTbody = document.getElementById('admin-users-tbody');
  const adminOrdersTbody = document.getElementById('admin-orders-tbody');
  if (!adminUsersTbody && !adminOrdersTbody) return;

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    alert('로그인이 필요합니다.');
    window.location.href = 'login.html';
    return;
  }

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
  const tbody = document.getElementById('admin-users-tbody');
  if (!tbody) return;

  const { data: users, error: userError } = await supabaseClient.from('users').select('*');
  if (userError) {
    console.error('사용자 불러오기 에러:', userError);
    return;
  }

  tbody.innerHTML = '';
  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">등록된 사용자가 없습니다.</td></tr>';
    return;
  }

  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--input-border)';
    const accountHolder = u.account_holder || '-';

    tr.innerHTML = `
      <td style="padding:10px;">${escapeHtml(u.nickname)}</td>
      <td style="padding:10px;">
        <select onchange="changeUserRole('${u.id}', this.value)" style="padding:4px; background:var(--input-bg); color:var(--text-color); border:1px solid var(--input-border); border-radius:4px;">
          <option value="일반회원" ${u.role === '일반회원' ? 'selected' : ''}>일반회원</option>
          <option value="관리자" ${u.role === '관리자' ? 'selected' : ''}>관리자</option>
        </select>
      </td>
      <td style="padding:10px;">${escapeHtml(u.bank_name || '-')}</td>
      <td style="padding:10px;">${escapeHtml(u.account_number || '-')}</td>
      <td style="padding:10px; font-weight:bold; color:#d9534f;">${escapeHtml(accountHolder)}</td>
      <td style="padding:10px;">
        <button onclick="deleteUser('${u.id}')" class="btn btn-outline" style="color:red; border-color:red; padding:4px 8px; font-size:12px;">삭제</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 사용자 역할 변경 함수
async function changeUserRole(userId, newRole) {
  const { error } = await supabaseClient.from('users').update({ role: newRole }).eq('id', userId);
  if (error) {
    alert('사용자 역할 변경 실패');
    renderAdminUsers();
    return;
  }
  alert('사용자 역할이 성공적으로 변경되었습니다.');
  renderAdminUsers();
}

async function deleteUser(userId) {
  if (!confirm('정말 이 사용자를 삭제하시겠습니까?')) return;
  const { error } = await supabaseClient.from('users').delete().eq('id', userId);
  if (error) return alert('사용자 삭제 실패');
  alert('삭제되었습니다.');
  renderAdminUsers();
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

    let actionBtns = `<button onclick="buyMarketItem('${escapeHtml(post.author_name)}', '${escapeHtml(post.title)}', '${escapeHtml(post.price)}')" class="btn btn-primary" style="margin-top:10px; margin-right:5px;">구매하기</button>`;

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

// 장터 상품 구매 기능 (배송지 주소 포함)
async function buyMarketItem(seller, title, price) {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) {
    alert('로그인이 필요합니다.');
    return window.location.href = 'login.html';
  }

  const { data: userData } = await supabaseClient.from('users').select('shipping_address').eq('nickname', user.username).single();
  const shippingAddress = userData ? userData.shipping_address : '';

  if (!shippingAddress) {
    alert('마이페이지에서 배송지 주소를 먼저 등록해주세요!');
    return window.location.href = 'mypage.html';
  }

  const depositName = generateDepositName(seller, user.username, title);

  const { error } = await supabaseClient.from('orders').insert([{
    buyer_name: user.username,
    seller_name: seller,
    item_title: title,
    price: price,
    deposit_name: depositName,
    status: '입금확인중',
    shipping_address: shippingAddress
  }]);

  if (error) return alert('주문 요청 중 오류가 발생했습니다.');

  alert(`[관리진 계좌 안내]\n하나은행 154-920580-98807 (예금주: 안수현)\n\n입금자명: ${depositName}\n\n 추후 입금 확인 후 배송 진행 예정입니다.`);
  location.reload();
}

async function editMarketPost(id) {
  // 1. 데이터베이스에서 해당 글의 기존 정보를 직접 가져옴
  const { data: post, error: fetchError } = await supabaseClient
    .from('market_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !post) {
    alert('게시글 정보를 불러오지 못했습니다.');
    return;
  }

  // 2. 차례대로 제목, 가격, 내용 수정 창 띄우기 (기존 값 자동 세팅)
  const newTitle = prompt('수정할 제목을 입력하세요:', post.title);
  if (newTitle === null) return;

  const newPrice = prompt('수정할 가격을 입력하세요:', post.price);
  if (newPrice === null) return;

  const newContent = prompt('수정할 내용을 입력하세요:', post.content);
  if (newContent === null) return;

  // 3. Supabase에 세 가지 모두 업데이트 반영
  const { error: updateError } = await supabaseClient
    .from('market_posts')
    .update({
      title: newTitle,
      price: newPrice,
      content: newContent
    })
    .eq('id', id);

  if (updateError) {
    alert('상품 수정 중 오류가 발생했습니다.');
    console.error(updateError);
    return;
  }

  alert('상품의 제목, 가격, 내용이 모두 성공적으로 수정되었습니다!');
  renderMarketPosts(); // 목록 새로고침
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

  if (error) return console.error(error);

  const { data: usersData } = await supabaseClient.from('users').select('nickname, bank_name, account_holder, account_number');
  const userMap = {};
  if (usersData) {
    usersData.forEach(u => { userMap[u.nickname] = u; });
  }

  tbody.innerHTML = '';
  if (!orders || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="padding: 20px; text-align: center;">주문 내역이 없습니다.</td></tr>';
    return;
  }

  orders.forEach(o => {
    const sellerInfo = userMap[o.seller_name] || {};
    const sellerBankText = sellerInfo.account_number 
      ? `<br><small style="color:#d9534f; font-weight:bold;">정산계좌: ${escapeHtml(sellerInfo.bank_name)} ${escapeHtml(sellerInfo.account_number)} (${escapeHtml(sellerInfo.account_holder)})</small>` 
      : `<br><small style="color:red;">정산계좌 미등록</small>`;

    const trackingDisplay = o.tracking_number 
      ? `<br><small style="color:green; font-weight:bold;">[${escapeHtml(o.courier_company)}] ${escapeHtml(o.tracking_number)}</small>` 
      : `<br><small style="color:gray;">[운송장 미등록]</small>`;

    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--input-border)';
    tr.innerHTML = `
      <td style="padding:8px;">${escapeHtml(o.buyer_name)}</td>
      <td style="padding:8px;">${escapeHtml(o.seller_name)} ${sellerBankText}</td>
      <td style="padding:8px;">${escapeHtml(o.item_title)}</td>
      <td style="padding:8px;"><b>${escapeHtml(o.deposit_name)}</b> ${trackingDisplay}</td>
      <td style="padding:8px;">
        <select onchange="changeOrderStatus('${o.id}', this.value)" style="padding:4px;">
          <option value="입금확인중" ${o.status === '입금확인중' ? 'selected' : ''}>입금확인중</option>
          <option value="입금확인완료" ${o.status === '입금확인완료' ? 'selected' : ''}>입금확인완료</option>
          <option value="처리중" ${o.status === '처리중' ? 'selected' : ''}>처리중</option>
          <option value="처리불가" ${o.status === '처리불가' ? 'selected' : ''}>처리불가</option>
          <option value="보류" ${o.status === '보류' ? 'selected' : ''}>보류</option>
          <option value="처리완료" ${o.status === '처리완료' ? 'selected' : ''}>처리완료 (정산완료)</option>
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

// 판매 내역 불러오기 (판매자용)
async function renderMySales(username) {
  const salesContainer = document.getElementById('my-sales-list');
  if (!salesContainer) return;

  const { data: sales } = await supabaseClient.from('orders').select('*').eq('seller_name', username).order('created_at', { ascending: false });
  salesContainer.innerHTML = '';
  if (!sales || sales.length === 0) {
    salesContainer.innerHTML = '<p style="margin-top:10px;">판매 중인 내역이 없습니다.</p>';
    return;
  }

  sales.forEach(s => {
    salesContainer.innerHTML += `
      <div style="border:1px solid var(--input-border); padding:10px; margin-top:10px; border-radius:4px;">
        <p><strong>상품명:</strong> ${escapeHtml(s.item_title)} (${escapeHtml(s.price)}원)</p>
        <p><strong>구매자:</strong> ${escapeHtml(s.buyer_name)}</p>
        <p><strong>배송지 주소:</strong> <span style="color:#d9534f; font-weight:bold;">${escapeHtml(s.shipping_address || '주소 정보 없음')}</span></p>
        <p><strong>상태:</strong> <span style="color:blue;">${escapeHtml(s.status)}</span></p>
        <div style="margin-top:10px; display:flex; gap:5px; flex-wrap:wrap; align-items:center;">
          <input type="text" id="courier-${s.id}" placeholder="택배사 (예: 우체국)" value="${escapeHtml(s.courier_company || '')}" style="padding:6px; font-size:12px; width:110px; border:1px solid var(--input-border); background:var(--input-bg); color:var(--text-color); border-radius:4px;">
          <input type="text" id="tracking-${s.id}" placeholder="운송장 번호" value="${escapeHtml(s.tracking_number || '')}" style="padding:6px; font-size:12px; width:140px; border:1px solid var(--input-border); background:var(--input-bg); color:var(--text-color); border-radius:4px;">
          <button onclick="updateTracking('${s.id}')" class="btn btn-primary" style="padding:6px 10px; font-size:12px;">운송장 등록</button>
        </div>
      </div>
    `;
  });
}

// 운송장 번호 저장 함수
async function updateTracking(orderId) {
  const courier = document.getElementById(`courier-${orderId}`).value;
  const tracking = document.getElementById(`tracking-${orderId}`).value;

  if (!courier || !tracking) {
    return alert('택배사와 운송장 번호를 모두 입력해주세요.');
  }

  const { error } = await supabaseClient.from('orders').update({
    courier_company: courier,
    tracking_number: tracking
  }).eq('id', orderId);

  if (error) return alert('등록 실패');
  alert('운송장 번호가 등록되었습니다.');
  location.reload();
}

// 긴급공지 배너 불러오기 (모든 페이지 공통 실행)
async function initEmergencyBanner() {
  const banner = document.getElementById('emergency-banner');
  const textEl = document.getElementById('emergency-text');
  if (!banner || !textEl) return;

  const { data, error } = await supabaseClient
    .from('site_settings')
    .select('value')
    .eq('key', 'emergency_notice')
    .single();

  if (error || !data || !data.value || data.value.trim() === '') {
    banner.style.display = 'none'; // 내용이 없거나 공백이면 숨김
  } else {
    textEl.textContent = data.value;
    banner.style.display = 'block'; // 내용이 있으면 표시
  }

  // 관리자 페이지일 경우 폼에 기존 내용 채워넣기
  const emergencyInput = document.getElementById('emergency-input');
  if (emergencyInput && data) {
    emergencyInput.value = data.value || '';
  }

  const emergencyForm = document.getElementById('emergency-form');
  if (emergencyForm) {
    emergencyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newValue = emergencyInput.value;

      const { error: updateError } = await supabaseClient
        .from('site_settings')
        .update({ value: newValue })
        .eq('key', 'emergency_notice');

      if (updateError) {
        alert('긴급공지 저장 실패');
        return;
      }

      alert('긴급공지가 성공적으로 적용되었습니다.');
      location.reload();
    });
  }
}
