const ITEMS = [
  { level: 1, name: '플레인 빵', icon: '🍞', value: 1, desc: '갓 구워낸 가장 기본적인 빵입니다.' },
  { level: 2, name: '토스트', icon: '🥪', value: 3, desc: '노릇노릇하게 구워진 맛있는 토스트.' },
  { level: 3, name: '크로와상', icon: '🥐', value: 8, desc: '결이 살아있는 고소한 프랑스식 빵.' },
  { level: 4, name: '머핀', icon: '🧁', value: 20, desc: '컵에 담긴 작고 귀여운 케이크.' },
  { level: 5, name: '도넛', icon: '🍩', value: 50, desc: '구멍 뚫린 달코함의 대명사.' },
  { level: 6, name: '조각 케이크', icon: '🍰', value: 120, desc: '한 조각만으로도 행복해지는 생크림 케이크.' },
  { level: 7, name: '팬케이크', icon: '🥞', value: 300, desc: '층층이 쌓인 부드럽고 달콤한 팬케이크.' },
  { level: 8, name: '푸딩', icon: '🍮', value: 800, desc: '탱글탱글한 식감이 일품인 커스터드 푸딩.' },
  { level: 9, name: '초코 케이크', icon: '🍫', value: 2000, desc: '초콜릿이 가득 들어간 진한 맛의 케이크.' },
  { level: 10, name: '기념 케이크', icon: '🎂', value: 5000, desc: '특별한 날을 축하하기 위한 최고의 케이크!' },
];

const TOPPINGS = [
  { id: 'butter', name: '고소한 버터', icon: '🧈', cost: 100, multiplier: 1.5, compatibleLevels: [1, 2], compatibleNames: '플레인 빵, 토스트' },
  { id: 'berry', name: '상큼한 블루베리', icon: '🫐', cost: 500, multiplier: 2.0, compatibleLevels: [4, 8], compatibleNames: '머핀, 푸딩' },
  { id: 'syrup', name: '달콤한 딸기 시럽', icon: '🍓', cost: 2000, multiplier: 2.5, compatibleLevels: [5, 7], compatibleNames: '도넛, 팬케이크' },
  { id: 'cream', name: '부드러운 생크림', icon: '🥛', cost: 10000, multiplier: 3.0, compatibleLevels: [6, 10], compatibleNames: '조각 케이크, 기념 케이크' },
  { id: 'honey', name: '메이플 시럽', icon: '🍯', cost: 50000, multiplier: 4.0, compatibleLevels: [3, 7], compatibleNames: '크로와상, 팬케이크' },
  { id: 'choco', name: '진한 초콜릿', icon: '🍫', cost: 250000, multiplier: 5.0, compatibleLevels: [5, 9], compatibleNames: '도넛, 초코 케이크' },
  { id: 'candle', name: '생일 초', icon: '🕯️', cost: 1000000, multiplier: 10.0, compatibleLevels: [6, 10], compatibleNames: '조각 케이크, 기념 케이크' },
];

let state = {
  gridSize: 16,
  grid: Array(16).fill(null),
  coins: 0,
  draggedIndex: null,
  nickname: '',
  rooms: [
    { id: 1, name: '초보자 환영방', creator: '빵장이', players: 1 },
    { id: 2, name: '머지 고수만', creator: '베이커리킹', players: 2 },
  ],
  currentRoom: null,
  quests: [
    { id: 1, text: '빵을 10번 구워보세요', target: 10, current: 0, reward: 200, completed: false },
    { id: 2, text: '빵 합치기 5번 성공', target: 5, current: 0, reward: 500, completed: false },
    { id: 3, text: '토핑 3번 올려보기', target: 3, current: 0, reward: 1000, completed: false },
  ],
  backgrounds: [
    { id: 'default', name: '클래식 베이커리', color: '#fffaf0', cost: 0, unlocked: true },
    { id: 'strawberry', name: '딸기 핑크 룸', color: '#fff0f5', cost: 5000, unlocked: false },
    { id: 'mint', name: '민트 초코 방', color: '#f0fff0', cost: 15000, unlocked: false },
    { id: 'night', name: '세벽 빵집 (Dark)', color: '#2c3e50', cost: 50000, unlocked: false, textColor: 'white' },
  ],
  currentBackground: 'default'
};

