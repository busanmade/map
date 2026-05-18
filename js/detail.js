// 상세 페이지
(function () {
  const DAYS_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const DAY_KO = { mon: "월", tue: "화", wed: "수", thu: "목", fri: "금", sat: "토", sun: "일" };
  const TODAY_KEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];

  function escapeHTML(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDayHours(d) {
    if (!d) return "-";
    if (d.closed) return "휴무";
    if (d.allDay) return "24시간 영업";
    const parts = [];
    if (d.open || d.close) parts.push(`${d.open || "??"} - ${d.close || "??"}`);
    if (d.breakStart || d.breakEnd) parts.push(`브레이크 ${d.breakStart || "??"}-${d.breakEnd || "??"}`);
    if (d.lastOrder) parts.push(`라스트오더 ${d.lastOrder}`);
    return parts.join(" / ") || "-";
  }

  function renderHoursBlock(hours) {
    // 레거시 문자열 처리
    if (!hours || typeof hours === "string") {
      return `<span class="info-value">${escapeHTML(hours || "-")}</span>`;
    }

    const todayData = hours[TODAY_KEY];
    const todayStr = todayData ? formatDayHours(todayData) : "-";
    const isClosed = todayData && todayData.closed;

    const weekRows = DAYS_ORDER.map(d => {
      const isToday = d === TODAY_KEY;
      const dayStr = formatDayHours(hours[d]);
      return `
        <div class="hours-week-row${isToday ? " is-today" : ""}">
          <span class="hours-week-day">${DAY_KO[d]}</span>
          <span class="hours-week-val">${escapeHTML(dayStr)}</span>
        </div>`;
    }).join("");

    return `
      <div class="info-value">
        <div class="info-hours-wrap">
          <span class="hours-today${isClosed ? " is-closed" : ""}">${DAY_KO[TODAY_KEY]} ${escapeHTML(todayStr)}</span>
          <button class="hours-toggle-btn" onclick="toggleHoursDetail(this)">영업시간 더보기</button>
          <div class="hours-week hidden">${weekRows}</div>
        </div>
      </div>`;
  }

  function extractDistrict(address) {
    if (!address) return "";
    const m = address.match(/([가-힣]+구)/);
    return m ? m[1] : "";
  }

  const root = document.getElementById("detail-content");
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  BM.init().then(() => {
  const store = id ? BM.findById(id) : null;

  if (!store) {
    root.innerHTML = `<div class="empty-state">가게 정보를 찾을 수 없습니다.</div>`;
    return;
  }

  document.title = `${store.name} — busanmade`;

  const district = extractDistrict(store.address);
  const rankStr = "NO." + String(store.rank).padStart(2, "0");
  const catLabel = escapeHTML(store.category || GROUP_LABELS[store.group] || "");

  const menuTags = (store.menu || "")
    .split(",")
    .map(m => m.trim())
    .filter(Boolean)
    .map(m => `<span class="sc-tag">${escapeHTML(m)}</span>`)
    .join("");

  const cardBlock = `
    <div class="store-card">
      <div class="store-card-red">
        <div class="sc-top">
          <span class="sc-district">${district ? escapeHTML(district) : ""}</span>
          <span class="sc-rank-cat">${escapeHTML(rankStr)} · ${catLabel}</span>
        </div>
        <div class="sc-name">${escapeHTML(store.name)}</div>
        <span class="sc-pick">BUSANMADE PICK</span>
      </div>
      <div class="store-card-white">
        ${menuTags ? `<div class="sc-tags">${menuTags}</div>` : ""}
        ${store.comment ? `<div class="sc-comment">${escapeHTML(store.comment)}</div>` : ""}
      </div>
    </div>
  `;

  const reviewCard = store.review ? `
    <div class="review-card">
      <div class="review-label">busanmade의 한줄평</div>
      <div class="review-text">${escapeHTML(store.review)}</div>
    </div>
  ` : "";

  const mapUrl = store.naver && store.naver.trim()
    ? store.naver.trim()
    : `https://map.naver.com/v5/search/${encodeURIComponent(store.address || store.name)}`;

  const buttons = [];
  buttons.push(`<a class="action-btn primary" href="${escapeHTML(mapUrl)}" target="_blank" rel="noopener">네이버플레이스</a>`);
  if (store.instagram) {
    buttons.push(`<a class="action-btn insta" href="${escapeHTML(store.instagram)}" target="_blank" rel="noopener">인스타그램</a>`);
  }

  root.innerHTML = `
    <div class="detail-hero">
      <div class="detail-left">
        ${cardBlock}
        ${reviewCard}
      </div>
      <div class="detail-info">
        <span class="detail-rank-badge">${GROUP_LABELS[store.group] || ""} · ${escapeHTML(store.category)} ${store.rank}위</span>
        <h1>${escapeHTML(store.name)}</h1>
        <div class="category-tag">${escapeHTML(store.category)}</div>

        <ul class="info-list">
          <li><span class="info-label">주소</span><span class="info-value">${escapeHTML(store.address || "-")}</span></li>
          <li><span class="info-label">전화</span><span class="info-value">${store.phone ? `<a href="tel:${escapeHTML(store.phone.replace(/[^0-9+]/g, ""))}">${escapeHTML(store.phone)}</a>` : "-"}</span></li>
          <li><span class="info-label">영업시간</span>${renderHoursBlock(store.hours)}</li>
          <li><span class="info-label">주차</span><span class="info-value">${escapeHTML(store.parking || "-")}</span></li>
          <li><span class="info-label">가격대</span><span class="info-value">${escapeHTML(store.price || "-")}</span></li>
        </ul>

        <div class="action-buttons">${buttons.join("")}</div>
      </div>
    </div>
    ${store.desc ? `<div class="detail-desc">${escapeHTML(store.desc)}</div>` : ""}

  `;

  window.toggleHoursDetail = function (btn) {
    const week = btn.nextElementSibling;
    if (!week) return;
    const hidden = week.classList.toggle("hidden");
    btn.textContent = hidden ? "영업시간 더보기" : "영업시간 접기";
  };
  }); // BM.init().then
})();
