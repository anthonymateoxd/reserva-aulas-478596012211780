// Datos iniciales
const classrooms = [
  { id: 'A101', name: 'A101', capacity: 30 },
  { id: 'A102', name: 'A102', capacity: 25 },
  { id: 'B201', name: 'B201', capacity: 40 },
  { id: 'B202', name: 'B202', capacity: 35 },
  { id: 'C301', name: 'C301', capacity: 50 },
];

const timeSlots = [
  '07:00 - 08:00',
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
  '18:00 - 19:00',
];

// Inicializar localStorage si está vacío
if (!localStorage.getItem('users')) {
  localStorage.setItem('users', JSON.stringify([]));
}

if (!localStorage.getItem('reservations')) {
  localStorage.setItem('reservations', JSON.stringify([]));
}

// Elementos del DOM
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const adminTab = document.getElementById('admin-tab');
const logoutTab = document.getElementById('logout-tab');

// Variables de estado
let currentUser = null;
let selectedDate = '';
let selectedClassroom = '';
let selectedTimeSlot = '';

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
logoutTab.addEventListener('click', handleLogout);
document
  .getElementById('check-availability')
  .addEventListener('click', checkAvailability);
document
  .getElementById('submit-reservation')
  .addEventListener('click', submitReservation);

// Configurar tabs
tabs.forEach(tab => {
  if (tab.id !== 'logout-tab') {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  }
});

// Funciones
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const users = JSON.parse(localStorage.getItem('users'));
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    currentUser = user;
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');

    // Mostrar u ocultar pestaña de admin
    if (currentUser.email === 'admin@miumg.edu.gt') {
      adminTab.classList.remove('hidden');
    } else {
      adminTab.classList.add('hidden');
    }

    // Cargar datos del usuario
    loadProfile();
    loadUserReservations();

    if (currentUser.email === 'admin@miumg.edu.gt') {
      loadAdminData();
    }

    showAlert('success', 'Inicio de sesión exitoso');
  } else {
    showAlert('danger', 'Correo o contraseña incorrectos');
  }
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const id = document.getElementById('register-id').value;

  // Validar correo institucional
  if (!email.endsWith('@miumg.edu.gt')) {
    showAlert(
      'danger',
      'Solo se permiten correos institucionales (@miumg.edu.gt)'
    );
    return;
  }

  const users = JSON.parse(localStorage.getItem('users'));

  // Verificar si el usuario ya existe
  if (users.some(u => u.email === email)) {
    showAlert('danger', 'Este correo ya está registrado');
    return;
  }

  // Crear nuevo usuario
  const newUser = {
    name,
    email,
    password,
    id,
    isAdmin: email === 'admin@miumg.edu.gt', // Solo este correo será admin
  };

  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));

  showAlert('success', 'Registro exitoso. Ahora puedes iniciar sesión.');
  registerForm.reset();
}

function handleLogout() {
  currentUser = null;
  authSection.classList.remove('hidden');
  appSection.classList.add('hidden');
  document.getElementById('login-form').reset();
  switchTab('availability');
}

function switchTab(tabId) {
  // Desactivar todas las pestañas y contenidos
  tabs.forEach(tab => tab.classList.remove('active'));
  tabContents.forEach(content => content.classList.remove('active'));

  // Activar la pestaña seleccionada
  document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
  document.getElementById(tabId).classList.add('active');

  // Cargar datos si es necesario
  if (tabId === 'my-reservations') {
    loadUserReservations();
  } else if (tabId === 'admin' && currentUser?.isAdmin) {
    loadAdminData();
  }
}

function checkAvailability() {
  const date = document.getElementById('reservation-date').value;
  const classroom = document.getElementById('classroom-select').value;

  if (!date) {
    showAlert('danger', 'Por favor selecciona una fecha');
    return;
  }

  selectedDate = date;
  selectedClassroom = classroom;

  // Mostrar la información seleccionada
  document.getElementById('selected-date').textContent = formatDate(date);
  document.getElementById('selected-classroom').textContent = classroom;

  // Generar los horarios
  generateTimeSlots(date, classroom);

  // Mostrar resultados
  document.getElementById('availability-result').classList.remove('hidden');
}

