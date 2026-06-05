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
