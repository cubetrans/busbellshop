// Supabase 초기화
const SUPABASE_URL = 'https://ipgzhipiebcnkfqzufgm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZ3poaXBpZWJjbmtmcXp1ZmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5ODMxMTgsImV4cCI6MjEwMTU1OTExOH0.byzqUDMvoAIbybPYbyKsR6KoPnpLPs0jsdawAnW0Eww';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isSignupMode = false;

// 🎨 권한별 닉네임 꾸미기
function formatName(name, role) {
    if (!name) return '';
    const userRole = role || localStorage.getItem('currentUserRole') || '일반회원';
    if (userRole === '관리자') return `👑 ${name}`;
    if (userRole === '판매자') return `💼 ${name}`;
    if (userRole === '특수회원') return `✨ ${name}`;
    return name;
}

// 📱 모바일 메뉴 토글
function toggleMobileMenu() {
    const navGroup = document.getElementById('navGroup');
    if (navGroup) navGroup.classList.toggle('active');
}

// ☀️/🌙 테마 전환
function toggleTheme() {
    const body = document.body;
    const themeBtn = document.getElementById('themeBtn') || document.getElementById('themeToggle');
    body.classList.toggle('light-mode');
    
    if (body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light');
        if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        localStorage.setItem('theme', 'dark');
        if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    checkLoginState();
    const themeBtn = document.getElementById('themeBtn') || document.getElementById('themeToggle');
    if (themeBtn && document.body.classList.contains('light-mode')) {
        themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
});

function toggleAuthDropdown() {
    const dropdown = document.getElementById('authDropdown');
    if (dropdown) dropdown.classList.toggle('active');
}

// 👤 로그인 상태 및 권한별 메뉴 처리
async function checkLoginState() {
    const user = localStorage.getItem('currentUser');
    const role = localStorage.getItem('currentUserRole') || '일반회원';
    const authToggleBtn = document.getElementById('authToggleBtn');
    const authFormArea = document.getElementById('authFormArea');

    if (!authToggleBtn || !authFormArea) return;

    if (user) {
        authToggleBtn.innerHTML = `<i class="fas fa-user-check"></i> ${formatName(user, role)}님 ▾`;
        
        let adminMenuHtml = '';
        if (role === '관리자') {
            adminMenuHtml = `<button class="btn-admin" onclick="location.href='/admin'" style="background:var(--danger); color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem; margin-bottom:6px; width:100%;"><i class="fas fa-shield-alt"></i> 관리자 페이지</button>`;
        }

        authFormArea.innerHTML = `
            <div class="user-info-box">
                <p class="user-greeting"><strong>${formatName(user, role)}</strong>님 환영합니다.</p>
                <p class="user-role-badge">현재 등급: <span class="role-text">${role}</span></p>
            </div>
            <div class="auth-action-buttons">
                ${adminMenuHtml}
                <button class="btn-mypage" onclick="location.href='/mypage'"><i class="fas fa-id-card"></i> 마이페이지</button>
                <button class="btn-logout" onclick="logout()"><i class="fas fa-sign-out-alt"></i> 로그아웃</button>
            </div>
        `;
    } else {
        authToggleBtn.innerHTML = `<i class="fas fa-user-circle"></i> 로그인 / 가입`;
        renderAuthForm();
    }
}

function renderAuthForm() {
    const authFormArea = document.getElementById('authFormArea');
    if (!authFormArea) return;

    if (!isSignupMode) {
        authFormArea.innerHTML = `
            <h4 class="auth-title">계정 로그인</h4>
            <input type="text" id="dropNickname" placeholder="닉네임 입력" class="input-modern">
            <input type="password" id="dropPassword" placeholder="비밀번호 입력" class="input-modern">
            <button class="btn-auth" onclick="handleLogin()">로그인</button>
            <div class="auth-links"><span onclick="switchMode(true)">계정이 없으신가요? 가입하기</span></div>
        `;
    } else {
        authFormArea.innerHTML = `
            <h4 class="auth-title">회원가입</h4>
            <input type="text" id="dropNickname" placeholder="사용할 닉네임" class="input-modern">
            <input type="password" id="dropPassword" placeholder="사용할 비밀번호" class="input-modern">
            <button class="btn-auth" onclick="handleSignup()">가입 완료하기</button>
            <div class="auth-links"><span onclick="switchMode(false)">이미 계정이 있으신가요? 로그인</span></div>
        `;
    }
}

function switchMode(signupState) {
    isSignupMode = signupState;
    renderAuthForm();
}

async function handleLogin() {
    const nickname = document.getElementById('dropNickname').value.trim();
    const password = document.getElementById('dropPassword').value.trim();

    if (!nickname || !password) return alert('닉네임과 비밀번호를 모두 입력해주세요.');

    const { data: user, error } = await db.from('users').select('*').eq('nickname', nickname).maybeSingle();
    if (error || !user) return alert('존재하지 않는 닉네임이거나 오류가 발생했습니다.');
    if (user.password !== password) return alert('비밀번호가 올바르지 않습니다.');

    localStorage.setItem('currentUser', nickname);
    localStorage.setItem('currentUserRole', user.role || '일반회원');
    
    alert('로그인 성공!');
    toggleAuthDropdown();
    checkLoginState();
    
    if (typeof fetchPosts === 'function') fetchPosts();
    if (typeof fetchMarketItems === 'function') fetchMarketItems();
}

async function handleSignup() {
    const nickname = document.getElementById('dropNickname').value.trim();
    const password = document.getElementById('dropPassword').value.trim();

    if (!nickname || !password) return alert('모든 항목을 입력해주세요.');

    const { data: existing } = await db.from('users').select('*').eq('nickname', nickname).maybeSingle();
    if (existing) return alert('이미 존재하는 닉네임입니다.');

    const { error } = await db.from('users').insert([{ nickname, password, role: '일반회원' }]);

    if (error) {
        alert('가입 실패: ' + error.message);
    } else {
        alert('가입 완료! 자동 로그인되었습니다.');
        localStorage.setItem('currentUser', nickname);
        localStorage.setItem('currentUserRole', '일반회원');
        isSignupMode = false;
        toggleAuthDropdown();
        checkLoginState();
        if (typeof fetchPosts === 'function') fetchPosts();
        if (typeof fetchMarketItems === 'function') fetchMarketItems();
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserRole');
    alert('로그아웃 되었습니다.');
    toggleAuthDropdown();
    checkLoginState();
    if (typeof fetchPosts === 'function') fetchPosts();
    if (typeof fetchMarketItems === 'function') fetchMarketItems();
}

// 💬 채널톡 고객센터 연동 스크립트 삽입
(function(){
    if(window.ChannelIO) return;
    var ch=function(){ch.c(arguments);};
    ch.q=[];ch.c=function(args){ch.q.push(args);};window.ChannelIO=ch;
    function l(){
        if(window.ChannelIOInitialized)return;
        window.ChannelIOInitialized=true;
        var s=document.createElement('script');
        s.type='text/javascript';s.async=true;
        s.src='https://cdn.channel.io/plugin/ch-plugin-web.js';
        s.charset='UTF-8';
        var n=document.getElementsByTagName('script')[0];
        n.parentNode.insertBefore(s,n);
    }
    if(document.readyState==='complete'){l();}
    else{window.addEventListener('DOMContentLoaded',l);window.addEventListener('load',l);}
})();

// 채널톡 부트 설정 (테스트용 플러그인 키 혹은 실제 키 입력)
window.addEventListener('DOMContentLoaded', () => {
    if (window.ChannelIO) {
        window.ChannelIO('boot', {
            "pluginKey": "YOUR_CHANNEL_IO_PLUGIN_KEY"
        });
    }
});

function openCustomerService() {
    if (window.ChannelIO) {
        window.ChannelIO('showMessenger');
    } else {
        alert('고객센터(채널톡) 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.');
    }
}
