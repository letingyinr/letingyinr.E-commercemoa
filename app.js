/* ========================================
   食堂APP - 共享 JavaScript
   ======================================== */

// ============ Toast ============
function showToast(message, type = 'default', duration = 2000) {
  const id = 'global-toast-' + Date.now();
  const toastEl = document.createElement('div');
  toastEl.id = id;
  toastEl.className = `toast${type === 'success' ? ' toast-success' : type === 'error' ? ' toast-error' : type === 'warning' ? ' toast-warning' : ''}`;
  toastEl.textContent = message;
  document.body.appendChild(toastEl);
  requestAnimationFrame(() => {
    toastEl.classList.add('show');
  });
  setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.remove(), 300);
  }, duration);
}

// ============ Threshold / Promo Config ============
const PROMO_CONFIG = {
  // 满20减5 活动
  fullReduction: { threshold: 20, discount: 5 },
  // 满30免配送费 门槛
  freeDelivery: { threshold: 30 }
};

// ============ Modal ============
function showModal(selector) {
  const modal = document.querySelector(selector);
  if (!modal) return;
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function hideModal(selector) {
  const modal = document.querySelector(selector);
  if (!modal) return;
  modal.classList.remove('show');
  document.body.style.overflow = '';
}

// ============ Tabs ============
function initTabs(tabBarSelector, panelSelector, activeClass = 'active', onChange) {
  const tabBar = document.querySelector(tabBarSelector);
  const panels = document.querySelectorAll(panelSelector);
  if (!tabBar || !panels.length) return;

  tabBar.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (!tab) return;
    const tabId = tab.dataset.tab;

    tabBar.querySelectorAll('[data-tab]').forEach(t => t.classList.remove(activeClass));
    tab.classList.add(activeClass);

    panels.forEach(p => {
      p.style.display = p.dataset.tab === tabId ? '' : 'none';
    });

    if (onChange) onChange(tabId);
  });
}

// ============ Banner Carousel ============
function initBannerCarousel(selector, autoPlay = true, interval = 3500) {
  const wrapper = document.querySelector(selector);
  if (!wrapper) return;
  const slides = wrapper.querySelector('.slides');
  const dots = wrapper.querySelectorAll('.dot');
  const total = dots.length;
  let current = 0;
  let timer = null;

  function goTo(index) {
    current = (index + total) % total;
    slides.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function start() {
    if (autoPlay && total > 1) {
      timer = setInterval(() => goTo(current + 1), interval);
    }
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      clearInterval(timer);
      goTo(i);
      start();
    });
  });

  let startX = 0, moved = false;
  slides.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    moved = false;
  });
  slides.addEventListener('touchmove', e => {
    const diff = e.touches[0].clientX - startX;
    if (Math.abs(diff) > 5) moved = true;
  });
  slides.addEventListener('touchend', e => {
    if (!moved) return;
    const diff = e.changedTouches[0].clientX - startX;
    clearInterval(timer);
    if (diff < -30) goTo(current + 1);
    else if (diff > 30) goTo(current - 1);
    start();
  });

  start();
  return { goTo };
}

// ============ Pull to Refresh ============
function initPullToRefresh(containerSelector, onRefresh) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  let startY = 0, curY = 0, pulling = false;
  const indicator = document.createElement('div');
  indicator.style.cssText = 'text-align:center;padding:12px;font-size:12px;color:#999;transition:all 0.3s;display:none;';
  indicator.innerHTML = '<i class="fa fa-arrow-up"></i> 下拉刷新';
  container.parentElement.insertBefore(indicator, container);

  container.addEventListener('touchstart', e => {
    if (container.scrollTop === 0) {
      startY = e.touches[0].clientY;
      pulling = true;
    }
  });

  container.addEventListener('touchmove', e => {
    if (!pulling || container.scrollTop > 0) return;
    curY = e.touches[0].clientY;
    const diff = curY - startY;
    if (diff > 0) {
      e.preventDefault();
      indicator.style.display = 'block';
      if (diff < 60) {
        indicator.style.transform = `translateY(${diff - 40}px)`;
        indicator.innerHTML = '<i class="fa fa-arrow-down"></i> 下拉刷新';
      } else {
        indicator.style.transform = `translateY(${diff - 40}px)`;
        indicator.innerHTML = '<i class="fa fa-arrow-up"></i> 释放刷新';
      }
    }
  });

  container.addEventListener('touchend', () => {
    if (!pulling) return;
    pulling = false;
    const diff = curY - startY;
    if (diff > 60) {
      indicator.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 刷新中...';
      indicator.style.transform = '';
      setTimeout(() => {
        indicator.style.display = 'none';
        indicator.style.transform = '';
        if (onRefresh) onRefresh();
      }, 1000);
    } else {
      indicator.style.display = 'none';
    }
  });
}