function generateTimeSlots(date, classroom) {
  const timeSlotsContainer = document.getElementById('time-slots');
  timeSlotsContainer.innerHTML = '';

  // Obtener reservas existentes para esta aula y fecha
  const reservations = JSON.parse(localStorage.getItem('reservations'));
  const dayReservations = reservations.filter(
    r => r.date === date && r.classroom === classroom && r.status !== 'rejected'
  );

  timeSlots.forEach(slot => {
    const isBooked = dayReservations.some(
      r => r.timeSlot === slot && r.status === 'approved'
    );
    const isPending = dayReservations.some(
      r => r.timeSlot === slot && r.status === 'pending'
    );

    const timeSlotElement = document.createElement('div');
    timeSlotElement.className = `time-slot ${
      isBooked ? 'booked' : 'available'
    }`;
    timeSlotElement.textContent = slot;

    if (isPending) {
      timeSlotElement.textContent += ' (pendiente)';
      timeSlotElement.style.backgroundColor = '#fff3cd';
    }

    if (!isBooked && !isPending) {
      timeSlotElement.addEventListener('click', () =>
        selectTimeSlot(slot, timeSlotElement)
      );
    }

    timeSlotsContainer.appendChild(timeSlotElement);
  });
}

function selectTimeSlot(slot, element) {
  // Deseleccionar cualquier slot previo
  document.querySelectorAll('.time-slot').forEach(el => {
    el.classList.remove('selected');
  });

  // Seleccionar el nuevo slot
  element.classList.add('selected');
  selectedTimeSlot = slot;

  // Mostrar el formulario de reserva
  document.getElementById('reservation-form').classList.remove('hidden');
}

function submitReservation() {
  const purpose = document.getElementById('reservation-purpose').value;
  const details = document.getElementById('reservation-details').value;

  if (!selectedTimeSlot) {
    showAlert('danger', 'Por favor selecciona un horario');
    return;
  }

  const newReservation = {
    id: Date.now(),
    studentId: currentUser.id,
    studentName: currentUser.name,
    studentEmail: currentUser.email,
    classroom: selectedClassroom,
    date: selectedDate,
    timeSlot: selectedTimeSlot,
    purpose,
    details,
    status: currentUser.isAdmin ? 'approved' : 'pending',
    createdAt: new Date().toISOString(),
  };

  const reservations = JSON.parse(localStorage.getItem('reservations'));
  reservations.push(newReservation);
  localStorage.setItem('reservations', JSON.stringify(reservations));

  showAlert(
    'success',
    currentUser.isAdmin
      ? 'Reserva aprobada exitosamente'
      : 'Solicitud de reserva enviada. Espera aprobación del administrador.'
  );

  // Resetear el formulario
  document.getElementById('reservation-form').classList.add('hidden');
  document.getElementById('reservation-purpose').value = 'Proyecto';
  document.getElementById('reservation-details').value = '';
  selectedTimeSlot = '';

  // Actualizar disponibilidad
  generateTimeSlots(selectedDate, selectedClassroom);

  // Actualizar lista de reservas del usuario
  loadUserReservations();
}

function loadUserReservations() {
  if (!currentUser) return;

  const reservations = JSON.parse(localStorage.getItem('reservations'));
  const userReservations = reservations.filter(
    r => r.studentEmail === currentUser.email
  );

  const tableBody = document.getElementById('reservations-table-body');
  tableBody.innerHTML = '';

  userReservations.forEach(reservation => {
    const row = document.createElement('tr');

    row.innerHTML = `
            <td>${reservation.classroom}</td>
            <td>${formatDate(reservation.date)}</td>
            <td>${reservation.timeSlot}</td>
            <td>${reservation.purpose}</td>
            <td class="status-${reservation.status}">${getStatusText(
      reservation.status
    )}</td>
            <td>
                ${
                  reservation.status === 'pending'
                    ? `<button class="btn-danger cancel-reservation" data-id="${reservation.id}">Cancelar</button>`
                    : reservation.status === 'approved'
                    ? `<button class="btn-danger cancel-reservation" data-id="${reservation.id}">Cancelar</button>`
                    : ''
                }
            </td>
        `;

    tableBody.appendChild(row);
  });

  // Agregar event listeners a los botones de cancelar
  document.querySelectorAll('.cancel-reservation').forEach(button => {
    button.addEventListener('click', () =>
      cancelReservation(button.dataset.id)
    );
  });
}

