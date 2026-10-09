const movies = [
  {id:'orbit', title:'Órbita Final', genre:'Aventura', duration:'2h 08min', rating:'12', price:26.00, cinema:'Cine Center', sessions:['16:10','18:40','21:10'], poster:'assets/orbita.svg'},
  {id:'robot', title:'Meu Vizinho Robô', genre:'Animação', duration:'1h 42min', rating:'L', price:22.00, cinema:'Movie Park', sessions:['14:20','16:30','18:20'], poster:'assets/robo.svg'},
  {id:'plano', title:'Plano B: Férias', genre:'Comédia', duration:'1h 51min', rating:'10', price:24.00, cinema:'Cine Center', sessions:['15:00','19:00','21:20'], poster:'assets/plano.svg'},
  {id:'noite', title:'Depois da Meia-Noite', genre:'Suspense', duration:'1h 58min', rating:'14', price:27.00, cinema:'Movie Park', sessions:['18:10','20:30','22:15'], poster:'assets/noite.svg'},
  {id:'aventura', title:'A Última Expedição', genre:'Aventura', duration:'2h 16min', rating:'12', price:28.00, cinema:'Movie Park', sessions:['16:00','19:20','22:00'], poster:'assets/expedicao.svg'},
  {id:'familia', title:'Família em Dobro', genre:'Comédia', duration:'1h 44min', rating:'L', price:23.00, cinema:'Cine Center', sessions:['13:50','17:10','20:10'], poster:'assets/familia.svg'}
];

const LOGIN_EMAIL = 'aluno@ticketgo.com';
const LOGIN_PASSWORD = 'Teste123';
const WELCOME_TEXT = 'Bem-vindo, Cliente QA';
const MAX_TICKETS = 4;

let currentGenre = 'Todos';
let activeMovie = null;
let purchaseState = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function money(value){
  return value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}

function isLogged(){
  return localStorage.getItem('ticketgoLogged') === 'true';
}

function showOverlay(){ $('#overlay').classList.remove('hidden'); }
function hideOverlayIfClear(){
  if ($$('.modal:not(.hidden)').length === 0) $('#overlay').classList.add('hidden');
}
function openModal(id){ showOverlay(); $('#'+id).classList.remove('hidden'); }
function closeModal(id){ $('#'+id).classList.add('hidden'); hideOverlayIfClear(); }
function toast(text){
  const el=$('#toast'); el.textContent=text; el.classList.remove('hidden');
  setTimeout(()=>el.classList.add('hidden'),2600);
}

function updateAccount(){
  $('#welcomeText').textContent = isLogged() ? WELCOME_TEXT : 'Entrar';
  $('#loginButton').classList.toggle('logged',isLogged());
}

function renderMovies(){
  const cinema = $('#cinemaSelect').value;
  const list = movies.filter(m => (currentGenre==='Todos'||m.genre===currentGenre) && (cinema==='Todos'||m.cinema===cinema));
  $('#movieGrid').innerHTML = list.map(m=>`
    <article class="movie-card" data-movie="${m.id}">
      <div class="poster-wrap"><img src="${m.poster}" alt="Cartaz fictício de ${m.title}"><span class="rating">${m.rating}</span></div>
      <div class="movie-info">
        <h3>${m.title}</h3>
        <div class="movie-meta">${m.genre} • ${m.duration} • ${m.cinema}</div>
        <div class="session-row">${m.sessions.map(s=>`<span class="session-pill">${s}</span>`).join('')}</div>
        <button class="buy-btn" data-buy="${m.id}">Comprar ingresso</button>
      </div>
    </article>`).join('') || '<div class="empty-state">Nenhum filme encontrado com os filtros selecionados.</div>';
  $$('[data-buy]').forEach(btn=>btn.addEventListener('click',()=>openPurchase(btn.dataset.buy)));
}

function openPurchase(id){
  activeMovie = movies.find(m=>m.id===id);
  purchaseState = {session:activeMovie.sessions[0], qty:1, payment:'card'};
  renderPurchase();
  openModal('purchaseModal');
}

