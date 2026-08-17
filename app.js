// 초기 목업 데이터 (서버 연결 없이 동작 확인용)
const initialPosts = [
  {
    id: 1,
    title: "아이패드 에어 4세대 64GB 쌈무그린 (상태 양호)",
    price: 450000,
    category: "전자기기",
    content: "케이스 끼우고 사용해서 기스 없습니다.\n직거래 또는 택배 거래 가능합니다. 문의는 오픈채팅 주세요!",
    contact_link: "https://open.kakao.com/",
    image_url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500",
    nickname: "개발하는학생",
    created_at: "10분 전"
  },
  {
    id: 2,
    title: "자바스크립트 완벽 가이드 7판 (새책급)",
    price: 28000,
    category: "도서/티켓",
    content: "필기 전혀 없는 새책입니다. 안 읽게 되어서 팝니다.",
    contact_link: "https://open.kakao.com/",
    image_url: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500",
    nickname: "북러버",
    created_at: "1시간 전"
  }
];

class MarketApp {
  constructor() {
    this.posts = JSON.parse(localStorage.getItem('busbell_posts')) || initialPosts;
    this.currentCategory = '전체';
    this.init();
  }

  init() {
    this.renderPosts();
  }

  // 게시글 그리드 렌더링
  renderPosts(filterKeyword = '') {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';

    let filtered = this.posts.filter(post => {
      const matchCat = this.currentCategory === '전체' || post.category === this.currentCategory;
      const matchKey = post.title.toLowerCase().includes(filterKeyword.toLowerCase()) || 
                       post.content.toLowerCase().includes(filterKeyword.toLowerCase());
      return matchCat && matchKey;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #8b95a1;">등록된 물품이 없습니다.</div>`;
      return;
    }

    filtered.forEach(post => {
      const defaultImg = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=500';
      const card = document.createElement('div');
      card.className = 'card';
      card.onclick = () => this.openDetail(post.id);
      card.innerHTML = `
        <img class="card-thumb" src="${post.image_url || defaultImg}" alt="${post.title}" onerror="this.src='${defaultImg}'" />
        <div class="card-body">
          <div class="card-title">${this.escapeHtml(post.title)}</div>
          <div class="card-price">${post.price.toLocaleString()}원</div>
          <div class="card-meta">
            <span>${post.nickname}</span>
            <span>${post.created_at}</span>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // 카테고리 필터
  filterCategory(category) {
    this.currentCategory = category;
    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.innerText.trim() === category || (category === '취미/취미용품' && btn.innerText.includes('취미')));
    });
    this.renderPosts();
  }

  // 검색 로직
  handleSearch(e) {
    if (e.key === 'Enter') this.triggerSearch();
  }

  triggerSearch() {
    const query = document.getElementById('searchInput').value;
    this.renderPosts(query);
  }

  resetFilter() {
    this.currentCategory = '전체';
    document.getElementById('searchInput').value = '';
    this.filterCategory('전체');
  }

  // 모달 제어
  openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
  }

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  }

  // 새 게시글 등록
  handleCreatePost(e) {
    e.preventDefault();
    const newPost = {
      id: Date.now(),
      title: document.getElementById('postTitle').value,
      price: parseInt(document.getElementById('postPrice').value) || 0,
      category: document.getElementById('postCategory').value,
      contact_link: document.getElementById('postContact').value,
      image_url: document.getElementById('postImage').value,
      content: document.getElementById('postContent').value,
      nickname: "익명사용자",
      created_at: "방금 전"
    };

    this.posts.unshift(newPost);
    localStorage.setItem('busbell_posts', JSON.stringify(this.posts));
    this.renderPosts();
    this.closeModal('writeModal');
    document.getElementById('writeForm').reset();
  }

  // 게시글 상세정보 열기
  openDetail(postId) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    const detailBox = document.getElementById('detailContent');
    const defaultImg = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=500';

    detailBox.innerHTML = `
      ${post.image_url ? `<img class="detail-img" src="${post.image_url}" onerror="this.src='${defaultImg}'"/>` : ''}
      <div class="detail-seller">
        <div class="seller-avatar">${post.nickname[0]}</div>
        <div>
          <div style="font-weight:700;">${this.escapeHtml(post.nickname)}</div>
          <div style="font-size:0.75rem; color:#8b95a1;">P2P 직접 거래 등록 물품</div>
        </div>
      </div>
      <span style="font-size:0.8rem; background:#f2f4f6; padding:3px 8px; border-radius:4px; color:#4e5968;">${post.category}</span>
      <h2 style="font-size:1.25rem; margin-top:0.4rem;">${this.escapeHtml(post.title)}</h2>
      <div class="detail-price">${post.price.toLocaleString()}원</div>
      <p class="detail-desc">${this.escapeHtml(post.content)}</p>

      <!-- 법적 면책 안내 문구 (필수) -->
      <div class="legal-notice-box">
        ⚠️ <b>거래 안전 유의사항</b><br/>
        본 사이트는 통신판매중개자로서 거래 정보만 공유하는 장소이며, 대금 입금 및 개인 간 거래에 개입하지 않습니다. 사기 예방을 위해 직접 만나서 물품 확인 후 거래하시기 바랍니다.
      </div>

      <a href="${post.contact_link}" target="_blank" class="btn-contact">💬 판매자와 오픈채팅으로 연락하기</a>
    `;

    this.openModal('detailModal');
  }

  escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
}

const app = new MarketApp();