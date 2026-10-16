const vehicles = [
  {
    id: "onix",
    brand: "Chevrolet",
    model: "Onix LT 1.0 Turbo",
    year: 2023,
    km: 38200,
    gear: "Automático",
    fuel: "Flex",
    price: 78900,
    color: "Branco",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Chevrolet_Onix_1.0T_Premier_2023.jpg/960px-Chevrolet_Onix_1.0T_Premier_2023.jpg",
    fallbackImage: "assets/onix.svg"
  },
  {
    id: "civic",
    brand: "Honda",
    model: "Civic EXL 2.0",
    year: 2020,
    km: 64100,
    gear: "Automático",
    fuel: "Flex",
    price: 98900,
    color: "Branco",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/2020_Honda_Civic_1.5_TC_01.jpg/960px-2020_Honda_Civic_1.5_TC_01.jpg",
    fallbackImage: "assets/civic.svg"
  },
  {
    id: "polo",
    brand: "Volkswagen",
    model: "Polo Comfortline 1.0 TSI",
    year: 2022,
    km: 41500,
    gear: "Automático",
    fuel: "Flex",
    price: 81900,
    color: "Prata",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/24/Jeep_Renegade.jpg/960px-Jeep_Renegade.jpg",
    fallbackImage: "assets/tracker.svg"
  },
  {
    id: "argo",
    brand: "Fiat",
    model: "Argo Drive 1.3",
    year: 2021,
    km: 58700,
    gear: "Manual",
    fuel: "Flex",
    price: 67900,
    color: "Branco",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Fiat_Argo.jpg/960px-Fiat_Argo.jpg",
    fallbackImage: "assets/argo.svg"
  },
  {
    id: "fit",
    brand: "Honda",
    model: "Fit EX 1.5",
    year: 2019,
    km: 72400,
    gear: "Automático",
    fuel: "Flex",
    price: 69900,
    color: "Laranja",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/2019_Honda_Fit_rear_NYIAS_2019.jpg/960px-2019_Honda_Fit_rear_NYIAS_2019.jpg",
    fallbackImage: "assets/fit.svg"
  },
  {
    id: "tracker",
    brand: "Chevrolet",
    model: "Tracker Premier 1.2 Turbo",
    year: 2021,
    km: 36700,
    gear: "Automático",
    fuel: "Flex",
    price: 109900,
    color: "Cinza",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Chevrolet_Tracker_1.2_Turbo_LS_2021_%2852664171578%29.jpg/960px-Chevrolet_Tracker_1.2_Turbo_LS_2021_%2852664171578%29.jpg",
    fallbackImage: "assets/tracker.svg"
  }
];

const grid = document.getElementById("vehicleGrid");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");
const searchButton = document.getElementById("searchButton");
const brandFilter = document.getElementById("brandFilter");
const priceFilter = document.getElementById("priceFilter");
const gearFilter = document.getElementById("gearFilter");
const searchModel = document.getElementById("searchModel");
const vehicleInterest = document.getElementById("vehicleInterest");

const formatMoney = value => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const formatKm = value => value.toLocaleString("pt-BR") + " km";

function renderVehicles(list) {
  grid.innerHTML = "";
  emptyState.hidden = list.length !== 0;
  resultCount.textContent = `${list.length} ${list.length === 1 ? "veículo disponível" : "veículos disponíveis"}`;

  list.forEach(vehicle => {
    const article = document.createElement("article");
    article.className = "vehicle-card";
    article.innerHTML = `
      <img class="vehicle-image" src="${vehicle.image}" alt="${vehicle.brand} ${vehicle.model}" onerror="this.onerror=null;this.src='${vehicle.fallbackImage}'">
      <div class="vehicle-body">
        <div class="vehicle-brand">${vehicle.brand.toUpperCase()}</div>
        <h3 class="vehicle-title">${vehicle.model}</h3>
        <div class="vehicle-specs">
          <span class="spec">${vehicle.year}</span>
          <span class="spec">${formatKm(vehicle.km)}</span>
          <span class="spec">${vehicle.gear}</span>
          <span class="spec">${vehicle.fuel}</span>
        </div>
        <div class="vehicle-price-label">A partir de</div>
        <div class="vehicle-price">${formatMoney(vehicle.price)}</div>
        <div class="vehicle-actions">
          <button class="btn btn-outline details-button" type="button" data-id="${vehicle.id}">Ver detalhes</button>
          <button class="btn btn-secondary finance-button" type="button" data-id="${vehicle.id}">Simular</button>
        </div>
      </div>
    `;
    grid.appendChild(article);
  });

  bindVehicleButtons();
}

