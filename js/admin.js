// 관리자 페이지
(function () {
  const SESSION_KEY = "busanmade_admin_session";
  const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  function $(id) { return document.getElementById(id); }

  function escapeHTML(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  }

  function showAdmin() {
    $("login-section").classList.add("hidden");
    $("admin-section").classList.remove("hidden");
    refreshTable();
  }

  function showLogin() {
    $("admin-section").classList.add("hidden");
    $("login-section").classList.remove("hidden");
  }

  // ===== 로그인 =====
  $("login-btn").addEventListener("click", () => {
    const pw = $("admin-password").value;
    if (pw === BM_ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      $("login-error").textContent = "";
      showAdmin();
    } else {
      $("login-error").textContent = "비밀번호가 올바르지 않습니다.";
    }
  });
  $("admin-password").addEventListener("keydown", e => {
    if (e.key === "Enter") $("login-btn").click();
  });

  $("logout-btn").addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    $("admin-password").value = "";
    showLogin();
  });

  // ===== 영업시간 =====
  function readHours() {
    const result = {};
    DAYS.forEach(d => {
      result[d] = {
        open:       ($(`h-${d}-open`)   || {}).value || "",
        close:      ($(`h-${d}-close`)  || {}).value || "",
        breakStart: ($(`h-${d}-bstart`) || {}).value || "",
        breakEnd:   ($(`h-${d}-bend`)   || {}).value || "",
        lastOrder:  ($(`h-${d}-lo`)     || {}).value || "",
        closed:     !!($(`h-${d}-closed`) || {}).checked,
        allDay:     !!($(`h-${d}-allday`) || {}).checked,
      };
    });
    return result;
  }

  function fillHours(hours) {
    DAYS.forEach(d => {
      const data = (hours && typeof hours === "object" && hours[d]) ? hours[d] : {};
      const set = (id, val) => { const el = $(id); if (el) el.value = val || ""; };
      set(`h-${d}-open`,   data.open       || "");
      set(`h-${d}-close`,  data.close      || "");
      set(`h-${d}-bstart`, data.breakStart || "");
      set(`h-${d}-bend`,   data.breakEnd   || "");
      set(`h-${d}-lo`,     data.lastOrder  || "");
      const chk = $(`h-${d}-closed`);
      if (chk) chk.checked = !!data.closed;
      const adc = $(`h-${d}-allday`);
      if (adc) adc.checked = !!data.allDay;
      syncClosedRow(d);
      syncAlldayRow(d);
    });
  }

  function syncAlldayRow(d) {
    const adc = $(`h-${d}-allday`);
    const row = $(`hrow-${d}`);
    if (!adc || !row) return;
    row.classList.toggle("is-allday", adc.checked);
    if (adc.checked) {
      const closedChk = $(`h-${d}-closed`);
      if (closedChk) { closedChk.checked = false; syncClosedRow(d); }
    }
  }

  function syncClosedRow(d) {
    const chk = $(`h-${d}-closed`);
    const row = $(`hrow-${d}`);
    if (!chk || !row) return;
    row.classList.toggle("is-closed", chk.checked);
  }

  DAYS.forEach(d => {
    const chk = $(`h-${d}-closed`);
    if (chk) chk.addEventListener("change", () => {
      syncClosedRow(d);
      if (chk.checked) {
        const adc = $(`h-${d}-allday`);
        if (adc) { adc.checked = false; syncAlldayRow(d); }
      }
    });

    const adc = $(`h-${d}-allday`);
    if (adc) adc.addEventListener("change", () => syncAlldayRow(d));
  });

  // ===== 영업시간 일괄 적용 =====
  const HOUR_FIELDS = ["open", "close", "bstart", "bend", "lo"];

  DAYS.forEach(d => {
    HOUR_FIELDS.forEach(f => {
      const el = $(`h-${d}-${f}`);
      if (!el) return;
      el.addEventListener("change", () => {
        if (!$("hours-sync-all").checked) return;
        DAYS.forEach(od => {
          if (od === d) return;
          const other = $(`h-${od}-${f}`);
          if (other) other.value = el.value;
        });
      });
    });

    const chk = $(`h-${d}-closed`);
    if (chk) {
      chk.addEventListener("change", () => {
        if (!$("hours-sync-all").checked) return;
        DAYS.forEach(od => {
          if (od === d) return;
          const other = $(`h-${od}-closed`);
          if (other) { other.checked = chk.checked; syncClosedRow(od); }
        });
      });
    }

    const adc = $(`h-${d}-allday`);
    if (adc) {
      adc.addEventListener("change", () => {
        if (!$("hours-sync-all").checked) return;
        DAYS.forEach(od => {
          if (od === d) return;
          const other = $(`h-${od}-allday`);
          if (other) { other.checked = adc.checked; syncAlldayRow(od); }
        });
      });
    }
  });

  // ===== 폼 =====
  function readForm() {
    const group = $("store-group").value;
    const category = isUnifiedGroup(group)
      ? UNIFIED_CATEGORY
      : ($("store-category").value || "").trim();
    return {
      id: $("store-id").value || null,
      group,
      category,
      rank: parseInt($("store-rank").value, 10) || 99,
      name: $("store-name").value.trim(),
      address: $("store-address").value.trim(),
      phone: $("store-phone").value.trim(),
      hours: readHours(),
      parking: $("store-parking").value.trim(),
      price: $("store-price").value.trim(),
      image: $("store-image").value.trim(),
      instagram: $("store-instagram").value.trim(),
      naver: $("store-naver").value.trim(),
      menu: $("store-menu").value.trim(),
      comment: $("store-comment").value.trim(),
      review: $("store-review").value.trim(),
      desc: $("store-desc").value.trim(),
    };
  }

  function fillForm(s) {
    $("store-id").value = s.id || "";
    $("store-group").value = s.group || "food";
    const cat = s.category || FOOD_CATEGORIES[0];
    $("store-category").value = FOOD_CATEGORIES.includes(cat) ? cat : FOOD_CATEGORIES[0];
    $("store-rank").value = s.rank || "";
    $("store-name").value = s.name || "";
    $("store-address").value = s.address || "";
    $("store-phone").value = s.phone || "";
    fillHours(typeof s.hours === "object" ? s.hours : null);
    $("store-parking").value = s.parking || "";
    $("store-price").value = s.price || "";
    $("store-image").value = s.image || "";
    $("store-instagram").value = s.instagram || "";
    $("store-naver").value = s.naver || "";
    $("store-menu").value = s.menu || "";
    $("store-comment").value = s.comment || "";
    $("store-review").value = s.review || "";
    $("store-desc").value = s.desc || "";
    syncCategoryField();
  }

  function clearForm() {
    fillForm({});
  }

  function syncCategoryField() {
    const group = $("store-group").value;
    $("category-field").classList.toggle("hidden", isUnifiedGroup(group));
  }
  $("store-group").addEventListener("change", syncCategoryField);
  syncCategoryField();

  $("store-form").addEventListener("submit", e => {
    e.preventDefault();
    const data = readForm();
    if (!data.name) {
      alert("이름은 필수입니다.");
      return;
    }
    if (!isUnifiedGroup(data.group) && !FOOD_CATEGORIES.includes(data.category)) {
      alert("맛집은 카테고리를 선택해주세요.");
      return;
    }
    if (data.id) {
      BM.update(data.id, data);
    } else {
      delete data.id;
      BM.add(data);
    }
    clearForm();
    refreshTable();
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  });

  $("reset-btn").addEventListener("click", clearForm);

  // ===== 테이블 =====
  function refreshTable() {
    const filterGroup = $("filter-group").value;
    const filterText = $("filter-text").value.trim().toLowerCase();

    let stores = BM.load();
    if (filterGroup) stores = stores.filter(s => s.group === filterGroup);
    if (filterText) {
      stores = stores.filter(s =>
        (s.name || "").toLowerCase().includes(filterText) ||
        (s.category || "").toLowerCase().includes(filterText)
      );
    }
    stores.sort((a, b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      if (a.category !== b.category) return a.category.localeCompare(b.category, "ko");
      return a.rank - b.rank;
    });

    $("store-count").textContent = stores.length;
    const tbody = $("admin-table-body");

    if (stores.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px;">등록된 가게가 없습니다.</td></tr>`;
      return;
    }

    tbody.innerHTML = stores.map(s => `
      <tr>
        <td>${GROUP_LABELS[s.group] || s.group}</td>
        <td>${escapeHTML(s.category)}</td>
        <td>${s.rank}</td>
        <td>${escapeHTML(s.name)}</td>
        <td>${escapeHTML(s.address || "")}</td>
        <td class="row-actions">
          <button class="btn" data-act="edit" data-id="${s.id}">수정</button>
          <button class="btn" data-act="view" data-id="${s.id}">보기</button>
          <button class="btn danger" data-act="delete" data-id="${s.id}">삭제</button>
        </td>
      </tr>
    `).join("");
  }

  $("admin-table-body").addEventListener("click", e => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === "edit") {
      const s = BM.findById(id);
      if (s) { fillForm(s); window.scrollTo({ top: 0, behavior: "smooth" }); }
    } else if (act === "view") {
      window.open(`detail.html?id=${encodeURIComponent(id)}`, "_blank");
    } else if (act === "delete") {
      const s = BM.findById(id);
      if (s && confirm(`"${s.name}" 가게를 삭제할까요?`)) {
        BM.remove(id);
        refreshTable();
      }
    }
  });

  $("filter-group").addEventListener("change", refreshTable);
  $("filter-text").addEventListener("input", refreshTable);

  // ===== 데이터 내보내기 / 가져오기 =====
  $("export-btn").addEventListener("click", () => {
    const data = JSON.stringify(BM.load(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `busanmade-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  $("import-btn").addEventListener("click", () => $("import-file").click());
  $("import-file").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(reader.result);
        if (!Array.isArray(arr)) throw new Error("형식 오류");
        if (!confirm(`${arr.length}건의 데이터를 불러옵니다. 기존 데이터를 덮어쓸까요?`)) return;
        BM.save(arr);
        refreshTable();
        alert("데이터를 가져왔습니다.");
      } catch {
        alert("올바른 JSON 파일이 아닙니다.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  // ===== 초기화 =====
  BM.init().then(() => {
    if (isLoggedIn()) showAdmin();
    else showLogin();
  });
})();
