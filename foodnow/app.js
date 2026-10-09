const PRODUCTS = [
  {id:'duplo-bacon', name:'Duplo Bacon', category:'Sanduíches', price:24.90, image:'assets/burger-red.svg', desc:'Dois hambúrgueres, queijo, bacon, cebola e molho especial.', customizable:true},
  {id:'crispy-chicken', name:'Crispy Chicken', category:'Sanduíches', price:22.90, image:'assets/chicken.svg', desc:'Frango crocante, alface, queijo e molho cremoso.', customizable:true},
  {id:'classic-cheese', name:'Classic Cheese', category:'Sanduíches', price:18.90, image:'assets/burger-yellow.svg', desc:'Hambúrguer, queijo, picles, cebola, ketchup e mostarda.', customizable:true},
  {id:'batata', name:'Batata Crocante', category:'Acompanhamentos', price:11.90, image:'assets/fries.svg', desc:'Porção média de batatas douradas e crocantes.', customizable:false},
  {id:'cola', name:'Cola 500 ml', category:'Bebidas', price:9.50, image:'assets/drink.svg', desc:'Bebida gaseificada servida gelada.', customizable:false},
  {id:'sundae', name:'Sundae Chocolate', category:'Sobremesas', price:10.90, image:'assets/sundae.svg', desc:'Sorvete cremoso com cobertura de chocolate.', customizable:false}
];

const VALID_LOGIN = { email:'aluno@foodnow.com', password:'Teste123', name:'Cliente QA' };
let cart = JSON.parse(localStorage.getItem('foodnow_cart') || '[]');
let orders = JSON.parse(localStorage.getItem('foodnow_orders') || '[]');
let logged = localStorage.getItem('foodnow_logged') === 'true';
let cachedTotal = Number(localStorage.getItem('foodnow_cached_total') || '0');
let activeCategory = 'Todos';
let customizing = null;

const $ = (id) => document.getElementById(id);
const money = (v) => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

function saveCart(){
  localStorage.setItem('foodnow_cart', JSON.stringify(cart));
  localStorage.setItem('foodnow_cached_total', String(cachedTotal));
}
function trueTotal(){ return cart.reduce((s,i)=>s+i.price*i.qty,0); }
function syncCachedTotal(){ cachedTotal = trueTotal(); saveCart(); }

function renderProducts(){
  const items = activeCategory === 'Todos' ? PRODUCTS : PRODUCTS.filter(p=>p.category===activeCategory);
  $('productGrid').innerHTML = items.map(p=>`
    <article class="product-card" data-product="${p.id}">
      <div class="product-image"><img src="${p.image}" alt="${p.name}"></div>
      <div class="product-body">
        <span class="product-category">${p.category}</span>
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="product-bottom">
          <span class="price">${money(p.price)}</span>
          <button class="add-btn" data-add="${p.id}">${p.customizable?'Personalizar':'Adicionar'}</button>
        </div>
      </div>
    </article>`).join('');
}

function openLayer(id){
  $('overlay').classList.remove('hidden');
  $(id).classList.remove('hidden');
}
function closeLayer(id){
  $(id).classList.add('hidden');
  const anyOpen = [...document.querySelectorAll('.modal,.drawer')].some(el=>!el.classList.contains('hidden'));
  if(!anyOpen) $('overlay').classList.add('hidden');
}
function closeAll(){
  document.querySelectorAll('.modal,.drawer').forEach(el=>el.classList.add('hidden'));
  $('overlay').classList.add('hidden');
}
function toast(msg){
  $('toast').textContent = msg;
  $('toast').classList.remove('hidden');
  setTimeout(()=>$('toast').classList.add('hidden'),2200);
}

function updateHeader(){
  $('cartCount').textContent = cart.reduce((s,i)=>s+i.qty,0);
  // FALHA PLANEJADA PARA O TESTE AUTOMATIZADO:
  // O login é aceito, porém o requisito do cliente exige "Bem-vindo, Cliente QA".
  // A interface exibe apenas "Minha conta", fazendo a validação do Selenium falhar.
  $('welcomeText').textContent = logged ? 'Minha conta' : 'Entrar';
}

