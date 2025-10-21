// public/prototypes/education-platform/app.js
// Education Platform — Intello School Manager

(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const CountUpClass = (window.CountUp && (window.CountUp.CountUp || window.CountUp)) || null;

  /* ==================== STATE ==================== */
  const state = {
    students: [],
    filteredStudents: [],
    payments: [],
    filters: {
      search: '',
      class: '',
      paymentStatus: ''
    },
    selectedClass: 'all',
    charts: {
      grades: null
    }
  };

  /* ==================== DATA ==================== */
  const FIRST_NAMES = [
    'Amadou', 'Fatou', 'Ibrahima', 'Aïssatou', 'Moussa', 'Khady', 'Ousmane', 
    'Mariama', 'Cheikh', 'Awa', 'Mamadou', 'Bineta', 'Modou', 'Ndèye', 'Ablaye',
    'Coumba', 'Samba', 'Astou', 'Alioune', 'Mame', 'Babacar', 'Yacine', 'Assane',
    'Dieynaba', 'Malick', 'Rokhaya', 'Mor', 'Sokhna', 'Pape', 'Seynabou'
  ];

  const LAST_NAMES = [
    'Diallo', 'Fall', 'Ndiaye', 'Diop', 'Sow', 'Mbaye', 'Gueye', 'Sarr',
    'Sy', 'Ba', 'Thiam', 'Kane', 'Seck', 'Faye', 'Cissé', 'Diouf', 'Ndoye',
    'Sène', 'Touré', 'Dièye', 'Bâ', 'Camara', 'Sambou', 'Kébé', 'Wade'
  ];

  const CLASSES = ['6eme', '5eme', '4eme', '3eme'];

  /* ==================== HELPERS ==================== */
  const formatFCFA = (n) => `${Math.round(n).toLocaleString('fr-FR')} FCFA`;

  function randomName() {
    const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    return `${first} ${last}`;
  }

  function randomGrade() {
    return Math.max(5, Math.min(20, 10 + (Math.random() * 8 - 2))).toFixed(1);
  }

  function getPaymentStatus() {
    const rand = Math.random();
    if (rand < 0.7) return 'paid';
    if (rand < 0.9) return 'pending';
    return 'late';
  }

  function showToast(message, type = 'success') {
    const container = $('#toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  /* ==================== GENERATE DATA ==================== */
  function generateStudents() {
    const students = [];
    let id = 1;

    CLASSES.forEach(classe => {
      const count = 50 + Math.floor(Math.random() * 20); // 50-70 par classe
      for (let i = 0; i < count; i++) {
        students.push({
          id: id++,
          name: randomName(),
          class: classe,
          grade: parseFloat(randomGrade()),
          absences: Math.floor(Math.random() * 12),
          paymentStatus: getPaymentStatus()
        });
      }
    });

    return students;
  }

  function generatePayments() {
    const payments = [];
    const recent = state.students
      .filter(s => s.paymentStatus === 'paid')
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    recent.forEach((student, i) => {
      const amounts = [15000, 20000, 25000, 30000];
      payments.push({
        id: i + 1,
        student: student.name,
        class: student.class,
        amount: amounts[Math.floor(Math.random() * amounts.length)],
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
        method: Math.random() > 0.5 ? 'Wave' : 'Orange Money'
      });
    });

    return payments;
  }

  /* ==================== KPI UPDATES ==================== */
  function updateKPI(id, value, isPct = false, isFraction = false) {
    const el = document.getElementById(id);
    if (!el) return;

    if (isFraction) {
      el.textContent = value;
      return;
    }

    if (!CountUpClass) {
      el.textContent = isPct ? `${value.toFixed(1)}%` : value;
      return;
    }

    const cu = new CountUpClass(el, value, {
      duration: 1.2,
      separator: ' ',
      decimal: isPct ? ',' : '',
      decimalPlaces: isPct ? 1 : 0,
      suffix: isPct ? '%' : ''
    });

    if (!cu.error) cu.start();
    else el.textContent = isPct ? `${value.toFixed(1)}%` : value;
  }

  function updateChange(id, value, isPositiveGood = true) {
    const el = document.getElementById(id);
    if (!el) return;

    const isUp = value >= 0;
    const isGood = isPositiveGood ? isUp : !isUp;

    el.classList.toggle('positive', isGood);
    el.classList.toggle('negative', !isGood);

    const span = el.querySelector('span');
    if (span) {
      const prefix = isUp ? '+' : '';
      span.textContent = value % 1 === 0 ? `${prefix}${value}` : `${prefix}${value.toFixed(1)}%`;
    }
  }

  function updateKPIs() {
    const totalStudents = state.students.length;
    const pendingPayments = state.students.filter(s => s.paymentStatus !== 'paid').length;
    const averageGrade = state.students.reduce((sum, s) => sum + s.grade, 0) / totalStudents;
    const absencesToday = state.students.filter(s => s.absences > 0).length;

    const pendingAmount = pendingPayments * 25000; // Moyenne 25k FCFA
    const absenceRate = (absencesToday / totalStudents) * 100;

    // Update values
    updateKPI('studentsCount', totalStudents);
    updateKPI('paymentsCount', pendingPayments);
    updateKPI('averageGrade', averageGrade, false, true);
    updateKPI('absencesCount', absencesToday);

    // Update labels
    const paymentsAmountEl = $('#paymentsAmount');
    if (paymentsAmountEl) paymentsAmountEl.textContent = formatFCFA(pendingAmount);

    const absenceRateEl = $('#absenceRate');
    if (absenceRateEl) absenceRateEl.textContent = `${absenceRate.toFixed(1)}%`;

    // Update changes (simulé)
    updateChange('studentsChange', 5.2, true);
    updateChange('paymentsChange', -12, false); // Moins = mieux
    updateChange('averageChange', 0.8, true);
    updateChange('absencesChange', -3, false); // Moins = mieux

    // Update grade display
    const gradeEl = $('#averageGrade');
    if (gradeEl) gradeEl.textContent = `${averageGrade.toFixed(1)}/20`;
  }

  /* ==================== CHART ==================== */
  function buildGradesChart() {
    const canvas = $('#gradesChart');
    if (!canvas) return;

    // Destroy old chart
    if (state.charts.grades) {
      state.charts.grades.destroy();
      state.charts.grades = null;
    }

    const ctx = canvas.getContext('2d');

    // Data per class
    const classesData = {};
    CLASSES.forEach(c => {
      const students = state.students.filter(s => 
        state.selectedClass === 'all' || s.class === state.selectedClass
      ).filter(s => s.class === c);

      const avg = students.length > 0 
        ? students.reduce((sum, s) => sum + s.grade, 0) / students.length 
        : 0;

      classesData[c] = avg;
    });

    // Simulate 3 trimesters
    const labels = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'];
    const datasets = CLASSES.map((c, i) => {
      const colors = ['#06b6d4', '#8b5cf6', '#f59e0b', '#22c55e'];
      const base = classesData[c];
      
      return {
        label: c,
        data: [
          Math.max(8, base - 1 + Math.random()),
          Math.max(8, base - 0.5 + Math.random()),
          base
        ],
        borderColor: colors[i],
        backgroundColor: `${colors[i]}33`,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: colors[i],
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      };
    });

    state.charts.grades = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#9aa3b2',
              padding: 12,
              font: { size: 12, weight: '600' }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(10, 15, 26, 0.95)',
            titleColor: '#e6eef5',
            bodyColor: '#9aa3b2',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (item) => ` ${item.dataset.label}: ${item.parsed.y.toFixed(1)}/20`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#9aa3b2' }
          },
          y: {
            min: 8,
            max: 18,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: '#9aa3b2',
              callback: (v) => `${v}/20`
            }
          }
        },
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        }
      }
    });
  }

  /* ==================== FILTERS ==================== */
  function applyFilters() {
    let filtered = [...state.students];

    // Search
    if (state.filters.search) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(state.filters.search.toLowerCase())
      );
    }

    // Class
    if (state.filters.class) {
      filtered = filtered.filter(s => s.class === state.filters.class);
    }

    // Payment status
    if (state.filters.paymentStatus) {
      filtered = filtered.filter(s => s.paymentStatus === state.filters.paymentStatus);
    }

    state.filteredStudents = filtered;
    renderStudentsTable();
  }

  /* ==================== RENDER STUDENTS TABLE ==================== */
  function renderStudentsTable() {
    const tbody = $('#studentsTableBody');
    if (!tbody) return;

    if (state.filteredStudents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 48px; color: var(--muted);">
            Aucun élève trouvé
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = state.filteredStudents.map(student => {
      const statusLabels = {
        paid: '✓ Payé',
        pending: '⏳ En attente',
        late: '⚠️ Retard'
      };

      const gradeColor = student.grade >= 10 ? 'var(--success)' : 'var(--danger)';

      return `
        <tr>
          <td><strong>${student.name}</strong></td>
          <td>${student.class}</td>
          <td style="color: ${gradeColor}; font-weight: 700;">${student.grade}/20</td>
          <td>${student.absences}</td>
          <td><span class="badge-status ${student.paymentStatus}">${statusLabels[student.paymentStatus]}</span></td>
          <td>
            <button class="table-action" data-student="${student.id}">
              👁️ Détails
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Bind events
    $$('[data-student]').forEach(btn => {
      btn.addEventListener('click', () => {
        openStudentModal(Number(btn.dataset.student));
      });
    });
  }

  /* ==================== RENDER PAYMENTS ==================== */
  function renderPayments() {
    const list = $('#paymentsList');
    if (!list) return;

    list.innerHTML = state.payments.map(payment => `
      <div class="payment-item">
        <div class="payment-info">
          <div class="payment-student">${payment.student}</div>
          <div class="payment-details">
            ${payment.class} • ${payment.date} • ${payment.method}
          </div>
        </div>
        <div class="payment-amount">${formatFCFA(payment.amount)}</div>
      </div>
    `).join('');
  }

  /* ==================== MODALS ==================== */
  function openStudentModal(studentId) {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    const modal = $('#studentModal');
    const title = $('#studentModalTitle');
    const body = $('#studentModalBody');

    title.textContent = `Fiche élève : ${student.name}`;

    const statusLabels = {
      paid: '✓ À jour',
      pending: '⏳ Paiement en cours',
      late: '⚠️ Retard de paiement'
    };

    body.innerHTML = `
      <div style="display: grid; gap: 20px;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div>
            <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">Classe</div>
            <div style="font-weight: 700; font-size: 16px;">${student.class}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">Moyenne générale</div>
            <div style="font-weight: 700; font-size: 16px; color: ${student.grade >= 10 ? 'var(--success)' : 'var(--danger)'};">
              ${student.grade}/20
            </div>
          </div>
          <div>
            <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">Absences</div>
            <div style="font-weight: 700; font-size: 16px;">${student.absences} jours</div>
          </div>
          <div>
            <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">Statut paiement</div>
            <span class="badge-status ${student.paymentStatus}">${statusLabels[student.paymentStatus]}</span>
          </div>
        </div>

        <div style="padding: 16px; border-radius: 12px; background: var(--surface); border: 1px solid var(--border);">
          <div style="font-weight: 700; margin-bottom: 12px;">📚 Notes par matière</div>
          <div style="display: grid; gap: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Mathématiques</span>
              <strong>${(student.grade + Math.random() * 2 - 1).toFixed(1)}/20</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Français</span>
              <strong>${(student.grade + Math.random() * 2 - 1).toFixed(1)}/20</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Anglais</span>
              <strong>${(student.grade + Math.random() * 2 - 1).toFixed(1)}/20</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Histoire-Géo</span>
              <strong>${(student.grade + Math.random() * 2 - 1).toFixed(1)}/20</strong>
            </div>
          </div>
        </div>

        <button class="btn-primary btn-block">
          📄 Télécharger le bulletin
        </button>
      </div>
    `;

    modal.classList.add('active');
  }

  function closeStudentModal() {
    $('#studentModal')?.classList.remove('active');
  }

  function openBulletinModal() {
    $('#bulletinModal')?.classList.add('active');
  }

  function closeBulletinModal() {
    $('#bulletinModal')?.classList.remove('active');
    $('#generationProgress')?.classList.add('hidden');
    $('#progressFill').style.width = '0%';
  }

  function generateBulletins() {
    const trimester = $('#trimesterSelect')?.value || 'T3';
    const classe = $('#bulletinClassSelect')?.value || 'all';

    const count = classe === 'all' 
      ? state.students.length 
      : state.students.filter(s => s.class === classe).length;

    showToast(`Génération de ${count} bulletins (${trimester})...`, 'info');

    $('#generationProgress')?.classList.remove('hidden');
    const progressFill = $('#progressFill');
    const progressText = $('#progressText');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      progressFill.style.width = `${progress}%`;
      progressText.textContent = `Génération en cours... ${progress}%`;

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          closeBulletinModal();
          showToast(`✓ ${count} bulletins générés avec succès !`, 'success');
        }, 500);
      }
    }, 300);
  }

  /* ==================== EVENTS ==================== */
  function bindEvents() {
    // Search
    $('#searchStudent')?.addEventListener('input', (e) => {
      state.filters.search = e.target.value;
      applyFilters();
    });

    // Filters
    $('#filterClass')?.addEventListener('change', (e) => {
      state.filters.class = e.target.value;
      applyFilters();
    });

    $('#filterPayment')?.addEventListener('change', (e) => {
      state.filters.paymentStatus = e.target.value;
      applyFilters();
    });

    // Chart filter
    $('#classFilter')?.addEventListener('change', (e) => {
      state.selectedClass = e.target.value;
      buildGradesChart();
    });

    // Refresh
    $('#refreshBtn')?.addEventListener('click', () => {
      const btn = $('#refreshBtn');
      if (btn) {
        btn.style.transform = 'rotate(360deg)';
        btn.style.transition = 'transform 0.6s ease';
        setTimeout(() => { btn.style.transform = ''; }, 600);
      }
      init();
      showToast('Données actualisées', 'success');
    });

    // Bulletin modal
    $('#generateBulletinBtn')?.addEventListener('click', openBulletinModal);
    $('#closeBulletinModal')?.addEventListener('click', closeBulletinModal);
    $('#generateBtn')?.addEventListener('click', generateBulletins);

    // Student modal
    $('#closeStudentModal')?.addEventListener('click', closeStudentModal);

    // Notifications
    $('#notificationsBtn')?.addEventListener('click', () => {
      showToast('3 nouvelles notifications', 'info');
    });

    // Export payments
    $('#exportPaymentsBtn')?.addEventListener('click', () => {
      showToast('Export CSV en cours...', 'info');
      setTimeout(() => {
        showToast('✓ Paiements exportés', 'success');
      }, 1000);
    });

    // Close modals on overlay
    $$('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
          modal.classList.remove('active');
        }
      });
    });

    // Escape to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeStudentModal();
        closeBulletinModal();
      }
    });
  }

  /* ==================== INIT ==================== */
  function init() {
    state.students = generateStudents();
    state.filteredStudents = [...state.students];
    state.payments = generatePayments();

    updateKPIs();
    buildGradesChart();
    renderStudentsTable();
    renderPayments();

    console.log('%c🎓 Intello School Manager', 'color: #06b6d4; font-size: 18px; font-weight: bold;');
    console.log(`%c${state.students.length} élèves chargés`, 'color: #9aa3b2; font-size: 12px;');
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    init();
  });
})();