function bindVehicleButtons() {
  document.querySelectorAll(".details-button").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      if (id === "polo") return;

      const vehicle = vehicles.find(item => item.id === id);
      openDetails(vehicle);
    });
  });

  document.querySelectorAll(".finance-button").forEach(button => {
    button.addEventListener("click", () => {
      const vehicle = vehicles.find(item => item.id === button.dataset.id);
      document.getElementById("vehicleValue").value = vehicle.price;
      document.getElementById("downPayment").value = Math.round(vehicle.price * 0.2);
      updateRemainingPayment();
      document.getElementById("simulador").scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}

function applyFilters() {
  const selectedBrand = brandFilter.value;
  const maxPrice = Number(priceFilter.value);
  const selectedGear = gearFilter.value;
  const term = searchModel.value.trim().toLowerCase();

  const filtered = vehicles.filter(vehicle => {
    const brandMatches = selectedBrand === "todas"
      || vehicle.brand === selectedBrand
  

    const priceMatches = vehicle.price <= maxPrice;
    const gearMatches = selectedGear === "todos" || vehicle.gear === selectedGear;
    const textMatches = !term || `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(term);

    return brandMatches && priceMatches && gearMatches && textMatches;
  });

  renderVehicles(filtered);
}

searchButton.addEventListener("click", () => {
  searchButton.disabled = true;
  searchButton.classList.add("loading");
  searchButton.querySelector(".btn-label").textContent = "Buscando...";
  setTimeout(() => {
    applyFilters();
    searchButton.disabled = false;
    searchButton.classList.remove("loading");
    searchButton.querySelector(".btn-label").textContent = "Buscar veículos";
  }, 300);
});

function openDetails(vehicle) {
  const modal = document.getElementById("detailsModal");
  const content = document.getElementById("modalContent");
  content.innerHTML = `
    <img class="modal-image" src="${vehicle.image}" alt="${vehicle.brand} ${vehicle.model}" onerror="this.onerror=null;this.src='${vehicle.fallbackImage}'">
    <div class="modal-body">
      <span class="vehicle-brand">${vehicle.brand.toUpperCase()}</span>
      <h3 id="modalTitle">${vehicle.model}</h3>
      <div class="modal-price">${formatMoney(vehicle.price)}</div>
      <div class="modal-spec-grid">
        <div><strong>Ano</strong>${vehicle.year}</div>
        <div><strong>Quilometragem</strong>${formatKm(vehicle.km)}</div>
        <div><strong>Câmbio</strong>${vehicle.gear}</div>
        <div><strong>Combustível</strong>${vehicle.fuel}</div>
        <div><strong>Cor</strong>${vehicle.color}</div>
        <div><strong>Localização</strong>Araraquara - SP</div>
        <div><strong>Garantia</strong>3 meses</div>
        <div><strong>Procedência</strong>Seminovo</div>
      </div>
    </div>
  `;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

document.querySelectorAll("[data-close-modal]").forEach(element => {
  element.addEventListener("click", () => {
    const modal = document.getElementById("detailsModal");
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  });
});

const calculateButton = document.getElementById("calculateButton");
const remainingPayment = document.getElementById("remainingPayment");

function updateRemainingPayment() {
  const value = Number(document.getElementById("vehicleValue").value);
  const entry = Number(document.getElementById("downPayment").value);

  if (!value || value <= 0 || entry < 0) {
    remainingPayment.value = "";
    return;
  }

  const remaining = value - entry;
  remainingPayment.value = remaining.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

document.getElementById("vehicleValue").addEventListener("input", updateRemainingPayment);
document.getElementById("downPayment").addEventListener("input", updateRemainingPayment);
calculateButton.addEventListener("click", () => {
  const value = Number(document.getElementById("vehicleValue").value);
  const entry = Number(document.getElementById("downPayment").value);
  const installments = Number(document.getElementById("installments").value);
  const output = document.getElementById("financeResult");

  if (!value || value <= 0 || entry < 0 || installments <= 0) {
    output.textContent = "Informe valores válidos para realizar a simulação.";
    return;
  }
  const financed = value - entry;
  remainingPayment.value = financed.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const installmentValue = financed / installments;

  output.innerHTML = `Valor estimado: <strong>&nbsp;${installments}x de ${installmentValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>`;
});

vehicles.forEach(vehicle => {
  const option = document.createElement("option");
  option.value = vehicle.id;
  option.textContent = `${vehicle.brand} ${vehicle.model}`;
  vehicleInterest.appendChild(option);
});

const interestForm = document.getElementById("interestForm");
interestForm.addEventListener("submit", event => {
  event.preventDefault();
  const formMessage = document.getElementById("formMessage");
  formMessage.className = "form-message success";
  formMessage.textContent = "Interesse enviado com sucesso! Em breve entraremos em contato.";
});

renderVehicles(vehicles);