// ============ Infinite Scroll ============
function initInfiniteScroll(containerSelector, onLoadMore, threshold = 100) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (onLoadMore) onLoadMore();
      }
    });
  }, { threshold: 0.1 });

  const sentinel = document.createElement('div');
  sentinel.className = 'load-more';
  sentinel.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> 加载中...';
  container.appendChild(sentinel);
  sentinel.style.display = 'none';
  observer.observe(sentinel);

  return {
    showLoading() { sentinel.style.display = 'flex'; },
    hideLoading() { sentinel.style.display = 'none'; },
    showEnd(msg = '— 没有更多了 —') {
      sentinel.style.display = 'flex';
      sentinel.innerHTML = msg;
      sentinel.style.color = '#ccc';
    }
  };
}

// ============ Number Stepper ============
function initNumStepper(selector, min = 1, max = 99, onChange) {
  const stepper = document.querySelector(selector);
  if (!stepper) return;
  const minusBtn = stepper.querySelector('.minus-btn');
  const plusBtn = stepper.querySelector('.plus-btn');
  const input = stepper.querySelector('input');
  let value = parseInt(input.value) || min;

  function update() {
    minusBtn.disabled = value <= min;
    plusBtn.disabled = value >= max;
    input.value = value;
    if (onChange) onChange(value);
  }

  minusBtn.addEventListener('click', () => {
    if (value > min) { value--; update(); }
  });
  plusBtn.addEventListener('click', () => {
    if (value < max) { value++; update(); }
  });
  input.addEventListener('change', () => {
    let v = parseInt(input.value);
    if (isNaN(v) || v < min) v = min;
    if (v > max) v = max;
    value = v;
    update();
  });
  update();
}

// ============ Swipe to Delete ============
function initSwipeToDelete(itemSelector, onDelete) {
  document.querySelectorAll(itemSelector).forEach(item => {
    let startX = 0, curX = 0, moved = false;

    item.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      curX = startX;
      moved = false;
      item.querySelector('.swipe-content').style.transition = 'none';
    });

    item.addEventListener('touchmove', e => {
      curX = e.touches[0].clientX;
      const diff = curX - startX;
      if (Math.abs(diff) > 5) moved = true;
      const content = item.querySelector('.swipe-content');
      if (diff < 0) {
        const offset = Math.max(diff, -80);
        content.style.transform = `translateX(${offset}px)`;
      }
    });

    item.addEventListener('touchend', () => {
      const content = item.querySelector('.swipe-content');
      content.style.transition = 'transform 0.3s ease';
      const diff = curX - startX;
      if (diff < -40) {
        content.style.transform = 'translateX(-70px)';
      } else {
        content.style.transform = 'translateX(0)';
      }
      setTimeout(() => { content.style.transition = ''; }, 300);
    });
  });
}