const EXPANSION_COSTS = {
  20: 5000,
  25: 25000,
  30: 100000,
  36: 500000,
};

// Initialize
const board = document.getElementById('game-board');
const coinDisplay = document.getElementById('coin-count');
const spawnBtn = document.getElementById('spawn-btn');
const recipeBtn = document.getElementById('recipe-btn');
const bookBtn = document.getElementById('book-btn');
const trashCan = document.getElementById('trash-can');
const recipeModal = document.getElementById('recipe-modal');
const bookModal = document.getElementById('book-modal');
const recipeList = document.getElementById('recipe-list');
const bookList = document.getElementById('book-list');
const resetBtn = document.getElementById('reset-btn');
const closeBtns = document.querySelectorAll('.close-btn');

let peer = null;
let conn = null;

function init() {
  console.log('🥖 Bakery Merge: Initializing...');
  // Load from local storage
  const saved = localStorage.getItem('bakery-merge-save');
  if (saved) {
    const data = JSON.parse(saved);
    state.coins = data.coins || 0;
    state.gridSize = data.gridSize || 16;
    state.grid = data.grid || Array(state.gridSize).fill(null);
    state.nickname = data.nickname || '';
    state.quests = data.quests || state.quests;
    state.backgrounds = data.backgrounds || state.backgrounds;
    state.currentBackground = data.currentBackground || 'default';
  }

  if (state.nickname) {
    document.getElementById('nickname-overlay').style.display = 'none';
  }

  applyBackground(state.currentBackground);

  createBoard();
  updateCoins();
  setupEventListeners();
  updateExpandBtn();
  console.log('🥖 Bakery Merge: Game Ready!');
}

function createBoard() {
  board.innerHTML = '';
  const cols = Math.ceil(Math.sqrt(state.gridSize));
  board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  state.grid.forEach((item, index) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = index;

    if (item) {
      renderItem(cell, item);
    }

    cell.addEventListener('dragover', handleDragOver);
    cell.addEventListener('dragleave', handleDragLeave);
    cell.addEventListener('drop', handleDrop);

    board.appendChild(cell);
  });

  // Setup Trash Can listeners
  trashCan.addEventListener('dragover', (e) => {
    e.preventDefault();
    trashCan.classList.add('over');
  });
  trashCan.addEventListener('dragleave', () => {
    trashCan.classList.remove('over');
  });
  trashCan.addEventListener('drop', handleTrashDrop);
}

function handleTrashDrop(e) {
  e.preventDefault();
  trashCan.classList.remove('over');
  const sourceIndex = state.draggedIndex;
  if (sourceIndex !== null) {
    state.grid[sourceIndex] = null;
    saveGame();
    createBoard();
    showFloatingText(trashCan, '삭제됨', '#ff5252');
  }
}

function renderItem(cell, item) {
  const itemEl = document.createElement('div');
  itemEl.className = 'item';
  itemEl.draggable = true;
  const isTopping = !!item.type && item.type === 'topping';

  itemEl.innerHTML = `
    <div class="item-visual">${item.icon}</div>
    ${isTopping ? '' : `<div class="item-level">${item.level}</div>`}
  `;

  if (item.toppings) {
    item.toppings.forEach((t, i) => {
      const tag = document.createElement('div');
      tag.className = 'topping-tag';
      tag.style.position = 'absolute';
      tag.style.top = `${i * 12}px`;
      tag.style.left = '-8px';
      tag.style.fontSize = '1.3rem';
      tag.style.cursor = 'pointer';
      tag.title = '클릭하여 토핑 제거';
      tag.innerHTML = t.icon;

      tag.onclick = (e) => {
        e.stopPropagation();
        removeTopping(parseInt(cell.dataset.index), t.id);
      };

      itemEl.appendChild(tag);
    });
  }

  itemEl.addEventListener('dragstart', (e) => handleDragStart(e, cell.dataset.index));
  itemEl.addEventListener('dragend', handleDragEnd);

  cell.appendChild(itemEl);
}

