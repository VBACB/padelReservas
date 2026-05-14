const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
let currentStep = 1;
let calYear, calMonth;
let selectedDate = null;
let selectedTime = null;
let selectedCount = 4;
let reservations = [];
let pendingReservation = null;
let notifications = [];

window.onload = function () {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  renderCalendar();

  setTimeout(() => {
    addNotification("free_slot", { hora: "18:00h", hasta: "20:00h" });
  }, 2000);
};

function openModal() {
  document.getElementById("overlay").classList.add("active");
  document.body.style.overflow = "hidden";
  resetForm();
}

function closeModal() {
  document.getElementById("overlay").classList.remove("active");
  document.body.style.overflow = "";
}

function goToStep(n) {
  currentStep = n;
  [1, 2, 3].forEach((i) => {
    document.getElementById(`step${i}`).classList.toggle("active", i === n);
    const dot = document.getElementById(`dot${i}`);
    dot.className =
      i < n ? "step-dot done" : i === n ? "step-dot active" : "step-dot";
  });
  document.getElementById("modal").scrollTop = 0;
}

function goToStep1() {
  goToStep(1);
}

function goToStep2() {
  if (!selectedDate || !selectedTime) return;
  goToStep(2);
  document.getElementById("modalTitle").textContent =
    `${selectedDate} · ${selectedTime}`;
  selectCount(selectedCount);
}

function goToStep3() {
  const inputs = document.querySelectorAll("#playerInputs .player-name-input");
  let valid = true;
  inputs.forEach((inp) => {
    const val = inp.value.trim();
    if (val.length < 2) {
      inp.classList.add("input-error");
      valid = false;
    } else {
      inp.classList.remove("input-error");
    }
  });

  if (!valid) {
    document.getElementById("nameErrorMsg").style.display = "block";
    return;
  }

  document.getElementById("nameErrorMsg").style.display = "none";
  buildTicket();
  goToStep(3);
}

function renderCalendar() {
  const label = document.getElementById("calMonthLabel");
  label.textContent = `${MONTHS[calMonth]} ${calYear}`;
  const grid = document.getElementById("calGrid");
  grid.innerHTML = "";

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < firstDay; i++) {
    grid.appendChild(
      Object.assign(document.createElement("div"), {
        className: "cal-day disabled",
      }),
    );
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(calYear, calMonth, d);
    const dateStr = `${d} ${MONTHS[calMonth]} ${calYear}`;
    const el = document.createElement("div");
    el.textContent = d;
    el.className = "cal-day";
    if (date < today) el.classList.add("disabled");
    else {
      if (selectedDate === dateStr) el.classList.add("selected");
      el.onclick = () => {
        selectedDate = dateStr;
        renderCalendar();
        checkStep1Ready();
      };
    }
    grid.appendChild(el);
  }
}

function prevMonth() {
  calMonth--;
  if (calMonth < 0) {
    calMonth = 11;
    calYear--;
  }
  renderCalendar();
}
function nextMonth() {
  calMonth++;
  if (calMonth > 11) {
    calMonth = 0;
    calYear++;
  }
  renderCalendar();
}

function selectTime(btn, time) {
  selectedTime = time;
  document
    .querySelectorAll(".time-slot")
    .forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
  checkStep1Ready();
}

function checkStep1Ready() {
  const btn = document.getElementById("btnStep1Next");
  const ready = selectedDate && selectedTime;
  btn.disabled = !ready;
  btn.style.opacity = ready ? "1" : "0.4";
}

function selectCount(n) {
  selectedCount = n;
  document.getElementById("opt2").classList.toggle("selected", n === 2);
  document.getElementById("opt4").classList.toggle("selected", n === 4);
  renderPlayerInputs();
}

function renderPlayerInputs() {
  const container = document.getElementById("playerInputs");
  container.innerHTML = "";
  for (let i = 1; i <= 4; i++) {
    const row = document.createElement("div");
    row.className = "player-input-row";
    const isVacant = i > selectedCount;

    row.innerHTML = `
                    <div class="player-avatar ${isVacant ? "vacant" : ""}">${isVacant ? "?" : i}</div>
                    ${
                      isVacant
                        ? '<div style="color:#444; font-size:0.8rem">Plaza abierta para otros jugadores</div>'
                        : `<input type="text" class="player-name-input" placeholder="Nombre jugador ${i}" maxlength="20" oninput="validateNameInput(this)">`
                    }
                `;
    container.appendChild(row);
  }
}

function validateNameInput(input) {
  input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
}