// ============ Local Storage Helpers ============
const Cart = {
  get() {
    try { return JSON.parse(localStorage.getItem('canteen_cart') || '[]'); }
    catch { return []; }
  },
  save(items) {
    localStorage.setItem('canteen_cart', JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  },
  add(product, qty) {
    const items = this.get();
    const exist = items.find(i => i.id === product.id);
    if (exist) {
      exist.qty = Math.min(exist.qty + (qty || 1), 99);
    } else {
      items.push({ ...product, qty: (qty || 1), checked: true });
    }
    this.save(items);
  },
  remove(id) {
    const items = this.get().filter(i => i.id !== id);
    this.save(items);
  },
  updateQty(id, qty) {
    const items = this.get().map(i => i.id === id ? { ...i, qty } : i);
    this.save(items);
  },
  toggleCheck(id) {
    const items = this.get().map(i => i.id === id ? { ...i, checked: !i.checked } : i);
    this.save(items);
  },
  toggleAll(checked) {
    const items = this.get().map(i => ({ ...i, checked }));
    this.save(items);
  },
  clear() {
    this.save([]);
  },
  clearUnavailable() {
    const items = this.get().filter(i => !i.unavailable);
    this.save(items);
  },
  clearAll() {
    this.save([]);
  },
  getTotal() {
    const items = this.get().filter(i => i.checked);
    return items.reduce((sum, i) => sum + i.price * i.qty, 0);
  },
  getCount() {
    return this.get().reduce((sum, i) => sum + i.qty, 0);
  },
  getCheckedCount() {
    return this.get().filter(i => i.checked).reduce((sum, i) => sum + i.qty, 0);
  },
  getOriginalTotal() {
    const items = this.get().filter(i => i.checked);
    return items.reduce((sum, i) => sum + (i.originalPrice || i.price) * i.qty, 0);
  },
  getFinalTotal() {
    const total = this.getTotal();
    let discount = 0;
    let deliveryFee = 5;
    if (total >= PROMO_CONFIG.fullReduction.threshold) {
      discount = PROMO_CONFIG.fullReduction.discount;
    }
    if (total >= PROMO_CONFIG.freeDelivery.threshold) {
      deliveryFee = 0;
    }
    return {
      total,
      discount,
      deliveryFee,
      final: total - discount + deliveryFee
    };
  }
};

// ============ Search History ============
const SearchHistory = {
  KEY: 'canteen_search_history',
  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); }
    catch { return []; }
  },
  add(keyword) {
    let history = this.get().filter(k => k !== keyword);
    history.unshift(keyword);
    history = history.slice(0, 20);
    localStorage.setItem(this.KEY, JSON.stringify(history));
  },
  remove(keyword) {
    const history = this.get().filter(k => k !== keyword);
    localStorage.setItem(this.KEY, JSON.stringify(history));
  },
  clear() {
    localStorage.removeItem(this.KEY);
  }
};