function openCustomize(product){
  customizing = product;
  $('customizeContent').innerHTML = `
    <div class="customize-product">
      <img src="${product.image}" alt="${product.name}">
      <div><span class="product-category">${product.category}</span><h2 id="customizeTitle">${product.name}</h2><strong class="price">${money(product.price)}</strong></div>
    </div>
    <p><strong>Personalize seu lanche</strong></p>
    <div class="option-list">
      <label class="option"><input type="checkbox" name="custom" value="Sem cebola"> Sem cebola</label>
      <label class="option"><input type="checkbox" name="custom" value="Sem picles"> Sem picles</label>
      <label class="option"><input type="checkbox" name="custom" value="Bacon extra"> Bacon extra <small>+ ${money(4)}</small></label>
    </div>
    <div class="custom-summary" id="customSummary">Nenhuma alteração selecionada.</div>
    <button class="primary-btn full" id="confirmCustomize">Adicionar ao carrinho</button>`;
  openLayer('customizeModal');
  document.querySelectorAll('input[name="custom"]').forEach(input=>input.addEventListener('change', updateCustomSummary));
  $('confirmCustomize').addEventListener('click', addCustomizedProduct);
}
function updateCustomSummary(){
  const chosen=[...document.querySelectorAll('input[name="custom"]:checked')].map(i=>i.value);
  $('customSummary').textContent = chosen.length ? `Selecionado: ${chosen.join(', ')}` : 'Nenhuma alteração selecionada.';
}
function addCustomizedProduct(){
  const chosen=[...document.querySelectorAll('input[name="custom"]:checked')].map(i=>i.value);
  const extra = chosen.includes('Bacon extra') ? 4 : 0;
  // FALHA PLANEJADA DE INTEGRAÇÃO:
  // As personalizações são lidas aqui, mas propositalmente NÃO são gravadas no item do carrinho.
  addToCart(customizing, extra);
  closeLayer('customizeModal');
  toast(chosen.length ? 'Produto personalizado adicionado.' : 'Produto adicionado.');
}
function addToCart(product, extra=0){
  const existing = cart.find(i=>i.id===product.id && i.price===product.price+extra);
  if(existing) existing.qty++;
  else cart.push({id:product.id,name:product.name,price:product.price+extra,qty:1});
  syncCachedTotal();
  updateHeader();
}

function renderCart(){
  if(!cart.length){
    $('cartItems').innerHTML='<p class="muted">Seu carrinho está vazio.</p>';
  } else {
    $('cartItems').innerHTML=cart.map((item,idx)=>`
      <div class="cart-item">
        <div>
          <h4>${item.name}</h4>
          <p>${money(item.price)} cada</p>
          <p class="muted">Personalização: padrão</p>
        </div>
        <div class="qty-control">
          <button data-minus="${idx}" aria-label="Diminuir quantidade">−</button>
          <strong>${item.qty}</strong>
          <button data-plus="${idx}" aria-label="Aumentar quantidade">+</button>
        </div>
      </div>`).join('');
  }
  $('cartSubtotal').textContent=money(cachedTotal);
  $('cartCount').textContent=cart.reduce((s,i)=>s+i.qty,0);
}

function changeQty(index, delta){
  if(!cart[index]) return;
  if(delta>0){
    cart[index].qty++;
    syncCachedTotal(); // aumentar atualiza corretamente
  } else {
    cart[index].qty--;
    if(cart[index].qty<=0) cart.splice(index,1);
    // FALHA PLANEJADA FUNCIONAL:
    // ao diminuir a quantidade, o contador muda, mas o total em dinheiro NÃO é recalculado.
    saveCart();
  }
  renderCart();
  updateHeader();
}