function removeTopping(dessertIndex, toppingId) {
  const item = state.grid[dessertIndex];
  if (!item || !item.toppings) return;

  const toppingIndex = item.toppings.findIndex(t => t.id === toppingId);
  if (toppingIndex === -1) return;

  const removedTopping = item.toppings.splice(toppingIndex, 1)[0];

  // Try to place it back on the grid
  const emptyIndex = state.grid.findIndex(cell => cell === null);
  if (emptyIndex !== -1) {
    state.grid[emptyIndex] = { ...removedTopping, type: 'topping', toppings: null };
    showFloatingText(board.children[emptyIndex], '토핑 회수', 'gold');
  } else {
    alert(`${removedTopping.name} 토핑을 제거했습니다. (보드에 공간이 없어 소멸되었습니다)`);
  }

  saveGame();
  createBoard();
}

function handleDragStart(e, index) {
  state.draggedIndex = parseInt(index);
  e.target.classList.add('dragging');
  // Required for Firefox
  e.dataTransfer.setData('text/plain', index);
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
}

function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('over');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('over');
}

function handleDrop(e) {
  e.preventDefault();
  const targetIndex = parseInt(e.currentTarget.dataset.index);
  const sourceIndex = state.draggedIndex;

  e.currentTarget.classList.remove('over');

  if (sourceIndex === targetIndex) return;

  const sourceItem = state.grid[sourceIndex];
  const targetItem = state.grid[targetIndex];

  if (!targetItem) {
    // Move
    state.grid[targetIndex] = sourceItem;
    state.grid[sourceIndex] = null;
  } else if (sourceItem.type === 'topping' && targetItem.type !== 'topping') {
    // Apply Topping
    if (!sourceItem.compatibleLevels.includes(targetItem.level)) {
      alert(`이 토핑은 ${targetItem.name}에 올릴 수 없습니다!\n어울리는 빵: ${sourceItem.compatibleNames}`);
      return;
    }
    if (!targetItem.toppings) targetItem.toppings = [];
    if (targetItem.toppings.some(t => t.id === sourceItem.id)) {
      alert('이미 이 토핑이 추가되어 있습니다!');
      return;
    }
    targetItem.toppings.push({ ...sourceItem });
    state.grid[sourceIndex] = null;
    showFloatingText(e.currentTarget, `UPGRADE!`, 'gold');
    updateQuestProgress(3, 1);
  } else if (sourceItem.type !== 'topping' && targetItem.type === 'topping') {
    // Inverse: Drag dessert to topping
    if (!targetItem.compatibleLevels.includes(sourceItem.level)) {
      alert(`이 토핑은 ${sourceItem.name}에 올릴 수 없습니다!\n어울리는 빵: ${targetItem.compatibleNames}`);
      return;
    }
    if (!sourceItem.toppings) sourceItem.toppings = [];
    if (sourceItem.toppings.some(t => t.id === targetItem.id)) {
      alert('이미 이 토핑이 추가되어 있습니다!');
      return;
    }
    sourceItem.toppings.push({ ...targetItem });
    state.grid[targetIndex] = sourceItem;
    state.grid[sourceIndex] = null;
    showFloatingText(e.currentTarget, `UPGRADE!`, 'gold');
    updateQuestProgress(3, 1);
  } else if (sourceItem.level && targetItem.level && sourceItem.level === targetItem.level) {
    // Merge
    const nextLevel = sourceItem.level + 1;
    if (nextLevel <= ITEMS.length) {
      updateQuestProgress(2, 1);
      const newItem = { ...ITEMS[nextLevel - 1] };
      // Inherit toppings? Let's combine them and remove duplicates
      const sourceToppings = sourceItem.toppings || [];
      const targetToppings = targetItem.toppings || [];
      const combinedToppings = [...sourceToppings, ...targetToppings];
      // Keep only unique toppings by ID
      newItem.toppings = Array.from(new Map(combinedToppings.map(t => [t.id, t])).values());

      state.grid[targetIndex] = newItem;
      state.grid[sourceIndex] = null;

      addCoins(ITEMS[nextLevel - 1].value * 5);
      showFloatingText(e.currentTarget, `+${ITEMS[nextLevel - 1].value * 5} 💰`, 'gold');

      setTimeout(() => {
        const cell = board.children[targetIndex];
        const item = cell.querySelector('.item');
        if (item) item.classList.add('merge-anim');
      }, 10);
    }
  } else {
    // Swap
    state.grid[targetIndex] = sourceItem;
    state.grid[sourceIndex] = targetItem;
  }

  saveGame();
  createBoard();
}

