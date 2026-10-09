const hotels = [
  {
    id: 'mar-azul',
    name: 'Hotel Mar Azul',
    city: 'Santos',
    area: 'Gonzaga · 300 m da praia',
    score: '9,1',
    review: 'Fantástico',
    rate: 289,
    icon: '🏖️',
    tags: ['Café da manhã', 'Wi-Fi grátis', 'Cancelamento flexível']
  },
  {
    id: 'avenida-prime',
    name: 'Avenida Prime Hotel',
    city: 'São Paulo',
    area: 'Bela Vista · próximo à Av. Paulista',
    score: '8,8',
    review: 'Muito bom',
    rate: 335,
    icon: '🏙️',
    tags: ['Café da manhã', 'Academia', 'Recepção 24h']
  },
  {
    id: 'serra-vista',
    name: 'Serra Vista Hotel',
    city: 'Campos do Jordão',
    area: 'Capivari · região central',
    score: '9,3',
    review: 'Excepcional',
    rate: 418,
    icon: '⛰️',
    tags: ['Estacionamento', 'Aquecimento', 'Café colonial']
  },
  {
    id: 'costa-verde',
    name: 'Costa Verde Pousada',
    city: 'Ubatuba',
    area: 'Praia Grande · 450 m da praia',
    score: '8,6',
    review: 'Muito bom',
    rate: 248,
    icon: '🌴',
    tags: ['Piscina', 'Wi-Fi grátis', 'Área familiar']
  }
];

const state = {
  adults: 2,
  children: 0,
  rooms: 1,
  childAges: [],
  selectedHotel: null,
  lastSearch: null,
  pendingBooking: false
};

const $ = (id) => document.getElementById(id);