function checkout(){
  $('checkoutMessage').textContent='';
  const realTotal=trueTotal();
  if(realTotal < 25){
    $('checkoutMessage').textContent='Pedido mínimo de R$ 25,00 para finalizar.';
    return;
  }
  if(!logged){
    $('checkoutMessage').textContent='Entre na sua conta antes de finalizar o pedido.';
    return;
  }
  const order={
    id:'FN'+String(Date.now()).slice(-6),
    date:new Date().toLocaleString('pt-BR'),
    total:realTotal,
    items:cart.map(i=>({...i})),
    status:'Recebido'
  };
  orders.unshift(order);
  localStorage.setItem('foodnow_orders', JSON.stringify(orders));
  cart=[]; cachedTotal=0; saveCart(); updateHeader(); renderCart();
  $('checkoutMessage').style.color='var(--green)';
  $('checkoutMessage').textContent=`Pedido ${order.id} realizado com sucesso!`;
}

function renderOrders(){
  if(!logged){
    $('ordersList').innerHTML='<p class="muted">Entre na sua conta para consultar o histórico.</p>';
    return;
  }
  if(!orders.length){
    $('ordersList').innerHTML='<p class="muted">Você ainda não realizou pedidos.</p>';
    return;
  }
  $('ordersList').innerHTML=orders.map(o=>`
    <article class="order-card">
      <header><h4>Pedido ${o.id}</h4><span class="tag">${o.status}</span></header>
      <p class="muted">${o.date} · ${money(o.total)}</p>
      <ul>${o.items.map(i=>`<li>${i.qty}× ${i.name}</li>`).join('')}</ul>
    </article>`).join('');
}

$('loginForm').addEventListener('submit',(e)=>{
  e.preventDefault();
  const email=$('email').value.trim();
  const password=$('password').value;
  if(email===VALID_LOGIN.email && password===VALID_LOGIN.password){
    logged=true;
    localStorage.setItem('foodnow_logged','true');
    $('loginMessage').style.color='var(--green)';
    $('loginMessage').textContent='Login realizado com sucesso.';
    updateHeader();
    setTimeout(()=>closeLayer('loginModal'),650);
  }else{
    $('loginMessage').style.color='var(--red)';
    $('loginMessage').textContent='E-mail ou senha inválidos.';
  }
});

$('productGrid').addEventListener('click',(e)=>{
  const btn=e.target.closest('[data-add]');
  if(!btn) return;
  const product=PRODUCTS.find(p=>p.id===btn.dataset.add);
  if(product.customizable) openCustomize(product);
  else {addToCart(product); toast('Produto adicionado ao carrinho.');}
});
$('categoryChips').addEventListener('click',(e)=>{
  const btn=e.target.closest('[data-category]'); if(!btn) return;
  document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
  btn.classList.add('active'); activeCategory=btn.dataset.category; renderProducts();
});
$('cartItems').addEventListener('click',(e)=>{
  if(e.target.dataset.plus!==undefined) changeQty(Number(e.target.dataset.plus),1);
  if(e.target.dataset.minus!==undefined) changeQty(Number(e.target.dataset.minus),-1);
});
$('loginButton').addEventListener('click',()=>openLayer('loginModal'));
$('cartButton').addEventListener('click',()=>{renderCart();openLayer('cartDrawer')});
$('ordersButton').addEventListener('click',()=>{renderOrders();openLayer('ordersModal')});
$('checkoutButton').addEventListener('click',checkout);
$('clearCartButton').addEventListener('click',()=>{cart=[];cachedTotal=0;saveCart();renderCart();updateHeader();});
$('overlay').addEventListener('click',closeAll);
document.addEventListener('click',(e)=>{
  const close=e.target.closest('[data-close]'); if(close) closeLayer(close.dataset.close);
  const scroll=e.target.closest('[data-scroll]'); if(scroll) document.getElementById(scroll.dataset.scroll).scrollIntoView({behavior:'smooth'});
});

renderProducts();
if(cart.length && !cachedTotal){syncCachedTotal();}
updateHeader();