function spawnItem() {
  const emptyIndices = state.grid.map((item, i) => item === null ? i : null).filter(i => i !== null);

  if (emptyIndices.length === 0) {
    alert('공간이 부족합니다!');
    return;
  }

  const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  // Always spawn level 1 for now, maybe upgraded later
  state.grid[randomIndex] = { ...ITEMS[0], level: 1 };

  updateQuestProgress(1, 1);
  saveGame();
  createBoard();

  // Animation
  const cell = board.children[randomIndex];
  cell.style.transform = 'scale(0)';
  setTimeout(() => cell.style.transform = 'scale(1)', 50);
}

function addCoins(amount) {
  state.coins += amount;
  updateCoins();
  updateExpandBtn();
  saveGame();
}

function updateCoins() {
  coinDisplay.innerText = state.coins.toLocaleString();
}

function showFloatingText(target, text, color) {
  const rect = target.getBoundingClientRect();
  const el = document.createElement('div');
  el.innerText = text;
  el.style.position = 'fixed';
  el.style.left = `${rect.left + rect.width / 2}px`;
  el.style.top = `${rect.top}px`;
  el.style.color = color === 'gold' ? '#ff9800' : '#5d4037';
  el.style.fontWeight = '800';
  el.style.pointerEvents = 'none';
  el.style.zIndex = '1000';
  el.style.transition = 'all 1s ease-out';

  document.body.appendChild(el);

  setTimeout(() => {
    el.style.transform = 'translateY(-50px)';
    el.style.opacity = '0';
  }, 10);

  setTimeout(() => el.remove(), 1000);
}

function openRecipes() {
  recipeList.innerHTML = '';
  TOPPINGS.forEach(topping => {
    const recipeItem = document.createElement('div');
    recipeItem.className = 'recipe-item unlocked';

    recipeItem.innerHTML = `
      <div class="recipe-icon">${topping.icon}</div>
      <div class="recipe-info">
        <div class="recipe-name">${topping.name}</div>
        <div class="recipe-cost">가격: ${topping.cost.toLocaleString()} 💰</div>
        <div class="recipe-desc" style="font-size: 0.8rem; color: #888;">수익 x${topping.multiplier}배 보너스</div>
        <div class="topping-target" style="font-size: 0.75rem; color: #d2691e; margin-top: 4px;">어울리는 빵: ${topping.compatibleNames}</div>
      </div>
    `;

    const btn = document.createElement('button');
    btn.className = 'unlock-btn';
    btn.innerText = '구매하기';
    btn.onclick = () => buyTopping(topping);
    recipeItem.appendChild(btn);

    recipeList.appendChild(recipeItem);
  });
  recipeModal.classList.add('active');
}

function openBook() {
  bookList.innerHTML = '';
  ITEMS.forEach(item => {
    const itemRow = document.createElement('div');
    itemRow.className = 'recipe-item unlocked';
    itemRow.innerHTML = `
      <div class="recipe-icon">${item.icon}</div>
      <div class="recipe-info">
        <div class="recipe-name">${item.name}</div>
        <div class="recipe-cost">기본 수익: ${item.value.toLocaleString()} 💰</div>
        <div class="recipe-desc" style="font-size: 0.8rem; color: #666; margin-top: 4px;">${item.desc}</div>
      </div>
    `;
    bookList.appendChild(itemRow);
  });
  bookModal.classList.add('active');
}

