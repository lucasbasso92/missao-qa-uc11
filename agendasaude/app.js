const LOGIN_EMAIL = 'aluno@agendasaude.com';
const LOGIN_PASSWORD = 'Teste123';
const WELCOME_TEXT = 'Bem-vindo, Cliente QA';

const units = ['Centro - Araraquara', 'Vila Xavier - Araraquara', 'Centro - Américo Brasiliense'];
const specialties = [
  {name:'Clínico Geral', icon:'🩺', desc:'Avaliação inicial e acompanhamento da saúde.', price:60, doctors:['Dra. Marina Lopes','Dr. Paulo Reis']},
  {name:'Cardiologia', icon:'♡', desc:'Cuidado e prevenção da saúde cardiovascular.', price:120, doctors:['Dra. Ana Martins','Dr. Felipe Souza']},
  {name:'Dermatologia', icon:'✦', desc:'Avaliação da pele, cabelos e unhas.', price:120, doctors:['Dra. Camila Nunes','Dr. André Pires']},
  {name:'Oftalmologia', icon:'◉', desc:'Cuidados com visão e saúde dos olhos.', price:120, doctors:['Dra. Helena Rocha','Dr. Bruno Melo']},
  {name:'Ortopedia', icon:'✚', desc:'Ossos, articulações e sistema locomotor.', price:120, doctors:['Dr. Ricardo Lima','Dra. Paula Mendes']},
  {name:'Pediatria', icon:'☀', desc:'Acompanhamento de crianças e adolescentes.', price:120, doctors:['Dra. Júlia Moraes','Dr. Caio Neves']},
  {name:'Ginecologia', icon:'✿', desc:'Saúde e prevenção para a mulher.', price:120, doctors:['Dra. Laura Campos','Dra. Renata Vieira']},
  {name:'Odontologia', icon:'◇', desc:'Avaliação e cuidado completo do sorriso.', price:80, doctors:['Dra. Sofia Alves','Dr. Lucas Prado']}
];
const times = ['08:00','09:00','10:30','13:30','14:30','16:00','17:00'];
let selectedTime = '';
let preselectedSpecialty = 'Clínico Geral';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function isLogged(){ return localStorage.getItem('agendaSaudeLogged') === 'true'; }
function getAppointments(){ return JSON.parse(localStorage.getItem('agendaSaudeAppointments') || '[]'); }
function saveAppointments(items){ localStorage.setItem('agendaSaudeAppointments', JSON.stringify(items)); }
function money(v){ return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function showOverlay(){ $('#overlay').classList.remove('hidden'); }
function hideOverlay(){ if($$('.modal:not(.hidden)').length===0) $('#overlay').classList.add('hidden'); }
function openModal(id){ showOverlay(); $('#'+id).classList.remove('hidden'); }
function closeModal(id){ $('#'+id).classList.add('hidden'); hideOverlay(); }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),2600); }

function updateAccount(){
  $('#welcomeText').textContent = isLogged() ? WELCOME_TEXT : 'Portal do paciente';
}

function renderSpecialties(){
  $('#specialtiesGrid').innerHTML = specialties.map(s=>`<article class="specialty-card">
    <div class="specialty-icon">${s.icon}</div><h3>${s.name}</h3><p>${s.desc}</p>
    <div class="price">Consulta particular a partir de <strong>${money(s.price)}</strong></div>
    <button data-specialty="${s.name}">AGENDAR CONSULTA →</button>
  </article>`).join('');
  $$('[data-specialty]').forEach(b=>b.addEventListener('click',()=>openBooking(b.dataset.specialty)));
}

function nextDate(days=1){
  const d=new Date(); d.setDate(d.getDate()+days);
  return d.toISOString().slice(0,10);
}

function populateBooking(){
  $('#unitSelect').innerHTML=units.map(u=>`<option>${u}</option>`).join('');
  $('#specialtySelect').innerHTML=specialties.map(s=>`<option ${s.name===preselectedSpecialty?'selected':''}>${s.name}</option>`).join('');
  $('#dateInput').min = new Date().toISOString().slice(0,10);
  if(!$('#dateInput').value) $('#dateInput').value=nextDate(1);
  updateDoctors();
  renderSlots();
  updateSummary();
}

function updateDoctors(){
  const spec=specialties.find(s=>s.name===$('#specialtySelect').value);
  $('#doctorSelect').innerHTML=spec.doctors.map(d=>`<option>${d}</option>`).join('');
}

function isSunday(dateStr){
  if(!dateStr) return false;
  return new Date(dateStr+'T12:00:00').getDay()===0;
}

function renderSlots(){
  selectedTime='';
  const date=$('#dateInput').value;
  const specialty=$('#specialtySelect').value;
  const doctor=$('#doctorSelect').value;
  const appointments=getAppointments();
  $('#bookingError').textContent='';

  if(isSunday(date)){
    $('#slots').innerHTML='<span class="muted">Não há atendimento aos domingos.</span>';
    $('#bookingError').textContent='Escolha uma data de segunda a sábado.';
    updateSummary();
    return;
  }

  $('#slots').innerHTML=times.map(time=>{
    const occupied=appointments.some(a=>a.date===date && a.time===time && a.specialty===specialty && a.doctor===doctor);
    return `<button type="button" class="slot ${occupied?'disabled':''}" data-time="${time}" ${occupied?'disabled':''}>${time}</button>`;
  }).join('');

  $$('.slot:not(.disabled)').forEach(btn=>btn.addEventListener('click',()=>{
    selectedTime=btn.dataset.time;
    $$('.slot').forEach(s=>s.classList.toggle('active',s===btn));
    updateSummary();
  }));
  updateSummary();
}