function buildTicket() {
  const names = Array.from(document.querySelectorAll(".player-name-input")).map(
    (i) => i.value,
  );
  const code = "PLY-" + Math.floor(1000 + Math.random() * 9000);
  pendingReservation = {
    date: selectedDate,
    time: selectedTime,
    count: selectedCount,
    names,
    code,
  };

  let playersHtml = "";
  for (let i = 0; i < 4; i++) {
    const name =
      i < selectedCount ? names[i] || "Jugador " + (i + 1) : "Plaza Vacante";
    playersHtml += `<div class="ticket-player-row"><span class="num ${i >= selectedCount ? "vac" : ""}">${i + 1}</span><span>${name}</span></div>`;
  }

  document.getElementById("ticketPreview").innerHTML = `
                <div class="ticket-code">${code}</div>
                <div class="ticket-date">📅 ${selectedDate} · ${selectedTime}</div>
                <div style="text-align:left">${playersHtml}</div>
            `;
}

function finishReservation() {
  reservations.push(pendingReservation);
  renderReservations();
  closeModal();
  if (pendingReservation.count < 4) {
    const plazas = 4 - pendingReservation.count;
    addNotification("vacante", {
      fecha: pendingReservation.date,
      hora: pendingReservation.time,
      plazas,
    });
  }
}

function renderReservations() {
  const grid = document.getElementById("reservasGrid");
  grid.innerHTML = "";
  document.getElementById("listTitle").style.display = reservations.length
    ? "block"
    : "none";

  reservations.forEach((res) => {
    const card = document.createElement("div");
    card.className = "reserva-card";
    let slots = "";
    for (let i = 0; i < 4; i++)
      slots += `<div class="player-slot ${i < res.count ? "filled" : "empty"}">${i < res.count ? "✓" : "?"}</div>`;

    card.innerHTML = `
                    <div class="card-date">${res.date}</div>
                    <div style="font-size:0.7rem; color:var(--texto-gris)">${res.time} · ${res.code}</div>
                    <div class="card-players">${slots}</div>
                    ${res.count < 4 ? '<div class="slot-vacante-badge">⚡ Hay plazas libres</div>' : ""}
                `;
    grid.appendChild(card);
  });
}



function toggleNotifPanel() {
  const panel = document.getElementById("notifPanel");
  const backdrop = document.getElementById("notifBackdrop");
  const isOpen = panel.classList.contains("active");

  if (isOpen) {
    panel.classList.remove("active");
    backdrop.classList.remove("active");
  } else {
    panel.classList.add("active");
    backdrop.classList.add("active");
    notifications.forEach((n) => (n.read = true));
    updateNotifBadge();
  }
}

function closeNotifPanel() {
  document.getElementById("notifPanel").classList.remove("active");
  document.getElementById("notifBackdrop").classList.remove("active");
}

function addNotification(type, data) {
  const id = Date.now();
  const n = { id, type, data, read: false, time: "Ahora" };
  notifications.unshift(n);
  renderNotifs();
  updateNotifBadge();
}

function renderNotifs() {
  const list = document.getElementById("notifList");
  const empty = document.getElementById("notifEmpty");

  const items = list.querySelectorAll(".notif-item");
  items.forEach((i) => i.remove());

  if (notifications.length === 0) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";
  notifications.forEach((n) => {
    const item = document.createElement("div");
    const isVacante = n.type === "vacante" || n.type === "free_slot";
    item.className = `notif-item${isVacante ? " vacante" : ""}${n.read ? " read" : ""}`;

    let body = "";
    if (n.type === "vacante") {
      const plural = n.data.plazas > 1 ? "plazas libres" : "plaza libre";
      body = `
        <div class="notif-icon-wrap amarillo">⚡</div>
        <div class="notif-content">
          <div class="notif-title">PLAZA VACANTE</div>
          <div class="notif-body"><span>${n.data.plazas} ${plural}</span> en la partida del <span>${n.data.fecha}</span> a las <span>${n.data.hora}</span>.</div>
          <div class="notif-time">${n.time}</div>
        </div>`;
    } else {
      // free_slot (notificación de demo inicial)
      body = `
        <div class="notif-icon-wrap amarillo">⚡</div>
        <div class="notif-content">
          <div class="notif-title">PLAZA VACANTE</div>
          <div class="notif-body">Plaza disponible hoy de <span>${n.data.hora}</span> a <span>${n.data.hasta}</span>.</div>
          <div class="notif-time">${n.time}</div>
        </div>`;
    }

    item.innerHTML = body;
    list.appendChild(item);
  });
}

function updateNotifBadge() {
  const unread = notifications.filter((n) => !n.read).length;
  const badge = document.getElementById("notifCount");
  badge.style.display = unread > 0 ? "flex" : "none";
  badge.textContent = unread;
}

function clearAllNotifs() {
  notifications = [];
  renderNotifs();
  updateNotifBadge();
}

function resetForm() {
  selectedDate = null;
  selectedTime = null;
  selectedCount = 4;
  goToStep(1);
  renderCalendar();
  document
    .querySelectorAll(".time-slot")
    .forEach((t) => t.classList.remove("selected"));
  checkStep1Ready();
}

// debo realizar un function descargar pdf--- fecha de trabajo 18/05/2026
