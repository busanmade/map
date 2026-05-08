// 카테고리 페이지: TOP 20 렌더링 (맛집은 카테고리별, 카페/술집은 통합)
(function () {
  const TOP_N = 20;

  function escapeHTML(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function rankClass(rank) {
    if (rank === 1) return "gold";
    if (rank === 2) return "silver";
    if (rank === 3) return "bronze";
    return "";
  }

  function getQuery() {
    const params = new URLSearchParams(location.search);
    return {
      group: params.get("group") || "",
      category: params.get("category") || "",
    };
  }

  const { group, category } = getQuery();
  const titleEl = document.getElementById("category-title");
  const subEl = document.getElementById("category-sub");
  const listEl = document.getElementById("rank-list");

  if (!group || !GROUP_LABELS[group]) {
    titleEl.textContent = "카테고리를 찾을 수 없습니다";
    subEl.textContent = "";
    listEl.innerHTML = `<li class="empty-state" style="border:none;">홈으로 돌아가 다시 선택해주세요.</li>`;
    return;
  }

  const unified = isUnifiedGroup(group);
  const headingTitle = unified
    ? GROUP_LABELS[group]
    : `${GROUP_LABELS[group]} · ${category}`;

  document.title = `${headingTitle} — busanmade`;
  titleEl.textContent = headingTitle;

  BM.init().then(() => {
    let stores = BM.load().filter(s => s.group === group);
    if (!unified) {
      if (!category) {
        titleEl.textContent = "카테고리를 찾을 수 없습니다";
        listEl.innerHTML = `<li class="empty-state" style="border:none;">홈으로 돌아가 다시 선택해주세요.</li>`;
        return;
      }
      stores = stores.filter(s => s.category === category);
    }
    stores.sort((a, b) => a.rank - b.rank);
    stores = stores.slice(0, TOP_N);

    subEl.textContent = `TOP ${Math.min(TOP_N, stores.length)} (총 ${stores.length}곳)`;

    if (stores.length === 0) {
      listEl.innerHTML = `<li class="empty-state" style="border:none;">아직 등록된 가게가 없습니다.</li>`;
      return;
    }

    listEl.innerHTML = stores.map(s => `
      <li class="rank-row" onclick="location.href='detail.html?id=${encodeURIComponent(s.id)}'">
        <span class="rank-num ${rankClass(s.rank)}">${s.rank}</span>
        <div class="rank-info">
          <div class="rank-name">${escapeHTML(s.name)}</div>
          <div class="rank-addr">${escapeHTML(s.address || "")}</div>
        </div>
      </li>
    `).join("");
  });
})();