function renderPurchase(){
  const m=activeMovie;
  const total=m.price*purchaseState.qty;
  $('#purchaseContent').innerHTML=`
    <div class="purchase-head">
      <img src="${m.poster}" alt="">
      <div><span class="eyebrow dark">COMPRAR INGRESSOS</span><h2 id="purchaseTitle">${m.title}</h2><p>${m.genre} • ${m.duration} • Classificação ${m.rating}</p><p>${m.cinema} • Araraquara - SP</p></div>
    </div>
    <div class="purchase-grid">
      <div class="field-card"><span>Sessão</span><select id="sessionSelect">${m.sessions.map(s=>`<option ${s===purchaseState.session?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="field-card"><span>Quantidade</span><div class="qty-box"><div><strong>Ingressos</strong><div class="helper">Máximo de ${MAX_TICKETS} por sessão</div></div><div class="qty-controls"><button id="qtyMinus" type="button">−</button><strong id="ticketQty">${purchaseState.qty}</strong><button id="qtyPlus" type="button">+</button></div></div></div>
    </div>
    <div class="price-box">
      <div class="price-row"><span>Valor por ingresso</span><strong>${money(m.price)}</strong></div>
      <div class="price-row"><span>Quantidade</span><strong>${purchaseState.qty}</strong></div>
      <div class="price-row total"><span>Total</span><strong id="purchaseTotal">${money(total)}</strong></div>
    </div>
    <h3>Forma de pagamento</h3>
    <div class="payment-options">
      <button class="pay-option ${purchaseState.payment==='card'?'active':''}" data-pay="card"><strong>💳 Cartão</strong><small>Compra aprovada na simulação</small></button>
      <button class="pay-option ${purchaseState.payment==='pix'?'active':''}" data-pay="pix"><strong>◆ PIX</strong><small>Pagamento instantâneo</small></button>
    </div>
    <p class="error-text" id="purchaseError"></p>
    <button class="primary-btn full" id="confirmPurchase">Confirmar compra</button>`;

  $('#sessionSelect').addEventListener('change',e=>purchaseState.session=e.target.value);
  $('#qtyMinus').addEventListener('click',()=>{ if(purchaseState.qty>1){purchaseState.qty--;renderPurchase();} });
  $('#qtyPlus').addEventListener('click',()=>{
    if(purchaseState.qty>=MAX_TICKETS){ $('#purchaseError').textContent=`O limite é de ${MAX_TICKETS} ingressos por sessão.`; return; }
    purchaseState.qty++; renderPurchase();
  });
  $$('[data-pay]').forEach(b=>b.addEventListener('click',()=>{purchaseState.payment=b.dataset.pay;renderPurchase();}));
  $('#confirmPurchase').addEventListener('click',confirmPurchase);
}

function confirmPurchase(){
  if(!isLogged()){
    $('#purchaseError').textContent='Entre na sua conta antes de finalizar a compra.';
    setTimeout(()=>{closeModal('purchaseModal');openModal('loginModal');},700);
    return;
  }

  const ticket={
    id:'TG'+Date.now().toString().slice(-7),
    movie:activeMovie.title,
    cinema:activeMovie.cinema,
    session:purchaseState.session,
    qty:purchaseState.qty,
    total:activeMovie.price*purchaseState.qty,
    payment:purchaseState.payment==='pix'?'PIX':'Cartão',
    date:'Hoje'
  };

  // FALHA PLANEJADA DE INTEGRAÇÃO:
  // quando o pagamento é PIX, a compra é aprovada e confirmada na tela,
  // mas o ingresso NÃO é gravado em "Meus ingressos".
  if(purchaseState.payment !== 'pix'){
    const tickets=JSON.parse(localStorage.getItem('ticketgoTickets')||'[]');
    tickets.unshift(ticket);
    localStorage.setItem('ticketgoTickets',JSON.stringify(tickets));
  }

  $('#purchaseContent').innerHTML=`
    <div class="success-panel">
      <div class="success-icon">✓</div>
      <span class="eyebrow dark">PAGAMENTO APROVADO</span>
      <h2>Compra confirmada!</h2>
      <p>Seu pedido <strong>${ticket.id}</strong> foi aprovado e o ingresso foi emitido.</p>
      <p><strong>${ticket.movie}</strong> • ${ticket.session} • ${ticket.qty} ingresso(s)</p>
      <button class="primary-btn" id="goTickets">Ver meus ingressos</button>
    </div>`;
  $('#goTickets').addEventListener('click',()=>{closeModal('purchaseModal');openTickets();});
}

function openTickets(){
  if(!isLogged()){ openModal('loginModal'); $('#loginMessage').textContent='Entre na sua conta para consultar seus ingressos.'; return; }
  openModal('ticketsModal');

  // FALHA PLANEJADA NÃO FUNCIONAL:
  // requisito pede resposta em até 2 segundos; esta tela demora 5 segundos.
  $('#ticketsList').innerHTML=`<div class="loading-box"><div><div class="spinner"></div><strong>Carregando seus ingressos...</strong><p>Aguarde um instante.</p></div></div>`;
  setTimeout(renderTickets,5000);
}

function renderTickets(){
  const tickets=JSON.parse(localStorage.getItem('ticketgoTickets')||'[]');
  if(!tickets.length){
    $('#ticketsList').innerHTML='<div class="empty-state"><strong>Nenhum ingresso encontrado.</strong><br>As compras aprovadas devem aparecer nesta área.</div>';
    return;
  }
  $('#ticketsList').innerHTML=tickets.map(t=>`
    <article class="ticket-card">
      <div class="ticket-top"><div><h3>${t.movie}</h3><small>${t.cinema} • Araraquara - SP</small></div><strong>${t.id}</strong></div>
      <div class="ticket-body">
        <div><span>Sessão</span><strong>${t.date}, ${t.session}</strong></div>
        <div><span>Ingressos</span><strong>${t.qty}</strong></div>
        <div><span>Total</span><strong>${money(t.total)}</strong></div>
        <div><span>Pagamento</span><strong>${t.payment}</strong></div>
      </div>
    </article>`).join('');
}

$('#loginButton').addEventListener('click',()=>{
  if(isLogged()){
    if(confirm('Deseja sair da conta?')){localStorage.removeItem('ticketgoLogged');updateAccount();toast('Você saiu da conta.');}
  } else openModal('loginModal');
});

$('#loginForm').addEventListener('submit',e=>{
  e.preventDefault();
  const email=$('#email').value.trim();
  const password=$('#password').value;
  if(email===LOGIN_EMAIL && password===LOGIN_PASSWORD){
    localStorage.setItem('ticketgoLogged','true');
    $('#loginMessage').textContent='';
    updateAccount();
    closeModal('loginModal');
    toast('Login realizado com sucesso.');
  } else {
    $('#loginMessage').textContent='E-mail ou senha inválidos.';
  }
});

$('#ticketsButton').addEventListener('click',openTickets);
$('#filterButton').addEventListener('click',()=>{renderMovies();toast('Programação atualizada.');});
$('#cinemaSelect').addEventListener('change',renderMovies);

$$('[data-close]').forEach(btn=>btn.addEventListener('click',()=>closeModal(btn.dataset.close)));
$('#overlay').addEventListener('click',()=>{$$('.modal:not(.hidden)').forEach(m=>m.classList.add('hidden'));$('#overlay').classList.add('hidden');});
$$('[data-scroll]').forEach(btn=>btn.addEventListener('click',()=>document.getElementById(btn.dataset.scroll).scrollIntoView({behavior:'smooth'})));
$$('[data-genre]').forEach(btn=>btn.addEventListener('click',()=>{
  currentGenre=btn.dataset.genre;
  $$('[data-genre]').forEach(b=>b.classList.toggle('active',b===btn));
  renderMovies();
}));

updateAccount();
renderMovies();
