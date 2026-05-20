#!/usr/bin/env node
/**
 * busanmade 빌드 스크립트
 * 실행: node build.js
 *
 * 1. Firebase에서 가게 데이터 가져오기
 * 2. index.html에 정적 가게 목록 삽입 (검색봇용)
 * 3. stores/{id}.html 개별 가게 페이지 생성 (검색봇 크롤링용)
 * 4. sitemap.xml 생성
 *
 * 데이터 변경 시마다 실행 후 git push 하면 됩니다.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ===== 설정 =====
const DB_URL = 'https://busanmade-81bcd-default-rtdb.asia-southeast1.firebasedatabase.app';
const SITE_URL = 'https://busanmade.github.io/map';
const FOOD_CATS = ['한식', '고기', '해산물', '중식', '일식', '양식'];
const GROUP_LABELS = { food: '맛집', cafe: '카페', bar: '술집' };

// ===== 유틸 =====
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function rankCls(r) { return r===1?'gold':r===2?'silver':r===3?'bronze':''; }

// ===== index.html용 렌더링 =====
function rankRow(store) {
  return `<div class="rank-row" onclick="location.href='stores/${store.id}.html'">` +
    `<span class="rank-num ${rankCls(store.rank)}">${store.rank}</span>` +
    `<div class="rank-info"><div class="rank-name">${esc(store.name)}</div>` +
    `<div class="rank-addr">${esc(store.address||'')}</div></div></div>`;
}

function foodCard(cat, stores) {
  const top = stores.slice(0,5), rest = stores.slice(5,10);
  const cid = `more-${cat}`;
  const rows = top.length
    ? top.map(rankRow).join('')
    : '<div class="card-empty">아직 등록된 가게가 없습니다.</div>';
  return `<div class="category-card">` +
    `<div class="category-card-head"><h3>${esc(cat)}</h3></div>` +
    `<div class="rank-rows">${rows}</div>` +
    (rest.length
      ? `<div class="rank-rows-more hidden" id="${cid}">${rest.map(rankRow).join('')}</div>` +
        `<button class="expand-btn" onclick="toggleExpand('${cid}',this)">더보기</button>`
      : '') +
    `</div>`;
}

function unifiedCards(stores) {
  const sorted = [...stores].sort((a,b)=>a.rank-b.rank);
  const card = items => `<div class="category-card"><div class="rank-rows">` +
    (items.length ? items.map(rankRow).join('') : '<div class="card-empty">아직 등록된 가게가 없습니다.</div>') +
    `</div></div>`;
  return card(sorted.slice(0,5)) + (sorted.length>5 ? card(sorted.slice(5,10)) : '');
}

// ===== stores/{id}.html 생성 =====
function hoursText(hours) {
  if (!hours || typeof hours === 'string') return esc(hours||'-');
  const KO = {mon:'월',tue:'화',wed:'수',thu:'목',fri:'금',sat:'토',sun:'일'};
  return ['mon','tue','wed','thu','fri','sat','sun'].map(d => {
    const h = hours[d]; if (!h) return '';
    if (h.closed) return `${KO[d]} 휴무`;
    if (h.allDay) return `${KO[d]} 24시간`;
    const t = (h.open && h.close) ? `${h.open}~${h.close}` : '';
    return `${KO[d]} ${t}`.trim();
  }).filter(Boolean).join(' / ');
}

function storePageHTML(store) {
  const district = (store.address||'').match(/([가-힣]+구)/)?.[1]||'';
  const rankStr = 'NO.'+String(store.rank).padStart(2,'0');
  const menuTags = (store.menu||'').split(',').map(m=>m.trim()).filter(Boolean)
    .map(m=>`<span class="sc-tag">${esc(m)}</span>`).join('');
  const mapUrl = (store.naver||'').trim() ||
    `https://map.naver.com/v5/search/${encodeURIComponent(store.address||store.name)}`;
  const btns = [`<a class="action-btn primary" href="${esc(mapUrl)}" target="_blank" rel="noopener">네이버플레이스</a>`];
  if (store.instagram) btns.push(`<a class="action-btn insta" href="${esc(store.instagram)}" target="_blank" rel="noopener">인스타그램</a>`);

  const metaDesc = `부산 ${GROUP_LABELS[store.group]||''} ${store.category||''} ${store.rank}위. ${store.address||''}${store.review ? '. ' + store.review : ''}`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${esc(store.name)} — busanmade 부산 ${esc(GROUP_LABELS[store.group]||'')} ${store.rank}위</title>
  <meta name="description" content="${esc(metaDesc)}"/>
  <meta property="og:title" content="${esc(store.name)} — busanmade"/>
  <meta property="og:description" content="${esc(store.review||store.desc||store.address||'')}"/>
  <meta property="og:type" content="website"/>
  <meta property="og:url" content="${SITE_URL}/stores/${store.id}.html"/>
  <link rel="canonical" href="${SITE_URL}/stores/${store.id}.html"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+KR:wght@400;500;600;700;800&family=Noto+Serif+KR:wght@400;500&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="../css/style.css"/>
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <a href="../index.html" class="logo">busan<span>made</span></a>
      <nav class="main-nav">
        <a href="../index.html">홈</a>
        <a href="../admin.html" class="admin-link">관리자</a>
      </nav>
    </div>
  </header>

  <main class="container detail-page" id="detail-root">
    <a href="../index.html" class="back-link">← 목록으로</a>
    <div id="detail-content">
      <div class="detail-hero">
        <div class="detail-left">
          <div class="store-card">
            <div class="store-card-red">
              <div class="sc-top">
                <div class="sc-top-info">
                  ${district?`<span class="sc-district">${esc(district)}</span>`:''}
                  <span class="sc-rank-cat">${esc(rankStr)} · ${esc(store.category||GROUP_LABELS[store.group]||'')}</span>
                </div>
                <span class="sc-pick">BUSANMADE PICK</span>
              </div>
              <div class="sc-name">${esc(store.name)}</div>
              ${menuTags?`<div class="sc-tags">${menuTags}</div>`:''}
            </div>
          </div>
          ${store.review?`<div class="review-card"><div class="review-label">busanmade의 한줄평</div><div class="review-divider"></div><div class="review-text">${esc(store.review).replace(/\n/g,'<br>')}</div></div>`:''}
        </div>
        <div class="detail-info">
          <span class="detail-rank-badge">${esc(GROUP_LABELS[store.group]||'')} · ${esc(store.category||'')} ${store.rank}위</span>
          <h1>${esc(store.name)}</h1>
          <div class="category-tag">${esc(store.category||'')}</div>
          <ul class="info-list">
            <li><span class="info-label">주소</span><span class="info-value">${esc(store.address||'-')}</span></li>
            <li><span class="info-label">전화</span><span class="info-value">${store.phone?`<a href="tel:${esc(store.phone.replace(/[^0-9+]/g,''))}">${esc(store.phone)}</a>`:'-'}</span></li>
            <li><span class="info-label">영업시간</span><span class="info-value">${hoursText(store.hours)}</span></li>
            <li><span class="info-label">주차</span><span class="info-value">${esc(store.parking||'-')}</span></li>
            <li><span class="info-label">가격대</span><span class="info-value">${esc(store.price||'-')}</span></li>
          </ul>
          <div class="action-buttons">${btns.join('')}</div>
        </div>
      </div>
      ${store.desc?`<div class="detail-desc">${esc(store.desc)}</div>`:''}
      <section class="user-reviews-section">
        <h2 class="user-reviews-title">방문 후기</h2>
        <div id="reviews-list" class="reviews-list"><div class="reviews-loading">불러오는 중...</div></div>
        <form id="review-write-form" class="review-write-form">
          <div class="review-write-top">
            <input type="text" id="review-nickname" placeholder="닉네임 (최대 20자)" maxlength="20" autocomplete="off"/>
          </div>
          <textarea id="review-body" placeholder="후기를 남겨주세요. (최대 300자)" rows="3" maxlength="300"></textarea>
          <div class="review-write-bottom">
            <span id="review-char-count" class="review-char-count">0 / 300</span>
            <button type="submit" class="btn primary">후기 남기기</button>
          </div>
        </form>
      </section>
    </div>
  </main>

  <footer class="site-footer">
    <div class="container"><p>© 2026 busanmade.</p></div>
  </footer>

  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>
  <script>window.__STATIC_STORE_ID__ = '${store.id}';</script>
  <script src="../js/data.js"></script>
  <script src="../js/detail.js"></script>
</body>
</html>`;
}

// ===== sitemap.xml =====
function sitemapXML(stores) {
  const now = new Date().toISOString().split('T')[0];
  const urls = [
    `  <url><loc>${SITE_URL}/</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    ...stores.map(s =>
      `  <url><loc>${SITE_URL}/stores/${s.id}.html</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`)
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}

// ===== 메인 =====
async function main() {
  console.log('Firebase에서 데이터 가져오는 중...');
  const val = await fetchJSON(`${DB_URL}/stores.json`);
  if (!val) { console.error('데이터가 없습니다. Firebase를 확인해주세요.'); process.exit(1); }

  const stores = Object.values(val);
  console.log(`${stores.length}개 가게 데이터 로드 완료`);

  // 1. index.html 정적 콘텐츠 삽입
  const indexPath = path.join(__dirname, 'index.html');
  let indexHTML = fs.readFileSync(indexPath, 'utf8');

  const food = stores.filter(s=>s.group==='food');
  const cafe = stores.filter(s=>s.group==='cafe');
  const bar  = stores.filter(s=>s.group==='bar');

  const foodHTML = FOOD_CATS.map(cat =>
    foodCard(cat, food.filter(s=>s.category===cat).sort((a,b)=>a.rank-b.rank))
  ).join('');
  const cafeHTML = unifiedCards(cafe);
  const barHTML  = unifiedCards(bar);

  function inject(html, group, content) {
    return html.replace(
      new RegExp(`(<!-- STATIC:${group} -->)[\\s\\S]*?(<!-- \\/STATIC:${group} -->)`),
      `$1${content}$2`
    );
  }

  indexHTML = inject(indexHTML, 'food', foodHTML);
  indexHTML = inject(indexHTML, 'cafe', cafeHTML);
  indexHTML = inject(indexHTML, 'bar',  barHTML);
  fs.writeFileSync(indexPath, indexHTML, 'utf8');
  console.log('index.html 업데이트 완료');

  // 2. stores/ 디렉토리에 개별 가게 페이지 생성
  const storesDir = path.join(__dirname, 'stores');
  if (!fs.existsSync(storesDir)) fs.mkdirSync(storesDir);

  for (const store of stores) {
    fs.writeFileSync(path.join(storesDir, `${store.id}.html`), storePageHTML(store), 'utf8');
  }
  console.log(`${stores.length}개 가게 페이지 생성 완료 → stores/`);

  // 3. sitemap.xml 생성
  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemapXML(stores), 'utf8');
  console.log('sitemap.xml 생성 완료');

  console.log('\n빌드 완료! 아래 명령으로 배포하세요:');
  console.log('  git add . && git commit -m "빌드 업데이트" && git push');
}

main().catch(err => {
  console.error('빌드 실패:', err.message);
  process.exit(1);
});
