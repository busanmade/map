// 메인 페이지: 그룹별 카테고리 카드 렌더링
(function () {
  const SHOW_N = 5;
  const TOP_N = 10;

  function rankClass(rank) {
    if (rank === 1) return "gold";
    if (rank === 2) return "silver";
    if (rank === 3) return "bronze";
    return "";
  }

  function escapeHTML(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderRankRow(store) {
    const cls = rankClass(store.rank);
    return `
      <div class="rank-row" onclick="location.href='detail.html?id=${encodeURIComponent(store.id)}'">
        <span class="rank-num ${cls}">${store.rank}</span>
        <div class="rank-info">
          <div class="rank-name">${escapeHTML(store.name)}</div>
          <div class="rank-addr">${escapeHTML(store.address || "")}</div>
        </div>
      </div>
    `;
  }

  // 맛집: 카테고리별 카드, 1~5위 표시 + 더보기로 6~10위 펼치기
  function renderFoodCard(category, stores) {
    const top = stores.slice(0, SHOW_N);
    const more = stores.slice(SHOW_N, TOP_N);
    const cardId = `more-${category}`;
    const empty = top.length === 0;

    return `
      <div class="category-card">
        <div class="category-card-head">
          <h3>${escapeHTML(category)}</h3>
        </div>
        <div class="rank-rows">
          ${empty
            ? `<div class="card-empty">아직 등록된 가게가 없습니다.</div>`
            : top.map(renderRankRow).join("")}
        </div>
        ${more.length > 0 ? `
          <div class="rank-rows-more hidden" id="${cardId}">
            ${more.map(renderRankRow).join("")}
          </div>
          <button class="expand-btn" onclick="toggleExpand('${cardId}', this)">더보기</button>
        ` : ""}
      </div>
    `;
  }

  // 카페/술집: 헤더 없이 순위만, 두 카드로 분리 (1~5 / 6~10)
  function renderUnifiedCards(stores) {
    const sorted = [...stores].sort((a, b) => a.rank - b.rank);
    const first = sorted.slice(0, SHOW_N);
    const second = sorted.slice(SHOW_N, TOP_N);

    const makeCard = (items) => {
      const rows = items.length === 0
        ? `<div class="card-empty">아직 등록된 가게가 없습니다.</div>`
        : items.map(renderRankRow).join("");
      return `<div class="category-card"><div class="rank-rows">${rows}</div></div>`;
    };

    return makeCard(first) + (second.length > 0 ? makeCard(second) : "");
  }

  function renderGroup(group, container) {
    const all = BM.load().filter(s => s.group === group);

    if (isUnifiedGroup(group)) {
      container.innerHTML = renderUnifiedCards(all);
      container.classList.add("two-col");
      return;
    }

    if (group === "food") {
      container.innerHTML = FOOD_CATEGORIES.map(cat => {
        const stores = all
          .filter(s => s.category === cat)
          .sort((a, b) => a.rank - b.rank);
        return renderFoodCard(cat, stores);
      }).join("");
    }
  }

  BM.init().then(() => {
    document.querySelectorAll(".category-grid").forEach(el => {
      renderGroup(el.dataset.group, el);
    });
  });

  window.toggleExpand = function (id, btn) {
    const el = document.getElementById(id);
    if (!el) return;
    const hidden = el.classList.toggle("hidden");
    btn.textContent = hidden ? "더보기" : "접기";
  };
})();