function loadAdminData() {
  if (!currentUser?.isAdmin) return;

  // Cargar reservas pendientes
  const reservations = JSON.parse(localStorage.getItem('reservations'));
  const pendingReservations = reservations.filter(r => r.status === 'pending');

  const pendingBody = document.getElementById('pending-reservations-body');
  pendingBody.innerHTML = '';

  pendingReservations.forEach(reservation => {
    const row = document.createElement('tr');

    row.innerHTML = `
            <td>${reservation.studentName} (${reservation.studentEmail})</td>
            <td>${reservation.classroom}</td>
            <td>${formatDate(reservation.date)}</td>
            <td>${reservation.timeSlot}</td>
            <td>${reservation.purpose}</td>
            <td>
                <button class="btn-success approve-reservation" data-id="${
                  reservation.id
                }">Aprobar</button>
                <button class="btn-danger reject-reservation" data-id="${
                  reservation.id
                }">Rechazar</button>
            </td>
        `;

    pendingBody.appendChild(row);
  });

  // Agregar event listeners a los botones de aprobar/rechazar
  document.querySelectorAll('.approve-reservation').forEach(button => {
    button.addEventListener('click', () =>
      updateReservationStatus(button.dataset.id, 'approved')
    );
  });

  document.querySelectorAll('.reject-reservation').forEach(button => {
    button.addEventListener('click', () =>
      updateReservationStatus(button.dataset.id, 'rejected')
    );
  });

  // Cargar todas las reservas
  const allReservationsBody = document.getElementById('all-reservations-body');
  allReservationsBody.innerHTML = '';

  reservations.forEach(reservation => {
    const row = document.createElement('tr');

    row.innerHTML = `
            <td>${reservation.studentName} (${reservation.studentEmail})</td>
            <td>${reservation.classroom}</td>
            <td>${formatDate(reservation.date)}</td>
            <td>${reservation.timeSlot}</td>
            <td>${reservation.purpose}</td>
            <td class="status-${reservation.status}">${getStatusText(
      reservation.status
    )}</td>
        `;

    allReservationsBody.appendChild(row);
  });
}

function updateReservationStatus(reservationId, status) {
  const reservations = JSON.parse(localStorage.getItem('reservations'));
  const reservationIndex = reservations.findIndex(r => r.id == reservationId);

  if (reservationIndex !== -1) {
    reservations[reservationIndex].status = status;
    localStorage.setItem('reservations', JSON.stringify(reservations));

    showAlert(
      'success',
      `Reserva ${status === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`
    );
    loadAdminData();
  }
}

function cancelReservation(reservationId) {
  const reservations = JSON.parse(localStorage.getItem('reservations'));
  const updatedReservations = reservations.filter(r => r.id != reservationId);

  localStorage.setItem('reservations', JSON.stringify(updatedReservations));

  showAlert('success', 'Reserva cancelada exitosamente');
  loadUserReservations();

  // Si estamos viendo disponibilidad, actualizar la vista
  if (selectedDate && selectedClassroom) {
    generateTimeSlots(selectedDate, selectedClassroom);
  }
}

function loadProfile() {
  if (!currentUser) return;

  document.getElementById('profile-name').textContent = currentUser.name;
  document.getElementById('profile-email').textContent = currentUser.email;
  document.getElementById('profile-id').textContent = currentUser.id;
}

function formatDate(dateString) {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', options);
}

function getStatusText(status) {
  const statusTexts = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  };
  return statusTexts[status] || status;
}

function showAlert(type, message) {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;

  // Insertar al principio del container
  document
    .querySelector('.container')
    .insertBefore(alert, document.querySelector('.container').firstChild);

  // Eliminar después de 5 segundos
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

// Crear usuario admin por defecto si no existe
function initializeAdminUser() {
  const users = JSON.parse(localStorage.getItem('users'));
  const adminExists = users.some(u => u.email === 'admin@miumg.edu.gt');

  if (!adminExists) {
    users.push({
      name: 'Administrador',
      email: 'admin@miumg.edu.gt',
      password: 'admin123',
      id: '00000000',
      isAdmin: true,
    });

    localStorage.setItem('users', JSON.stringify(users));
  }
}

// Inicializar al cargar la página
initializeAdminUser();