function buyTopping(topping) {
  if (state.coins >= topping.cost) {
    const emptyIndices = state.grid.map((item, i) => item === null ? i : null).filter(i => i !== null);
    if (emptyIndices.length === 0) {
      alert('공간이 부족하여 토핑을 구매할 수 없습니다!');
      return;
    }

    state.coins -= topping.cost;
    const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    state.grid[randomIndex] = { ...topping, type: 'topping' };

    updateCoins();
    createBoard();
    saveGame();
    recipeModal.classList.remove('active');
    alert(`🛒 ${topping.name}을(를) 구매했습니다! 디저트 위에 올려보세요.`);
  } else {
    alert('코인이 부족합니다!');
  }
}

function updateExpandBtn() {
  const expandBtn = document.getElementById('expand-btn');
  const nextSize = getNextSize();
  if (nextSize) {
    expandBtn.innerText = `➕ 확장 (${EXPANSION_COSTS[nextSize].toLocaleString()} 💰)`;
    expandBtn.disabled = state.coins < EXPANSION_COSTS[nextSize];
  } else {
    expandBtn.innerText = 'MAX 확장';
    expandBtn.disabled = true;
  }
}

function getNextSize() {
  const currentSize = state.gridSize;
  const sizes = Object.keys(EXPANSION_COSTS).map(Number).sort((a, b) => a - b);
  return sizes.find(s => s > currentSize);
}

function expandBoard() {
  const nextSize = getNextSize();
  if (!nextSize) return;

  const cost = EXPANSION_COSTS[nextSize];
  if (state.coins >= cost) {
    state.coins -= cost;
    state.gridSize = nextSize;
    // Add new null slots to grid
    const additional = nextSize - state.grid.length;
    state.grid = [...state.grid, ...Array(additional).fill(null)];

    updateCoins();
    createBoard();
    updateExpandBtn();
    saveGame();

    alert(`🎉 보드가 ${nextSize}칸으로 확장되었습니다!`);
  } else {
    alert('코인이 부족합니다!');
  }
}

function saveGame() {
  const data = {
    coins: state.coins,
    gridSize: state.gridSize,
    grid: state.grid,
    nickname: state.nickname,
    quests: state.quests,
    backgrounds: state.backgrounds,
    currentBackground: state.currentBackground,
  };
  localStorage.setItem('bakery-merge-save', JSON.stringify(data));
}

function resetGame() {
  if (confirm('모든 진행 상황을 초기화하시겠습니까? 구매한 배경과 코인이 모두 사라집니다.')) {
    localStorage.removeItem('bakery-merge-save');
    location.reload();
  }
}

// --- Real Multiplayer Logic (PeerJS) ---

function initMultiplayer() {
  // Use nickname as part of Peer ID for easier identification
  const peerId = `bakery-${state.nickname}-${Math.floor(Math.random() * 1000)}`;
  peer = new Peer(peerId);

  peer.on('open', (id) => {
    console.log('My peer ID is: ' + id);
  });

  peer.on('connection', (connection) => {
    conn = connection;
    setupConnectionListeners();
    // Auto-join the room view
    joinRoom({ name: '초대된 방', creator: '상대방', isHost: false });
  });
}

function setupConnectionListeners() {
  conn.on('data', (data) => {
    if (data.type === 'chat') {
      appendChatMessage(data.sender, data.text, true);
    } else if (data.type === 'battle_start') {
      startBattle(true);
    }
  });

  conn.on('close', () => {
    alert('연결이 끊어졌습니다.');
    exitRoom();
  });
}

function openQuests() {
  const questList = document.getElementById('quest-list');
  const questModal = document.getElementById('quest-modal');
  questList.innerHTML = '';

  state.quests.forEach(quest => {
    const el = document.createElement('div');
    el.className = `recipe-item unlocked ${quest.completed ? 'completed' : ''}`;
    el.innerHTML = `
      <div class="recipe-icon">${quest.completed ? '✅' : '🎯'}</div>
      <div class="recipe-info">
        <div class="recipe-name">${quest.text}</div>
        <div class="recipe-desc" style="color: #666; font-size: 0.8rem;">보상: ${quest.reward}💰 | 진행: ${quest.current}/${quest.target}</div>
      </div>
    `;
    questList.appendChild(el);
  });

  questModal.classList.add('active');
}