function money(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function toDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function formatDate(value) {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function calculateNights(checkin, checkout) {
  const start = toDate(checkin);
  const end = toDate(checkout);
  if (!start || !end || end <= start) return 0;

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return Math.round((end - start) / 86400000);
  }

  const monthGap = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return (monthGap * 30) - start.getDate() + end.getDate();
}

function childrenFeePerNight(ages) {
  return ages.reduce((sum, age) => {
    const numericAge = Number(age);
    if (numericAge <= 5) return sum;
    if (numericAge <= 13) return sum + 40;
    return sum + 80;
  }, 0);
}

function additionalAdultsFeePerNight(adults, rooms) {
  const included = rooms * 2;
  return Math.max(0, adults - included) * 80;
}

function calculatePrice(hotel, search) {
  const nights = calculateNights(search.checkin, search.checkout);
  const roomSubtotal = hotel.rate * nights * search.rooms;
  const extraAdults = additionalAdultsFeePerNight(search.adults, search.rooms) * nights;
  const children = childrenFeePerNight(search.childAges) * nights;
  return {
    nights,
    roomSubtotal,
    extraAdults,
    children,
    total: roomSubtotal + extraAdults + children
  };
}

function setDefaultDates() {
  const today = new Date();
  today.setHours(12,0,0,0);
  const inDate = new Date(today);
  inDate.setDate(today.getDate() + 7);
  const outDate = new Date(today);
  outDate.setDate(today.getDate() + 9);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  $('checkin').value = iso(inDate);
  $('checkout').value = iso(outDate);
  $('checkin').min = iso(today);
  $('checkout').min = iso(today);
}

function renderChildAges() {
  const wrapper = $('child-ages');
  wrapper.innerHTML = '';
  if (state.children === 0) return;

  for (let i = 0; i < state.children; i++) {
    const label = document.createElement('label');
    label.className = 'child-age-label';
    label.textContent = `Idade da criança ${i + 1}`;
    const select = document.createElement('select');
    select.dataset.childIndex = String(i);
    select.innerHTML = '<option value="">Selecione</option>' + Array.from({ length: 18 }, (_, age) => `<option value="${age}">${age} ${age === 1 ? 'ano' : 'anos'}</option>`).join('');
    if (state.childAges[i] !== undefined && state.childAges[i] !== '') select.value = String(state.childAges[i]);
    select.addEventListener('change', (event) => {
      state.childAges[i] = event.target.value;
    });
    label.appendChild(select);
    wrapper.appendChild(label);
  }
}

function updateGuestSummary() {
  $('adults-value').textContent = state.adults;
  $('children-value').textContent = state.children;
  $('rooms-value').textContent = state.rooms;
  $('guests-summary').textContent = `${state.adults} ${state.adults === 1 ? 'adulto' : 'adultos'} · ${state.children} ${state.children === 1 ? 'criança' : 'crianças'} · ${state.rooms} ${state.rooms === 1 ? 'quarto' : 'quartos'}`;
}

function validateSearch() {
  const checkin = toDate($('checkin').value);
  const checkout = toDate($('checkout').value);
  if (!checkin || !checkout) return 'Informe as datas de entrada e saída.';
  if (checkout <= checkin) return 'A data de saída deve ser posterior à data de entrada.';
  if (state.children > 0 && (state.childAges.length !== state.children || state.childAges.some(age => age === '' || age === undefined))) {
    return 'Informe a idade de todas as crianças.';
  }
  return '';
}

function getSearchData() {
  return {
    destination: $('destination').value.trim(),
    checkin: $('checkin').value,
    checkout: $('checkout').value,
    adults: state.adults,
    children: state.children,
    rooms: state.rooms,
    childAges: [...state.childAges]
  };
}

function renderHotels(list = hotels) {
  const grid = $('hotel-grid');
  grid.innerHTML = '';
  list.forEach((hotel) => {
    const card = document.createElement('article');
    card.className = 'hotel-card';
    card.dataset.hotelId = hotel.id;
    card.innerHTML = `
      <div class="hotel-photo" aria-label="Imagem ilustrativa de ${hotel.name}"><span class="photo-icon">${hotel.icon}</span></div>
      <div class="hotel-info">
        <div class="hotel-topline">
          <div>
            <h3>${hotel.name}</h3>
            <p class="location">${hotel.city} · ${hotel.area}</p>
          </div>
          <div class="rating"><span>${hotel.review}</span><span class="score">${hotel.score}</span></div>
        </div>
        <div class="tags">${hotel.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
        <div class="hotel-bottom">
          <button class="reserve-btn" data-reserve="${hotel.id}" type="button">Ver disponibilidade</button>
          <div class="price"><small>A partir de</small><strong>${money(hotel.rate)}</strong><small>por quarto/noite</small></div>
        </div>
      </div>`;
    grid.appendChild(card);
  });
  grid.querySelectorAll('[data-reserve]').forEach(btn => btn.addEventListener('click', () => openBooking(btn.dataset.reserve)));
}

function runSearch() {
  const error = validateSearch();
  if (error) {
    $('search-message').textContent = error;
    $('search-message').classList.remove('hidden');
    return;
  }
  $('search-message').classList.add('hidden');
  state.lastSearch = getSearchData();
  const query = state.lastSearch.destination.toLowerCase();
  const filtered = query ? hotels.filter(h => `${h.city} ${h.name} ${h.area}`.toLowerCase().includes(query)) : hotels;
  renderHotels(filtered);
  $('results-meta').classList.remove('hidden');
  $('results-title').textContent = state.lastSearch.destination ? `Hospedagens em ${state.lastSearch.destination}` : 'Hospedagens disponíveis';
  $('results-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'opção encontrada' : 'opções encontradas'}`;
  $('ofertas').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openLogin(pendingBooking = false) {
  state.pendingBooking = pendingBooking;
  $('login-error').classList.add('hidden');
  $('login-modal').classList.remove('hidden');
  setTimeout(() => $('login-email').focus(), 20);
}

function performLogin() {
  const email = $('login-email').value.trim();
  const password = $('login-password').value;
  if (email === 'aluno@reservafacil.com' && password === 'Teste123') {
    localStorage.setItem('rf_user', JSON.stringify({ name: 'Aluno QA', email }));
    $('login-modal').classList.add('hidden');
    syncUser();
    showToast('Login realizado com sucesso.');
    if (state.pendingBooking && state.selectedHotel) {
      state.pendingBooking = false;
      openBooking(state.selectedHotel.id);
    }
  } else {
    $('login-error').textContent = 'E-mail ou senha inválidos. Confira os dados e tente novamente.';
    $('login-error').classList.remove('hidden');
  }
}

function syncUser() {
  const raw = localStorage.getItem('rf_user');
  const user = raw ? JSON.parse(raw) : null;
  if (user) {
    $('open-login').classList.add('hidden');
    $('user-menu').classList.remove('hidden');
    $('user-name').textContent = user.name;
  } else {
    $('open-login').classList.remove('hidden');
    $('user-menu').classList.add('hidden');
  }
}

function openBooking(hotelId) {
  const hotel = hotels.find(h => h.id === hotelId);
  state.selectedHotel = hotel;
  const search = state.lastSearch || getSearchData();
  const error = validateSearch();
  if (error) {
    $('search-message').textContent = error;
    $('search-message').classList.remove('hidden');
    $('inicio').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  state.lastSearch = search;
  if (!localStorage.getItem('rf_user')) {
    openLogin(true);
    return;
  }

  const price = calculatePrice(hotel, search);
  const childrenText = search.children ? `${search.children} (${search.childAges.map(a => `${a}a`).join(', ')})` : '0';
  $('booking-content').innerHTML = `
    <div class="booking-summary">
      <div class="booking-panel">
        <h3>${hotel.name}</h3>
        <div class="info-row"><span>Destino</span><strong>${hotel.city}</strong></div>
        <div class="info-row"><span>Entrada</span><strong>${formatDate(search.checkin)}</strong></div>
        <div class="info-row"><span>Saída</span><strong>${formatDate(search.checkout)}</strong></div>
        <div class="info-row"><span>Diárias calculadas</span><strong>${price.nights}</strong></div>
        <div class="info-row"><span>Adultos</span><strong>${search.adults}</strong></div>
        <div class="info-row"><span>Crianças</span><strong>${childrenText}</strong></div>
        <div class="info-row"><span>Quartos</span><strong>${search.rooms}</strong></div>
        <div class="policy-box"><strong>Política para crianças:</strong><br>0 a 5 anos: sem taxa adicional · 6 a 12 anos: R$ 40 por noite · 13 a 17 anos: R$ 80 por noite.</div>
      </div>
      <div class="booking-panel">
        <h3>Resumo do preço</h3>
        <div class="price-row"><span>Quarto(s)</span><strong>${money(price.roomSubtotal)}</strong></div>
        <div class="price-row"><span>Adultos adicionais</span><strong>${money(price.extraAdults)}</strong></div>
        <div class="price-row"><span>Crianças</span><strong>${money(price.children)}</strong></div>
        <div class="price-row total"><span>Total</span><strong id="booking-total">${money(price.total)}</strong></div>
        <p class="muted">O valor considera as datas, hóspedes e quartos informados na pesquisa.</p>
      </div>
    </div>
    <div class="confirm-row">
      <button class="secondary-btn" data-close="booking-modal" type="button">Voltar</button>
      <button class="primary-btn" id="confirm-booking" type="button">Confirmar reserva</button>
    </div>`;
  $('booking-modal').classList.remove('hidden');
  $('booking-content').querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => $('booking-modal').classList.add('hidden')));
  $('confirm-booking').addEventListener('click', confirmBooking);
}

function confirmBooking() {
  const hotel = state.selectedHotel;
  const search = state.lastSearch;
  const price = calculatePrice(hotel, search);
  const reservations = JSON.parse(localStorage.getItem('rf_reservations') || '[]');
  reservations.unshift({
    id: `RF-${Date.now().toString().slice(-6)}`,
    hotelId: hotel.id,
    hotel: hotel.name,
    city: hotel.city,
    checkin: search.checkin,
    checkout: search.checkout,
    adults: search.adults,
    children: search.children,
    childAges: [...search.childAges],
    rooms: search.rooms > 1 ? 1 : search.rooms,
    confirmedRooms: search.rooms,
    nights: price.nights,
    total: price.total,
    createdAt: new Date().toISOString()
  });
  localStorage.setItem('rf_reservations', JSON.stringify(reservations));
  $('booking-modal').classList.add('hidden');
  showToast(`Reserva confirmada para ${search.rooms} ${search.rooms === 1 ? 'quarto' : 'quartos'}.`);
}

function showReservations() {
  if (!localStorage.getItem('rf_user')) {
    openLogin(false);
    return;
  }
  $('ofertas').classList.add('hidden');
  $('reservations-section').classList.remove('hidden');
  renderReservations();
  $('reservations-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderReservations() {
  const list = $('reservations-list');
  const reservations = JSON.parse(localStorage.getItem('rf_reservations') || '[]');
  if (!reservations.length) {
    list.innerHTML = '<div class="empty-state"><strong>Nenhuma reserva encontrada.</strong><br>Quando você confirmar uma hospedagem, ela aparecerá aqui.</div>';
    return;
  }
  list.innerHTML = reservations.map(r => `
    <article class="reservation-card">
      <div>
        <h3>${r.hotel}</h3>
        <p><strong>Reserva:</strong> ${r.id}</p>
        <p>${formatDate(r.checkin)} → ${formatDate(r.checkout)} · ${r.nights} ${r.nights === 1 ? 'diária' : 'diárias'}</p>
        <p>${r.adults} ${r.adults === 1 ? 'adulto' : 'adultos'} · ${r.children} ${r.children === 1 ? 'criança' : 'crianças'} · <strong>${r.rooms} ${r.rooms === 1 ? 'quarto' : 'quartos'}</strong></p>
      </div>
      <div class="reservation-total"><span class="status-pill">Confirmada</span><strong>${money(r.total)}</strong><small>valor total</small></div>
    </article>`).join('');
}

function showToast(message) {
  $('toast').textContent = message;
  $('toast').classList.remove('hidden');
  setTimeout(() => $('toast').classList.add('hidden'), 2800);
}

function initEvents() {
  $('open-guests').addEventListener('click', () => {
    $('guests-panel').classList.toggle('hidden');
    $('open-guests').setAttribute('aria-expanded', String(!$('guests-panel').classList.contains('hidden')));
  });
  $('close-guests').addEventListener('click', () => {
    $('guests-panel').classList.add('hidden');
    $('open-guests').setAttribute('aria-expanded', 'false');
  });
  document.querySelectorAll('[data-counter]').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.counter;
      const direction = Number(button.dataset.dir);
      const limits = { adults: [1, 8], children: [0, 4], rooms: [1, 4] };
      const next = Math.min(limits[key][1], Math.max(limits[key][0], state[key] + direction));
      state[key] = next;
      if (key === 'children') {
        state.childAges = state.childAges.slice(0, state.children);
        while (state.childAges.length < state.children) state.childAges.push('');
        renderChildAges();
      }
      updateGuestSummary();
    });
  });
  $('search-btn').addEventListener('click', runSearch);
  $('open-login').addEventListener('click', () => openLogin(false));
  $('login-submit').addEventListener('click', performLogin);
  $('login-password').addEventListener('keydown', (event) => { if (event.key === 'Enter') performLogin(); });
  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => $(btn.dataset.close).classList.add('hidden')));
  document.querySelectorAll('.modal').forEach(modal => modal.addEventListener('click', (event) => { if (event.target === modal) modal.classList.add('hidden'); }));
  $('my-reservations-top').addEventListener('click', showReservations);
  $('user-menu').addEventListener('click', showReservations);
  $('back-to-hotels').addEventListener('click', () => {
    $('reservations-section').classList.add('hidden');
    $('ofertas').classList.remove('hidden');
    $('ofertas').scrollIntoView({ behavior: 'smooth' });
  });
  document.querySelectorAll('[data-scroll]').forEach(button => button.addEventListener('click', () => $(button.dataset.scroll).scrollIntoView({ behavior: 'smooth' })));
}

setDefaultDates();
renderHotels();
updateGuestSummary();
renderChildAges();
syncUser();
initEvents();
