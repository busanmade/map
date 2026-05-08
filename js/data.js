// ===== Firebase 설정 =====
// Firebase 콘솔(console.firebase.google.com) → 프로젝트 설정 → 내 앱 → firebaseConfig 복사
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAyF8xRBieCqNB7RoJjiHK0SpEKZg7HMP4",
  authDomain: "busanmade-81bcd.firebaseapp.com",
  databaseURL: "https://busanmade-81bcd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "busanmade-81bcd",
  storageBucket: "busanmade-81bcd.firebasestorage.app",
  messagingSenderId: "312047022134",
  appId: "1:312047022134:web:04299feaecc90fb9322897"
};
// ================================

const BM_ADMIN_PASSWORD = "busan2026";

const GROUP_LABELS = {
  food: "맛집",
  cafe: "카페",
  bar: "술집",
};

const FOOD_CATEGORIES = ["한식", "고기", "해산물", "중식", "일식", "양식"];
const UNIFIED_CATEGORY = "전체";
const UNIFIED_GROUPS = ["cafe", "bar"];

function isUnifiedGroup(group) {
  return UNIFIED_GROUPS.includes(group);
}

const SAMPLE_STORES = [
  { id: "f-han-1", group: "food", category: "한식", rank: 1,
    name: "해운대 돼지국밥", address: "부산 해운대구 구남로 12",
    phone: "051-000-0001", hours: "10:00 - 22:00",
    parking: "건물 옆 무료주차 5대", price: "1만원대",
    image: "", instagram: "", naver: "",
    menu: "돼지국밥, 수육, 순대",
    desc: "해운대 현지인 줄서는 노포 돼지국밥집." },
  { id: "f-han-2", group: "food", category: "한식", rank: 2,
    name: "초량 밀면", address: "부산 동구 초량로 77",
    phone: "051-000-0011", hours: "11:00 - 21:00",
    parking: "골목 공영주차장", price: "8천원대",
    image: "", instagram: "", naver: "",
    menu: "물밀면, 비빔밀면, 만두",
    desc: "60년 전통의 부산식 밀면 노포." },
  { id: "f-meat-1", group: "food", category: "고기", rank: 1,
    name: "범일동 솥뚜껑 삼겹살", address: "부산 동구 범일로 88",
    phone: "051-000-0002", hours: "16:00 - 24:00",
    parking: "주변 공영주차장", price: "2만원대",
    image: "", instagram: "", naver: "",
    menu: "솥뚜껑 삼겹살, 항정살, 된장찌개",
    desc: "두툼한 삼겹살과 직접 만든 쌈장이 인기." },
  { id: "f-sea-1", group: "food", category: "해산물", rank: 1,
    name: "자갈치 활어회", address: "부산 중구 자갈치해안로 52",
    phone: "051-000-0003", hours: "09:00 - 23:00",
    parking: "자갈치 공영주차장", price: "3만원대~",
    image: "", instagram: "", naver: "",
    menu: "광어회, 우럭회, 매운탕",
    desc: "당일 입항 활어를 즉석에서 떠주는 전통 횟집." },
  { id: "f-jp-1", group: "food", category: "일식", rank: 1,
    name: "광안 스시 카이", address: "부산 수영구 광남로 60",
    phone: "051-000-0021", hours: "12:00 - 22:00",
    parking: "발렛", price: "5만원대",
    image: "", instagram: "", naver: "",
    menu: "오마카세, 사시미, 우니덮밥",
    desc: "광안리 오마카세 입문용으로 좋은 곳." },
  { id: "c-1", group: "cafe", category: UNIFIED_CATEGORY, rank: 1,
    name: "송정 오션뷰", address: "부산 해운대구 송정해변로 30",
    phone: "051-000-0005", hours: "10:00 - 22:00",
    parking: "전용 주차장 20대", price: "8천원대",
    image: "", instagram: "", naver: "",
    menu: "아메리카노, 시그니처 라떼, 스콘",
    desc: "송정 바다가 한눈에 보이는 통창 카페." },
  { id: "c-2", group: "cafe", category: UNIFIED_CATEGORY, rank: 2,
    name: "전포 베이커리", address: "부산 부산진구 전포대로 200",
    phone: "051-000-0004", hours: "11:00 - 21:00",
    parking: "발렛 주차", price: "1만원 이하",
    image: "", instagram: "", naver: "",
    menu: "크로플, 바스크치즈케이크, 라떼",
    desc: "전포 카페거리 대표 디저트 카페." },
  { id: "b-1", group: "bar", category: UNIFIED_CATEGORY, rank: 1,
    name: "광안 이자카야 야미", address: "부산 수영구 광안해변로 100",
    phone: "051-000-0006", hours: "18:00 - 02:00",
    parking: "유료 주차장", price: "3만원대",
    image: "", instagram: "", naver: "",
    menu: "사케, 닭꼬치, 모츠나베",
    desc: "광안리 야경을 보며 즐기는 일본식 선술집." },
];

firebase.initializeApp(FIREBASE_CONFIG);
const _db = firebase.database();
const _STORES_REF = _db.ref("stores");

const BM = {
  _cache: null,

  init() {
    return _STORES_REF.once("value").then(snapshot => {
      const val = snapshot.val();
      if (!val) {
        BM._cache = [...SAMPLE_STORES];
        BM._push();
      } else {
        BM._cache = Object.values(val);
      }
    });
  },

  _push() {
    const obj = {};
    (BM._cache || []).forEach(s => { obj[s.id] = s; });
    return _STORES_REF.set(obj).catch(err => {
      console.error("Firebase 저장 실패:", err);
      alert("저장에 실패했습니다. 인터넷 연결이나 Firebase 권한을 확인해주세요.\n\n오류: " + err.message);
    });
  },

  load() {
    return BM._cache ? [...BM._cache] : [];
  },

  save(stores) {
    BM._cache = [...stores];
    BM._push();
  },

  add(store) {
    const stores = BM.load();
    store.id = "s" + Date.now();
    stores.push(store);
    BM.save(stores);
    return store;
  },

  update(id, patch) {
    const stores = BM.load();
    const idx = stores.findIndex(s => s.id === id);
    if (idx === -1) return null;
    stores[idx] = { ...stores[idx], ...patch, id };
    BM.save(stores);
    return stores[idx];
  },

  remove(id) {
    const stores = BM.load().filter(s => s.id !== id);
    BM.save(stores);
  },

  findById(id) {
    return BM.load().find(s => s.id === id) || null;
  },

  byGroupAndCategory(group) {
    const result = {};
    BM.load()
      .filter(s => s.group === group)
      .forEach(s => {
        if (!result[s.category]) result[s.category] = [];
        result[s.category].push(s);
      });
    Object.keys(result).forEach(cat => {
      result[cat].sort((a, b) => a.rank - b.rank);
    });
    return result;
  },

  reset() {
    BM._cache = [];
    _STORES_REF.remove();
  },
};