function openDecor() {
  const decorList = document.getElementById('decor-list');
  const decorModal = document.getElementById('decor-modal');
  decorList.innerHTML = '';

  state.backgrounds.forEach(bg => {
    const el = document.createElement('div');
    el.className = 'recipe-item unlocked';
    el.innerHTML = `
      <div class="recipe-icon" style="background:${bg.color}; width:40px; height:40px; border-radius:50%; border:2px solid #ccc;"></div>
      <div class="recipe-info">
        <div class="recipe-name">${bg.name}</div>
        <div class="recipe-cost">${bg.unlocked ? (state.currentBackground === bg.id ? '적용 중' : '보유 중') : `가격: ${bg.cost.toLocaleString()} 💰`}</div>
      </div>
      <button class="unlock-btn">${bg.unlocked ? (state.currentBackground === bg.id ? '사용 중' : '적용') : '구매'}</button>
    `;

    el.querySelector('button').onclick = () => {
      if (bg.unlocked) {
        applyBackground(bg.id);
      } else {
        if (state.coins >= bg.cost) {
          state.coins -= bg.cost;
          bg.unlocked = true;
          applyBackground(bg.id);
          updateCoins();
          openDecor();
          saveGame();
        } else {
          alert('코인이 부족합니다!');
        }
      }
    };

    decorList.appendChild(el);
  });

  decorModal.classList.add('active');
}

function applyBackground(bgId) {
  const bg = state.backgrounds.find(b => b.id === bgId);
  if (bg) {
    document.body.style.background = bg.color;
    document.body.style.backgroundImage = `radial-gradient(var(--cell-bg) 2px, transparent 2px)`;
    document.body.style.backgroundSize = '40px 40px';
    state.currentBackground = bgId;
    saveGame();
  }
}

function openMultiLobby() {
  if (!peer) initMultiplayer();

  const roomList = document.getElementById('room-list');
  const multiModal = document.getElementById('multi-modal');
  roomList.innerHTML = `
    <div class="recipe-item unlocked" style="flex-direction: column; align-items: flex-start; gap: 10px;">
      <div style="font-weight: bold;">나의 접속 코드: <span style="color: var(--primary-color);">${peer.id}</span></div>
      <p style="font-size: 0.8rem; color: #666;">친구에게 이 코드를 보내면 친구가 내 방으로 올 수 있습니다.</p>
      <div style="display: flex; gap: 5px; width: 100%;">
        <input type="text" id="join-peer-id" placeholder="친구 코드 입력..." style="flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #ccc;">
        <button id="connect-btn" class="unlock-btn" style="padding: 5px 15px;">입장하기</button>
      </div>
    </div>
    <hr style="width: 100%; border: 0; border-top: 1px solid #eee;">
    <div style="color: #888; font-size: 0.85rem; text-align: center;">위 코드를 공유해서 실시간 친구를 초대하세요!</div>
  `;

  document.getElementById('connect-btn').onclick = () => {
    const targetId = document.getElementById('join-peer-id').value;
    if (targetId) {
      conn = peer.connect(targetId);
      setupConnectionListeners();
      conn.on('open', () => {
        joinRoom({ name: '친구의 방', creator: '친구', isHost: true });
      });
    }
  };

  multiModal.classList.add('active');
}

function joinRoom(room) {
  state.currentRoom = room;
  document.getElementById('lobby-view').style.display = 'none';
  document.getElementById('room-view').style.display = 'block';
  document.getElementById('current-room-title').innerText = `🏠 ${room.name} (ID: ${peer.id})`;

  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML = `<div style="color: #888;">${room.name}에 연결되었습니다.</div>`;
}