// ============ Mock Product Data ============
// 说明：banners/detailImgs/specs/subCategory/rate 为商品详情页扩展字段，
// 其它页面不读取，缺失时详情页会用默认值兜底。
const _DETAIL_FALLBACK_DESC = '新鲜食材，食堂匠心制作，干净卫生，口感丰富，是您日常用餐的好选择。';
const _DETAIL_FALLBACK_IMGS = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=750&h=500&fit=crop',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=750&h=500&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=750&h=500&fit=crop'
];
const _PRODUCT_DETAIL_EXT = {
  1:  { subCategory: '包子',  specs: ['单个装', '3个装', '6个装'],    rate: 4.9 },
  2:  { subCategory: '牛肉',  specs: ['约200g', '约350g'],          rate: 4.8 },
  3:  { subCategory: '馒头',  specs: ['单个装', '3个装'],           rate: 4.7 },
  4:  { subCategory: '猪肉',  specs: ['约150g', '约250g'],          rate: 4.6 },
  5:  { subCategory: '礼盒',  specs: ['8枚装', '12枚装'],           rate: 4.9 },
  6:  { subCategory: '粥类',  specs: ['小碗', '中碗', '大碗'],      rate: 4.8 },
  7:  { subCategory: '饼类',  specs: ['大份', '小份'],              rate: 4.7 },
  8:  { subCategory: '凉菜',  specs: ['小份', '中份'],              rate: 4.6 },
  9:  { subCategory: '禽类',  specs: ['约200g', '约350g'],          rate: 4.8 },
  10: { subCategory: '馒头',  specs: ['单个装', '3个装'],           rate: 4.7 },
  11: { subCategory: '蛋糕',  specs: ['单条', '2条装'],             rate: 4.9 },
  12: { subCategory: '热菜',  specs: ['小份', '中份', '大份'],      rate: 4.7 },
  13: { subCategory: '拼盘',  specs: ['中份', '大份'],              rate: 4.9 },
  14: { subCategory: '馒头',  specs: ['单个装', '3个装'],           rate: 4.6 },
  15: { subCategory: '蛋糕',  specs: ['6个装', '12个装'],           rate: 4.8 },
  16: { subCategory: '豆浆',  specs: ['中杯', '大杯'],              rate: 4.7 },
  17: { subCategory: '水果',  specs: ['中份', '大份'],              rate: 4.9 },
  18: { subCategory: '饼类',  specs: ['单个装', '3个装'],           rate: 4.6 },
  19: { subCategory: '传统糕点', specs: ['12块装', '24块装'],       rate: 4.8 },
  20: { subCategory: '休闲零食', specs: ['中碗', '大碗'],           rate: 4.7 }
};
const PRODUCTS = [
  { id: 1, name: '手工鲜肉包子', price: 3.5, originalPrice: 4.5, marketPrice: 4.0, unit: '个', tag: '自制品', sales: 3280, stock: 50, img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop', category: '面点', brand: '食堂自制', spec: '单个装', discount: 0.78, unavailable: false, limitNum: 2, dailyLimit: 3 },
  { id: 2, name: '招牌卤牛肉', price: 38, originalPrice: 48, marketPrice: 42, unit: '份', tag: '自制品', sales: 1560, stock: 20, img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop', category: '卤味', brand: '食堂自制', spec: '约200g', discount: 0.79, unavailable: false, limitNum: 1, dailyLimit: 1 },
  { id: 3, name: '红糖馒头', price: 2, originalPrice: 2.5, marketPrice: 1.8, unit: '个', tag: '自制品', sales: 2150, stock: 80, img: 'https://images.unsplash.com/photo-1568471173242-461f0a730452?w=400&h=400&fit=crop', category: '面点', brand: '食堂自制', spec: '单个装', discount: 0.8, unavailable: false },
  { id: 4, name: '卤猪耳', price: 22, originalPrice: 28, marketPrice: 25, unit: '份', tag: '自制品', sales: 980, stock: 15, img: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=400&h=400&fit=crop', category: '卤味', brand: '食堂自制', spec: '约150g', discount: 0.79, unavailable: false, limitNum: 2, dailyLimit: 2 },
  { id: 5, name: '蛋黄酥礼盒', price: 68, originalPrice: 88, marketPrice: 75, unit: '件', tag: '限时团购', sales: 450, stock: 30, img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop', category: '糕点', brand: '知味观', spec: '8枚装', discount: 0.77, unavailable: false, limitNum: 2, dailyLimit: 2 },
  { id: 6, name: '小米粥', price: 3, originalPrice: 3.5, marketPrice: 3.5, unit: '份', tag: '自制品', sales: 4200, stock: 100, img: 'https://images.unsplash.com/photo-1587131782738-de30ea91a542?w=400&h=400&fit=crop', category: '米粥', brand: '食堂自制', spec: '小碗', discount: 0.86, unavailable: false },
  { id: 7, name: '酱香饼', price: 5, originalPrice: 6, marketPrice: 4.5, unit: '份', tag: '自制品', sales: 3100, stock: 60, img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop', category: '面点', brand: '食堂自制', spec: '大份', discount: 0.83, unavailable: false },
  { id: 8, name: '凉拌黄瓜', price: 4, originalPrice: 5, marketPrice: 4.5, unit: '份', tag: '自制品', sales: 2800, stock: 40, img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop', category: '菜品', brand: '食堂自制', spec: '小份', discount: 0.8, unavailable: false },
  { id: 9, name: '卤鸡爪', price: 18, originalPrice: 22, marketPrice: 16, unit: '份', tag: '自制品', sales: 1680, stock: 25, img: 'https://images.unsplash.com/photo-1568781269258-c95af457b944?w=400&h=400&fit=crop', category: '卤味', brand: '食堂自制', spec: '约200g', discount: 0.82, unavailable: false, limitNum: 3 },
  { id: 10, name: '豆沙包', price: 3, originalPrice: 3.5, marketPrice: 3.2, unit: '个', tag: '自制品', sales: 2300, stock: 70, img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop', category: '面点', brand: '食堂自制', spec: '单个装', discount: 0.86, unavailable: false },
  { id: 11, name: '虎皮蛋糕卷', price: 12, originalPrice: 15, marketPrice: 10, unit: '包', tag: '自选品', sales: 620, stock: 18, img: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=400&fit=crop', category: '糕点', brand: '面包新语', spec: '单条', discount: 0.8, unavailable: false, limitNum: 2, dailyLimit: 3 },
  { id: 12, name: '酸辣土豆丝', price: 6, originalPrice: 7, marketPrice: 6.5, unit: '份', tag: '自制品', sales: 3500, stock: 50, img: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop', category: '菜品', brand: '食堂自制', spec: '小份', discount: 0.86, unavailable: false },
  { id: 13, name: '卤味拼盘', price: 58, originalPrice: 68, marketPrice: 55, unit: '份', tag: '自制品', sales: 280, stock: 10, img: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop', category: '卤味', brand: '食堂自制', spec: '中份', discount: 0.85, unavailable: false, limitNum: 1, dailyLimit: 1 },
  { id: 14, name: '老面馒头', price: 1.5, originalPrice: 2, marketPrice: 1.8, unit: '个', tag: '自制品', sales: 5200, stock: 120, img: 'https://images.unsplash.com/photo-1568471173242-461f0a730452?w=400&h=400&fit=crop', category: '面点', brand: '食堂自制', spec: '单个装', discount: 0.75, unavailable: false },
  { id: 15, name: '蜂蜜小蛋糕', price: 15, originalPrice: 18, marketPrice: 13, unit: '包', tag: '自选区', sales: 820, stock: 22, img: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=400&fit=crop', category: '糕点', brand: '巴黎贝甜', spec: '6个装', discount: 0.83, unavailable: false, limitNum: 3 },
  { id: 16, name: '豆浆', price: 4, originalPrice: 5, marketPrice: 4.5, unit: '份', tag: '自制品', sales: 4800, stock: 80, img: 'https://images.unsplash.com/photo-1550505095-81378a674395?w=400&h=400&fit=crop', category: '饮品', brand: '食堂自制', spec: '中杯', discount: 0.8, unavailable: false },
  { id: 17, name: '金枕榴莲', price: 88, originalPrice: 108, marketPrice: 95, unit: '个', tag: '助农产品', sales: 120, stock: 5, img: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&h=400&fit=crop', category: '水果', brand: '食堂自制', spec: '中份', discount: 0.81, unavailable: false, limitNum: 1, dailyLimit: 1 },
  { id: 18, name: '芝麻烧饼', price: 4, originalPrice: 5, marketPrice: 3.5, unit: '个', tag: '自制品', sales: 1950, stock: 40, img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop', category: '面点', brand: '食堂自制', spec: '单个装', discount: 0.8, unavailable: false },
  { id: 19, name: '绿豆糕', price: 22, originalPrice: 28, marketPrice: 25, unit: '包', tag: '自选区', sales: 560, stock: 35, img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop', category: '糕点', brand: '五芳斋', spec: '12块装', discount: 0.79, unavailable: false, limitNum: 3 },
  { id: 20, name: '沃隆每日坚果沃家福礼', price: 8, originalPrice: 10, marketPrice: 7.5, unit: '件', tag: '限时团购', sales: 2600, stock: 45, img: 'https://images.unsplash.com/photo-1587131782738-de30ea91a542?w=400&h=400&fit=crop', category: '	休闲零食', brand: '食堂自制', spec: '中碗', discount: 0.8, unavailable: false },
];

// 把详情页扩展字段合并到每个商品上，保持旧字段不变
PRODUCTS.forEach(p => {
  const ext = _PRODUCT_DETAIL_EXT[p.id] || {};
  p.subCategory = ext.subCategory || p.spec || '常规';
  p.specs = ext.specs || [p.spec || '默认规格'];
  p.rate = ext.rate || (4.5 + Math.random() * 0.5);
  p.banners = [p.img, p.img, p.img];
  p.detailImgs = _DETAIL_FALLBACK_IMGS;
  p.desc = p.name + '：' + _DETAIL_FALLBACK_DESC;
});

const BANNER_IMAGES = [
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=750&h=300&fit=crop',
  'https://images.unsplash.com/photo-1506617420156-8e4536971650?w=750&h=300&fit=crop',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=750&h=300&fit=crop',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=750&h=300&fit=crop',
];

const HOT_SEARCH = ['鲜肉包子', '卤牛肉', '蛋黄酥', '豆浆', '红糖馒头', '卤味拼盘', '小米粥', '蜂蜜小蛋糕'];

const CATEGORIES = [
  {
    id: 'mian',
    name: '面点',
    icon: 'fa-bread-slice',
    iconBg: '#FFF3E0',
    iconColor: '#FF9800',
    sub: ['全部', '馒头', '包子', '糕点', '煎饼']
  },
  {
    id: 'luwei',
    name: '卤味',
    icon: 'fa-drumstick-bite',
    iconBg: '#FFEBEE',
    iconColor: '#F44336',
    sub: ['全部', '牛肉', '猪肉', '禽类', '拼盘']
  },
  {
    id: 'gaodian',
    name: '糕点',
    icon: 'fa-cookie',
    iconBg: '#FFF8E1',
    iconColor: '#FFC107',
    sub: ['全部', '蛋糕', '酥饼', '礼盒', '传统糕点']
  },
  {
    id: 'caipin',
    name: '菜品',
    icon: 'fa-utensils',
    iconBg: '#E8F5E9',
    iconColor: '#4CAF50',
    sub: ['全部', '凉菜', '热菜']
  },
  {
    id: 'yinping',
    name: '饮品',
    icon: 'fa-utensils',
    iconBg: '#E8F5E9',
    iconColor: '#4CAF50',
    sub: ['全部', '奶茶', '饮品']
  },
  {
    id: 'mizhou',
    name: '米粥',
    icon: 'fa-utensils',
    iconBg: '#E8F5E9',
    iconColor: '#4CAF50',
    sub: ['全部', '粥类']
  }
];

// ============ Render Product Card ============
function renderProductCard(product, showAddBtn = true) {
  return `
    <div class="product-card" onclick="goToProductDetail(${product.id})">
      <div class="product-card-img">
        <img src="${product.img}" alt="${product.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/200?text=${encodeURIComponent(product.name)}'">
        ${product.tag ? `<span class="tag tag-primary" style="position:absolute;top:6px;left:6px;font-size:10px;padding:1px 6px;">${product.tag}</span>` : ''}
      </div>
      <div class="product-card-info">
        <div class="product-card-title">${product.name}</div>
        <div class="flex items-center" style="gap:4px;margin-top:3px;">
          <span style="font-size:11px;color:#999;">${product.spec || ''}</span>
        </div>
        <div class="product-card-bottom">
          <div>
            <span class="product-price">¥${product.price.toFixed(1)}</span>
            ${product.originalPrice && product.originalPrice > product.price ? `<span class="product-original-price">¥${product.originalPrice.toFixed(1)}</span>` : ''}
          </div>
          ${showAddBtn ? `
            <div class="add-cart-btn" onclick="event.stopPropagation();addToCart(${product.id})">
              <i class="fa fa-plus"></i>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// ============ Render Product List (Grid) ============
function renderProductGrid(products, showAddBtn = true) {
  return `
    <div class="product-grid">
      ${products.map(p => renderProductCard(p, showAddBtn)).join('')}
    </div>
  `;
}

// ============ Actions ============
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  Cart.add({
    id: product.id,
    name: product.name,
    price: product.price,
    img: product.img,
    tag: product.tag,
    spec: product.spec || '',
    stock: product.stock,
    unavailable: product.unavailable
  });
  showToast('已加入购物车', 'success');
}

function goToProductDetail(productId) {
  // Navigate via iframe postMessage
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'navigate', page: 'detail', id: productId }, '*');
  }
  // Fallback: direct navigation with URL param
  location.href = '商品详情页.html?id=' + productId;
}

// ============ Navigate to Review Center ============
function goToReviewCenter() {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'switchPage', page: 'reviewCenter' }, '*');
  }
  location.href = '评价中心.html';
}

// ============ Navigate to Review Page ============
function goToReviewPage(orderId) {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'switchPage', page: 'reviewWrite', orderId: orderId }, '*');
  }
  location.href = '用户评价页.html?orderId=' + orderId;
}

// ============ Navigate to Review View Page ============
function goToReviewView(productId) {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'switchPage', page: 'reviewView', id: productId }, '*');
  }
  location.href = '评价查看页.html?id=' + productId;
}

// ============ Format Price ============
function formatPrice(price) {
  return '¥' + parseFloat(price).toFixed(2);
}

// ============ Update Cart Badge ============
function updateCartBadge() {
  const count = Cart.getCount();
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

// Listen to cart updates
window.addEventListener('cartUpdated', updateCartBadge);
window.addEventListener('DOMContentLoaded', updateCartBadge);

// ============ Format Number ============
function formatNum(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w+';
  return n.toString();
}

// ============ Product Detail Page Helpers ============

// 脱敏姓名：仅保留首字
function maskName(name) {
  if (!name) return '匿名';
  return String(name)[0] + '***';
}

// 渲染 N 颗星
function starsHtml(score) {
  let html = '';
  const s = Math.round(score * 2) / 2;
  for (let i = 1; i <= 5; i++) {
    if (i <= s) html += '<i class="fa fa-star"></i>';
    else if (i - 0.5 <= s) html += '<i class="fa fa-star-half-alt"></i>';
    else html += '<i class="fa fa-star" style="color:#d9d9d9"></i>';
  }
  return html;
}

// 商品分类一级 / 二级映射
const SUB_CATEGORY_MAP = {
  '面点': '面点',
  '卤味': '卤味',
  '糕点': '糕点',
  '菜品': '菜品',
  '饮品': '饮品',
  '米粥': '米粥',
  '水果': '水果'
};

// 生成评价数据（沿用评价查看页的 mock 词表）
const _REVIEW_NAMES = ['张***', '李***', '王***', '赵***', '陈***', '刘***', '杨***', '黄***', '周***', '吴***', '徐***', '孙***', '马***', '朱***', '胡***', '林***', '郭***', '何***', '高***', '罗***'];
const _REVIEW_GOOD = [
  '味道很好，每天早上都会来买，价格实惠，分量足！',
  '早餐必备，配豆浆完美，口感松软香甜，非常满意！',
  '新鲜出炉的，口感超级好，会一直回购的，强烈推荐！',
  '食堂出品必属精品，味道正宗，价格便宜，赞一个！',
  '包装很用心，没有破损，送达很快，好评！',
  '老顾客了，每次都满意，品质稳定，值得信赖！',
  '非常好吃，家人都喜欢，已经推荐给朋友了！',
  '比外面买的便宜多了，质量也很好，五星好评！',
  '食材新鲜，干净卫生，吃得放心，继续支持！',
  '性价比超高，这个价格能买到这么好吃的，太值了！'
];
const _REVIEW_BAD = [
  '味道一般，没有想象中好吃，有点失望。',
  '分量有点少，价格偏贵，性价比一般。',
  '送达有点慢，希望改进一下配送速度。',
  '包装有点简陋，建议加强一下。',
  '不如上次买的好吃，口感差了一些。'
];
const _REVIEW_IMG_SETS = [
  ['https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop'],
  ['https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop'],
  ['https://images.unsplash.com/photo-1587131782738-de30ea91a542?w=400&h=400&fit=crop'],
  [],
  ['https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1568781269258-c95af457b944?w=400&h=400&fit=crop'],
  [],
  ['https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=400&fit=crop'],
  []
];

// 根据 productId 生成稳定的评价列表（同一商品每次内容一致）
function generateReviews(productId, count) {
  const result = [];
  let seed = productId * 9301 + 49297;
  function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  const baseTime = Date.now();
  for (let i = 0; i < count; i++) {
    const starRand = rand();
    const star = starRand < 0.8 ? 5 : (starRand < 0.95 ? 4 : (rand() < 0.5 ? 3 : 2));
    const isGood = star >= 4;
    const text = isGood
      ? _REVIEW_GOOD[Math.floor(rand() * _REVIEW_GOOD.length)]
      : _REVIEW_BAD[Math.floor(rand() * _REVIEW_BAD.length)];
    const imgs = _REVIEW_IMG_SETS[Math.floor(rand() * _REVIEW_IMG_SETS.length)];
    const daysAgo = Math.floor(rand() * 90);
    const d = new Date(baseTime - daysAgo * 86400000);
    const time = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
    result.push({
      id: productId * 1000 + i,
      name: _REVIEW_NAMES[(productId + i) % _REVIEW_NAMES.length],
      stars: star,
      text,
      imgs,
      time,
      spec: ['默认规格', '单个装', '约200g', '小份', '大份', '中杯'][Math.floor(rand() * 6)]
    });
  }
  return result;
}

// 获取或创建当前用户分享溯源 ID
function getShareUid() {
  try {
    let uid = localStorage.getItem('canteen_share_uid');
    if (!uid) {
      uid = 'U' + Math.random().toString(36).slice(2, 10).toUpperCase();
      localStorage.setItem('canteen_share_uid', uid);
    }
    return uid;
  } catch (e) {
    return 'U00000000';
  }
}

// 收藏 / 取消收藏（详情页使用）
const Favorites = {
  KEY: 'canteen_favorites',
  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); }
    catch { return []; }
  },
  has(id) { return this.get().some(x => x.id === id); },
  toggle(product) {
    const list = this.get();
    const idx = list.findIndex(x => x.id === product.id);
    if (idx >= 0) { list.splice(idx, 1); }
    else { list.unshift({ id: product.id, name: product.name, img: product.img, price: product.price, spec: product.spec, time: Date.now() }); }
    localStorage.setItem(this.KEY, JSON.stringify(list));
    return idx < 0;
  }
};