function updateSummary(){
  const spec=specialties.find(s=>s.name===$('#specialtySelect').value);
  $('#summaryContent').innerHTML=`
    <strong>${spec.name}</strong><br>
    ${$('#doctorSelect').value || 'Selecione o profissional'}<br>
    ${$('#unitSelect').value || ''}<br>
    ${$('#dateInput').value ? new Date($('#dateInput').value+'T12:00:00').toLocaleDateString('pt-BR') : 'Selecione a data'} ${selectedTime? '• '+selectedTime : ''}<br><br>
    Valor particular: <strong>${money(spec.price)}</strong>`;
}

function openBooking(specialty='Clínico Geral'){
  if(!isLogged()){
    openModal('loginModal');
    $('#loginMessage').textContent='Entre na sua conta para realizar um agendamento.';
    return;
  }
  preselectedSpecialty=specialty;
  openModal('bookingModal');
  populateBooking();
}

function confirmBooking(){
  const date=$('#dateInput').value;
  const specialty=$('#specialtySelect').value;
  const doctor=$('#doctorSelect').value;
  const unit=$('#unitSelect').value;
  const spec=specialties.find(s=>s.name===specialty);
  $('#bookingError').textContent='';

  if(isSunday(date)){
    $('#bookingError').textContent='Não é possível agendar consultas aos domingos.';
    return;
  }
  if(!selectedTime){
    $('#bookingError').textContent='Escolha um horário para continuar.';
    return;
  }

  const appointments=getAppointments();
  const exactDuplicate=appointments.some(a=>a.status==='Ativa' && a.date===date && a.time===selectedTime && a.specialty===specialty);
  if(exactDuplicate){
    $('#bookingError').textContent='Você já possui uma consulta dessa especialidade neste horário.';
    return;
  }

  const item={
    id:'AS'+Date.now().toString().slice(-7),
    unit, specialty, doctor, date, time:selectedTime,
    price:spec.price, status:'Ativa'
  };
  appointments.unshift(item); saveAppointments(appointments);
  closeModal('bookingModal');
  toast('Consulta agendada com sucesso!');
  openAppointments();
}

function renderAppointments(){
  const items=getAppointments();
  if(!items.length){
    $('#appointmentsList').innerHTML='<div class="empty-state"><strong>Nenhuma consulta agendada.</strong><br>Seus próximos atendimentos aparecerão aqui.</div>';
    return;
  }
  $('#appointmentsList').innerHTML=items.map(a=>`<article class="appointment-card ${a.status==='Cancelada'?'cancelled':''}">
    <div><h3>${a.specialty}</h3><div class="appointment-meta">${a.doctor}<br>${a.unit}<br>${new Date(a.date+'T12:00:00').toLocaleDateString('pt-BR')} • ${a.time} • ${money(a.price)}</div><span class="status ${a.status==='Cancelada'?'cancelled':''}">${a.status}</span></div>
    ${a.status==='Ativa'?`<button class="cancel-btn" data-cancel="${a.id}">Cancelar consulta</button>`:''}
  </article>`).join('');
  $$('[data-cancel]').forEach(b=>b.addEventListener('click',()=>cancelAppointment(b.dataset.cancel)));
}

function cancelAppointment(id){
  const items=getAppointments();
  const index=items.findIndex(a=>a.id===id);
  if(index>=0){ items[index].status='Cancelada'; saveAppointments(items); renderAppointments(); toast('Consulta cancelada.'); }
}

function openAppointments(){
  if(!isLogged()){
    openModal('loginModal'); $('#loginMessage').textContent='Entre na sua conta para consultar seus agendamentos.'; return;
  }
  renderAppointments(); openModal('appointmentsModal');
}

$('#loginButton').addEventListener('click',()=>{
  if(isLogged()){
    if(confirm('Deseja sair da sua conta?')){localStorage.removeItem('agendaSaudeLogged');updateAccount();toast('Você saiu da conta.');}
  }else openModal('loginModal');
});

$('#loginForm').addEventListener('submit',e=>{
  e.preventDefault();
  if($('#email').value.trim()===LOGIN_EMAIL && $('#password').value===LOGIN_PASSWORD){
    localStorage.setItem('agendaSaudeLogged','true');
    $('#loginMessage').textContent='';
    updateAccount(); closeModal('loginModal'); toast('Login realizado com sucesso.');
  }else $('#loginMessage').textContent='E-mail ou senha inválidos.';
});

$('#heroScheduleButton').addEventListener('click',()=>openBooking());
$('#scheduleTopButton').addEventListener('click',()=>openBooking());
$('#appointmentsButton').addEventListener('click',openAppointments);
$('#specialtySelect').addEventListener('change',()=>{updateDoctors();renderSlots();});
$('#doctorSelect').addEventListener('change',renderSlots);
$('#dateInput').addEventListener('change',renderSlots);
$('#unitSelect').addEventListener('change',updateSummary);
$('#confirmBooking').addEventListener('click',confirmBooking);
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
$('#overlay').addEventListener('click',()=>{$$('.modal:not(.hidden)').forEach(m=>m.classList.add('hidden'));$('#overlay').classList.add('hidden');});
$$('[data-scroll]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.scroll).scrollIntoView({behavior:'smooth'})));

renderSpecialties();
updateAccount();