function sendChat() {
  const input = document.getElementById('chat-input');
  if (!input.value.trim() || !conn) return;

  const text = input.value;
  conn.send({ type: 'chat', sender: state.nickname, text: text });
  appendChatMessage(state.nickname, text, false);
  input.value = '';
}

function appendChatMessage(sender, text, isRemote) {
  const chatBox = document.getElementById('chat-box');
  const msg = document.createElement('div');
  if (isRemote) msg.style.color = '#2196f3';
  msg.innerHTML = `<b>${sender}:</b> ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function startBattle(isRemoteTriggered = false) {
  if (!isRemoteTriggered && conn) {
    conn.send({ type: 'battle_start' });
  }

  const status = document.getElementById('battle-status');
  status.innerText = "⚔️ 경쟁 중! 30초 동안 누가 더 많은 코인을 벌까요?";

  let myStartCoins = state.coins;

  setTimeout(() => {
    const earned = state.coins - myStartCoins;
    alert(`⚔️ 배틀 종료!\n나의 기록: ${earned.toLocaleString()} 💰\n\n친구가 실시간으로 플레이했다면 각자의 화면에서 결과를 확인하세요!`);
    status.innerText = "";
  }, 30000);
}

function exitRoom() {
  if (conn) conn.close();
  document.getElementById('lobby-view').style.display = 'block';
  document.getElementById('room-view').style.display = 'none';
  state.currentRoom = null;
}

function setupEventListeners() {
  // Nickname
  document.getElementById('save-nickname').addEventListener('click', () => {
    console.log('🥖 Bakery Merge: Start button clicked');
    const input = document.getElementById('nickname-input');
    const nickname = input.value.trim();
    if (nickname) {
      state.nickname = nickname;
      document.getElementById('nickname-overlay').style.display = 'none';
      saveGame();
      console.log('🥖 Bakery Merge: Nickname saved:', nickname);
    } else {
      alert('닉네임을 입력해주세요!');
    }
  });

  spawnBtn.addEventListener('click', spawnItem);
  recipeBtn.addEventListener('click', openRecipes);
  bookBtn.addEventListener('click', openBook);
  document.getElementById('expand-btn').addEventListener('click', expandBoard);
  document.getElementById('multi-btn').addEventListener('click', openMultiLobby);
  document.getElementById('quest-btn').addEventListener('click', openQuests);
  document.getElementById('decor-btn').addEventListener('click', openDecor);
  document.getElementById('reset-btn').addEventListener('click', resetGame);
  document.getElementById('send-chat').addEventListener('click', sendChat);
  document.getElementById('exit-room').addEventListener('click', exitRoom);
  document.getElementById('battle-btn').addEventListener('click', () => startBattle());

  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      recipeModal.classList.remove('active');
      bookModal.classList.remove('active');
      document.getElementById('multi-modal').classList.remove('active');
      document.getElementById('quest-modal').classList.remove('active');
      document.getElementById('decor-modal').classList.remove('active');
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target === recipeModal) recipeModal.classList.remove('active');
    if (e.target === bookModal) bookModal.classList.remove('active');
    if (e.target === document.getElementById('multi-modal')) document.getElementById('multi-modal').classList.remove('active');
    if (e.target === document.getElementById('quest-modal')) document.getElementById('quest-modal').classList.remove('active');
    if (e.target === document.getElementById('decor-modal')) document.getElementById('decor-modal').classList.remove('active');
  });

  // Coin ticking (passive income from items)
  setInterval(() => {
    let totalPassive = 0;
    state.grid.forEach((item, index) => {
      if (item && item.type !== 'topping') {
        let value = item.value;
        // Apply topping multipliers
        if (item.toppings) {
          item.toppings.forEach(t => {
            value *= t.multiplier;
          });
        }
        totalPassive += value;

        // Occasionally show floating text for items
        if (Math.random() > 0.8) {
          const cell = board.children[index];
          showFloatingText(cell, `+${Math.floor(value)} 💰`, 'gold');
        }
      }
    });

    if (totalPassive > 0) {
      addCoins(totalPassive);
    }
  }, 3000);
}

init();