// 跳到首页并把供应商带过去（首页监听 hash 解析）
function goToHomeWithSupplier(supplier) {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'switchPage', page: 'home', supplier: supplier }, '*');
    return;
  }
  location.href = '首页.html#supplier=' + encodeURIComponent(supplier || '');
}

// 跳到搜索页（保留 query 时把 keyword 一起带上）
function goToSearchPage(keyword) {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'switchPage', page: 'search', keyword: keyword || '' }, '*');
    return;
  }
  location.href = '搜索页.html' + (keyword ? '?kw=' + encodeURIComponent(keyword) : '');
}

// 跳到商品分类页（按一级分类）
function goToCategoryPage(category) {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'switchPage', page: 'category', category: category || '' }, '*');
    return;
  }
  location.href = '分类页.html' + (category ? '?cat=' + encodeURIComponent(category) : '');
}

// 跳转购物车
function goToCartPage() {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'switchPage', page: 'cart' }, '*');
    return;
  }
  location.href = '购物车.html';
}

// 跳转订单确认（立即购买）
function goToOrderConfirm(productId, qty) {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'switchPage', page: 'orderConfirm', productId: productId, qty: qty }, '*');
    return;
  }
  location.href = '订单确认页.html?ids=' + encodeURIComponent(productId + ':' + (qty || 1));
}
