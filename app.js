/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ EDUCATION PLATFORM - APP.JS                                                 ║
║──────────────────────────────────────────────────────────────────────────────║
║ Description : Application dashboard administration scolaire                 ║
║               • KPIs : élèves, paiements, moyenne générale, absences         ║
║               • Chart.js : évolution moyennes par classe (3 trimestres)      ║
║               • Table élèves : filtres (classe, paiement), recherche         ║
║               • Paiements récents + export CSV                               ║
║               • Modals : génération bulletins PDF, détails élève             ║
║──────────────────────────────────────────────────────────────────────────────║
║ Auteur      : Patrick Junior Samba Ntadi (Intello)                           ║
║ Date        : Janvier 2025                                                   ║
║ Stack       : Vanilla JavaScript ES6+ (IIFE, strict mode)                    ║
║ Dépendances : Chart.js 4.4.0, CountUp.js 2.8.0                               ║
║──────────────────────────────────────────────────────────────────────────────║
║ Structure :                                                                  ║
║  1. Utilitaires & Helpers (DOM, formatage, sécurité)                         ║
║  2. État global (élèves, paiements, filtres, charts)                         ║
║  3. Données fictives (noms sénégalais, classes 6ème-3ème)                    ║
║  4. Génération données (élèves, paiements)                                   ║
║  5. Mise à jour KPIs + animations CountUp                                    ║
║  6. Graphique Chart.js (évolution moyennes)                                  ║
║  7. Filtres & Recherche (classe, paiement, nom)                              ║
║  8. Rendu table élèves + paiements                                           ║
║  9. Modals (détails élève, génération bulletins)                             ║
║ 10. Événements & Init                                                        ║
║──────────────────────────────────────────────────────────────────────────────║
║ Sécurité : Validation + escapeHTML pour prévenir XSS.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

(() => {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════
  // 1. UTILITAIRES & HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Sélecteur DOM raccourci (retourne le premier élément trouvé)
   * @param {string} selector - Sélecteur CSS
   * @returns {Element|null}
   */
  const $ = (selector) => document.querySelector(selector);

  /**
   * Sélecteur DOM raccourci (retourne un tableau de tous les éléments)
   * @param {string} selector - Sélecteur CSS
   * @returns {Array<Element>}
   */
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  /**
   * Récupère la classe CountUp depuis window (gestion compatibilité bundlers)
   * @type {Function|null}
   */
  const CountUpClass = (window.CountUp && (window.CountUp.CountUp || window.CountUp)) || null;

  /**
   * Échappe HTML pour prévenir XSS lors de l'injection dans innerHTML
   * @param {string} unsafe - Chaîne non sécurisée
   * @returns {string} Chaîne échappée
   */
  const escapeHTML = (unsafe) => {
    if (typeof unsafe !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = unsafe;
    return div.innerHTML;
  };

  /**
   * Formate un montant en francs CFA (FCFA) avec séparateurs de milliers
   * @param {number} amount - Montant en FCFA
   * @returns {string} Ex: "25 000 FCFA"
   */
  const formatFCFA = (amount) => {
    return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
  };

  /**
   * Génère un nom complet aléatoire (prénoms et noms sénégalais)
   * @returns {string} Ex: "Amadou Diallo"
   */
  const randomName = () => {
    const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    return `${first} ${last}`;
  };

  /**
   * Génère une note aléatoire réaliste entre 5 et 18 (sur 20)
   * @returns {string} Ex: "12.5"
   */
  const randomGrade = () => {
    return Math.max(5, Math.min(20, 10 + (Math.random() * 8 - 2))).toFixed(1);
  };

  /**
   * Détermine un statut de paiement aléatoire (70% payé, 20% en attente, 10% retard)
   * @returns {string} 'paid', 'pending', ou 'late'
   */
  const getPaymentStatus = () => {
    const rand = Math.random();
    if (rand < 0.7) return 'paid';
    if (rand < 0.9) return 'pending';
    return 'late';
  };

  /**
   * Affiche une notification toast temporaire
   * @param {string} message - Message à afficher
   * @param {string} type - Type de toast : 'success', 'error', ou 'info'
   */
  const showToast = (message, type = 'success') => {
    const container = $('#toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = escapeHTML(message);
    container.appendChild(toast);

    // Auto-suppression après 3.5s
    setTimeout(() => toast.remove(), 3500);
  };

  /**
   * Debounce : retarde l'exécution d'une fonction jusqu'à ce que X ms se soient écoulées
   * @param {Function} func - Fonction à débouncer
   * @param {number} wait - Délai en ms
   * @returns {Function}
   */
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 2. ÉTAT GLOBAL
  // Centralisation des données de l'application
  // ═══════════════════════════════════════════════════════════════════════

  const state = {
    students: [],              // Tous les élèves (source de vérité)
    filteredStudents: [],      // Élèves après filtres
    payments: [],              // Paiements récents (top 10)
    filters: {
      search: '',              // Recherche par nom
      class: '',               // Filtre classe (6eme, 5eme, 4eme, 3eme)
      paymentStatus: ''        // Filtre paiement (paid, pending, late)
    },
    selectedClass: 'all',      // Filtre graphique (toutes classes ou spécifique)
    charts: {
      grades: null             // Instance Chart.js (évolution moyennes)
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 3. DONNÉES FICTIVES
  // Noms sénégalais + classes collège
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Prénoms sénégalais courants (30 prénoms mixtes)
   */
  const FIRST_NAMES = [
    'Amadou', 'Fatou', 'Ibrahima', 'Aïssatou', 'Moussa', 'Khady', 'Ousmane',
    'Mariama', 'Cheikh', 'Awa', 'Mamadou', 'Bineta', 'Modou', 'Ndèye', 'Ablaye',
    'Coumba', 'Samba', 'Astou', 'Alioune', 'Mame', 'Babacar', 'Yacine', 'Assane',
    'Dieynaba', 'Malick', 'Rokhaya', 'Mor', 'Sokhna', 'Pape', 'Seynabou'
  ];

  /**
   * Noms de famille sénégalais courants (25 noms)
   */
  const LAST_NAMES = [
    'Diallo', 'Fall', 'Ndiaye', 'Diop', 'Sow', 'Mbaye', 'Gueye', 'Sarr',
    'Sy', 'Ba', 'Thiam', 'Kane', 'Seck', 'Faye', 'Cissé', 'Diouf', 'Ndoye',
    'Sène', 'Touré', 'Dièye', 'Bâ', 'Camara', 'Sambou', 'Kébé', 'Wade'
  ];

  /**
   * Classes disponibles (collège)
   */
  const CLASSES = ['6eme', '5eme', '4eme', '3eme'];

  // ═══════════════════════════════════════════════════════════════════════
  // 4. GÉNÉRATION DONNÉES
  // Création élèves fictifs + paiements
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Génère une liste d'élèves fictifs (50-70 par classe)
   * @returns {Array<Object>} Liste d'élèves avec id, nom, classe, note, absences, paiement
   */
  const generateStudents = () => {
    const students = [];
    let id = 1;

    CLASSES.forEach((classe) => {
      const count = 50 + Math.floor(Math.random() * 20); // 50-70 élèves par classe

      for (let i = 0; i < count; i++) {
        students.push({
          id: id++,
          name: randomName(),
          class: classe,
          grade: parseFloat(randomGrade()),
          absences: Math.floor(Math.random() * 12), // 0-11 jours d'absence
          paymentStatus: getPaymentStatus()
        });
      }
    });

    return students;
  };

  /**
   * Génère une liste des 10 paiements les plus récents
   * @returns {Array<Object>} Liste de paiements avec élève, montant, date, méthode
   */
  const generatePayments = () => {
    const payments = [];

    // Sélectionner 10 élèves ayant payé (aléatoire)
    const recentPayers = state.students
      .filter((s) => s.paymentStatus === 'paid')
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    const possibleAmounts = [15000, 20000, 25000, 30000]; // Montants réalistes FCFA

    recentPayers.forEach((student, index) => {
      const amount = possibleAmounts[Math.floor(Math.random() * possibleAmounts.length)];

      // Date aléatoire dans les 7 derniers jours
      const daysAgo = Math.floor(Math.random() * 7);
      const paymentDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      payments.push({
        id: index + 1,
        student: student.name,
        class: student.class,
        amount: amount,
        date: paymentDate.toLocaleDateString('fr-FR'),
        method: Math.random() > 0.5 ? 'Wave' : 'Orange Money'
      });
    });

    return payments;
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 5. MISE À JOUR KPIs
  // Animation CountUp + calculs métriques
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Met à jour un KPI avec animation CountUp (ou fallback texte)
   * @param {string} elementId - ID de l'élément HTML cible
   * @param {number} value - Valeur cible
   * @param {boolean} isPercent - Si true, formatage en pourcentage
   * @param {boolean} isFraction - Si true, affichage texte direct (ex: "12.5/20")
   */
  const updateKPI = (elementId, value, isPercent = false, isFraction = false) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Si fraction (ex: "12.5/20"), pas d'animation
    if (isFraction) {
      element.textContent = value;
      return;
    }

    // Fallback si CountUp.js non chargé
    if (!CountUpClass) {
      element.textContent = isPercent ? `${value.toFixed(1)}%` : value;
      return;
    }

    // Créer instance CountUp avec formatage custom
    const countUp = new CountUpClass(element, value, {
      duration: 1.2,
      separator: ' ',
      decimal: isPercent ? ',' : '',
      decimalPlaces: isPercent ? 1 : 0,
      suffix: isPercent ? '%' : ''
    });

    // Démarrer animation (avec fallback si erreur)
    if (!countUp.error) {
      countUp.start();
    } else {
      element.textContent = isPercent ? `${value.toFixed(1)}%` : value;
    }
  };

  /**
   * Met à jour l'indicateur de changement d'un KPI (badge vert/rouge)
   * @param {string} elementId - ID de l'élément HTML cible
   * @param {number} value - Valeur de variation (nombre absolu ou %)
   * @param {boolean} isPositiveGood - Si true, hausse = positif (vert)
   */
  const updateKPIChange = (elementId, value, isPositiveGood = true) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const isIncreasing = value >= 0;
    const isGood = isPositiveGood ? isIncreasing : !isIncreasing;

    // Appliquer classes CSS (positive = vert, negative = rouge)
    element.classList.toggle('positive', isGood);
    element.classList.toggle('negative', !isGood);

    // Mettre à jour texte
    const span = element.querySelector('span');
    if (span) {
      const prefix = isIncreasing ? '+' : '';
      const formattedValue = value % 1 === 0 ? value : `${value.toFixed(1)}%`;
      span.textContent = `${prefix}${formattedValue}`;
    }
  };

  /**
   * Met à jour tous les KPIs (élèves, paiements, moyenne, absences)
   */
  const updateAllKPIs = () => {
    const totalStudents = state.students.length;
    const pendingPayments = state.students.filter((s) => s.paymentStatus !== 'paid').length;
    const averageGrade = state.students.reduce((sum, s) => sum + s.grade, 0) / totalStudents;
    const absencesToday = state.students.filter((s) => s.absences > 0).length;

    // Calculs complémentaires
    const pendingAmount = pendingPayments * 25000; // Moyenne 25k FCFA par paiement
    const absenceRate = (absencesToday / totalStudents) * 100;

    // ─────────────────────────────────────────────────────────────────
    // Mise à jour valeurs principales
    // ─────────────────────────────────────────────────────────────────
    updateKPI('studentsCount', totalStudents);
    updateKPI('paymentsCount', pendingPayments);
    updateKPI('averageGrade', averageGrade, false, true); // Géré manuellement ci-dessous
    updateKPI('absencesCount', absencesToday);

    // ─────────────────────────────────────────────────────────────────
    // Mise à jour labels secondaires
    // ─────────────────────────────────────────────────────────────────
    const paymentsAmountEl = $('#paymentsAmount');
    if (paymentsAmountEl) paymentsAmountEl.textContent = formatFCFA(pendingAmount);

    const absenceRateEl = $('#absenceRate');
    if (absenceRateEl) absenceRateEl.textContent = `${absenceRate.toFixed(1)}%`;

    // ─────────────────────────────────────────────────────────────────
    // Mise à jour badges changements (valeurs simulées)
    // ─────────────────────────────────────────────────────────────────
    updateKPIChange('studentsChange', 5.2, true);  // +5.2% élèves (hausse = bien)
    updateKPIChange('paymentsChange', -12, false); // -12% paiements en attente (baisse = bien)
    updateKPIChange('averageChange', 0.8, true);   // +0.8 points moyenne (hausse = bien)
    updateKPIChange('absencesChange', -3, false);  // -3 absences (baisse = bien)

    // ─────────────────────────────────────────────────────────────────
    // Affichage spécial moyenne (format X.X/20)
    // ─────────────────────────────────────────────────────────────────
    const gradeEl = $('#averageGrade');
    if (gradeEl) gradeEl.textContent = `${averageGrade.toFixed(1)}/20`;
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 6. GRAPHIQUE CHART.JS
  // Évolution moyennes par classe sur 3 trimestres
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Crée ou met à jour le graphique Chart.js (évolution moyennes)
   */
  const buildGradesChart = () => {
    const canvas = $('#gradesChart');
    if (!canvas) return;

    // Détruire ancien chart (éviter memory leak)
    if (state.charts.grades) {
      state.charts.grades.destroy();
      state.charts.grades = null;
    }

    const ctx = canvas.getContext('2d');

    // ─────────────────────────────────────────────────────────────────
    // Calcul moyennes actuelles par classe
    // ─────────────────────────────────────────────────────────────────
    const classesAverages = {};

    CLASSES.forEach((classe) => {
      // Filtrer par classe (et classe sélectionnée dans dropdown si applicable)
      const classStudents = state.students
        .filter((s) => state.selectedClass === 'all' || s.class === state.selectedClass)
        .filter((s) => s.class === classe);

      // Calculer moyenne
      const average = classStudents.length > 0
        ? classStudents.reduce((sum, s) => sum + s.grade, 0) / classStudents.length
        : 0;

      classesAverages[classe] = average;
    });

    // ─────────────────────────────────────────────────────────────────
    // Création datasets (simulation 3 trimestres avec variation)
    // ─────────────────────────────────────────────────────────────────
    const labels = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'];
    const colors = ['#06b6d4', '#8b5cf6', '#f59e0b', '#22c55e']; // Cyan, Purple, Orange, Green

    const datasets = CLASSES.map((classe, index) => {
      const currentAverage = classesAverages[classe];

      // Simuler progression : T1 légèrement inférieur, T2 intermédiaire, T3 actuel
      const dataPoints = [
        Math.max(8, currentAverage - 1 + Math.random()),        // T1
        Math.max(8, currentAverage - 0.5 + Math.random()),      // T2
        currentAverage                                           // T3 (actuel)
      ];

      return {
        label: classe,
        data: dataPoints,
        borderColor: colors[index],
        backgroundColor: `${colors[index]}33`, // Alpha 20%
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: colors[index],
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      };
    });

    // ─────────────────────────────────────────────────────────────────
    // Création Chart.js
    // ─────────────────────────────────────────────────────────────────
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
            grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
            ticks: { color: '#9aa3b2' }
          },
          y: {
            min: 8,
            max: 18,
            grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
            ticks: {
              color: '#9aa3b2',
              callback: (value) => `${value}/20`
            }
          }
        },
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        }
      }
    });
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 7. FILTRES & RECHERCHE
  // Recherche nom + filtres classe/paiement
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Applique tous les filtres actifs (recherche + classe + paiement)
   * puis rafraîchit la table
   */
  const applyFilters = () => {
    let filtered = [...state.students];

    // ─────────────────────────────────────────────────────────────────
    // Filtre recherche textuelle (nom élève)
    // ─────────────────────────────────────────────────────────────────
    if (state.filters.search) {
      filtered = filtered.filter((student) =>
        student.name.toLowerCase().includes(state.filters.search.toLowerCase())
      );
    }

    // ─────────────────────────────────────────────────────────────────
    // Filtre classe (6eme, 5eme, 4eme, 3eme)
    // ─────────────────────────────────────────────────────────────────
    if (state.filters.class) {
      filtered = filtered.filter((student) => student.class === state.filters.class);
    }

    // ─────────────────────────────────────────────────────────────────
    // Filtre statut paiement (paid, pending, late)
    // ─────────────────────────────────────────────────────────────────
    if (state.filters.paymentStatus) {
      filtered = filtered.filter((student) => student.paymentStatus === state.filters.paymentStatus);
    }

    state.filteredStudents = filtered;
    renderStudentsTable();
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 8. RENDU TABLE & PAIEMENTS
  // Affichage élèves + paiements récents
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Affiche la table des élèves filtrés (avec escapeHTML pour sécurité)
   */
  const renderStudentsTable = () => {
    const tbody = $('#studentsTableBody');
    if (!tbody) return;

    // ─────────────────────────────────────────────────────────────────
    // Cas aucun résultat
    // ─────────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────────
    // Rendu lignes table (avec escapeHTML pour sécurité)
    // ─────────────────────────────────────────────────────────────────
    const statusLabels = {
      paid: '✓ Payé',
      pending: '⏳ En attente',
      late: '⚠️ Retard'
    };

    tbody.innerHTML = state.filteredStudents
      .map((student) => {
        const safeName = escapeHTML(student.name);
        const gradeColor = student.grade >= 10 ? 'var(--success)' : 'var(--danger)';

        return `
        <tr>
          <td><strong>${safeName}</strong></td>
          <td>${escapeHTML(student.class)}</td>
          <td style="color: ${gradeColor}; font-weight: 700;">${student.grade}/20</td>
          <td>${student.absences}</td>
          <td><span class="badge-status ${student.paymentStatus}">${statusLabels[student.paymentStatus]}</span></td>
          <td>
            <button class="table-action" data-student="${student.id}" aria-label="Voir détails de ${safeName}">
              <span aria-hidden="true">👁️</span> Détails
            </button>
          </td>
        </tr>
      `;
      })
      .join('');

    // ─────────────────────────────────────────────────────────────────
    // Attacher événements boutons "Détails"
    // ─────────────────────────────────────────────────────────────────
    $$('[data-student]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openStudentModal(Number(btn.dataset.student));
      });
    });
  };

  /**
   * Affiche la liste des paiements récents (sidebar)
   */
  const renderPayments = () => {
    const list = $('#paymentsList');
    if (!list) return;

    list.innerHTML = state.payments
      .map((payment) => {
        const safeName = escapeHTML(payment.student);
        const safeClass = escapeHTML(payment.class);
        const safeDate = escapeHTML(payment.date);
        const safeMethod = escapeHTML(payment.method);

        return `
        <div class="payment-item">
          <div class="payment-info">
            <div class="payment-student">${safeName}</div>
            <div class="payment-details">
              ${safeClass} • ${safeDate} • ${safeMethod}
            </div>
          </div>
          <div class="payment-amount">${formatFCFA(payment.amount)}</div>
        </div>
      `;
      })
      .join('');
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 9. MODALS
  // Détails élève + Génération bulletins
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Ouvre la modal de détails d'un élève
   * @param {number} studentId - ID de l'élève
   */
  const openStudentModal = (studentId) => {
    const student = state.students.find((s) => s.id === studentId);
    if (!student) return;

    const modal = $('#studentModal');
    const title = $('#studentModalTitle');
    const body = $('#studentModalBody');

    const safeName = escapeHTML(student.name);
    title.textContent = `Fiche élève : ${safeName}`;

    const statusLabels = {
      paid: '✓ À jour',
      pending: '⏳ Paiement en cours',
      late: '⚠️ Retard de paiement'
    };

    const safeClass = escapeHTML(student.class);
    const gradeColor = student.grade >= 10 ? 'var(--success)' : 'var(--danger)';

    // ─────────────────────────────────────────────────────────────────
    // Simulation notes par matière (variation autour moyenne)
    // ─────────────────────────────────────────────────────────────────
    const mathGrade = (student.grade + Math.random() * 2 - 1).toFixed(1);
    const frenchGrade = (student.grade + Math.random() * 2 - 1).toFixed(1);
    const englishGrade = (student.grade + Math.random() * 2 - 1).toFixed(1);
    const historyGrade = (student.grade + Math.random() * 2 - 1).toFixed(1);

    body.innerHTML = `
      <div style="display: grid; gap: 20px;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div>
            <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">Classe</div>
            <div style="font-weight: 700; font-size: 16px;">${safeClass}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">Moyenne générale</div>
            <div style="font-weight: 700; font-size: 16px; color: ${gradeColor};">
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
          <div style="font-weight: 700; margin-bottom: 12px;"><span aria-hidden="true">📚</span> Notes par matière</div>
          <div style="display: grid; gap: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Mathématiques</span>
              <strong>${mathGrade}/20</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Français</span>
              <strong>${frenchGrade}/20</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Anglais</span>
              <strong>${englishGrade}/20</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Histoire-Géo</span>
              <strong>${historyGrade}/20</strong>
            </div>
          </div>
        </div>

        <button class="btn-primary btn-block" aria-label="Télécharger le bulletin de ${safeName}">
          <span aria-hidden="true">📄</span> Télécharger le bulletin
        </button>
      </div>
    `;

    modal.classList.add('active');
    modal.removeAttribute('hidden');
  };

  /**
   * Ferme la modal détails élève
   */
  const closeStudentModal = () => {
    const modal = $('#studentModal');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('hidden', '');
    }
  };

  /**
   * Ouvre la modal génération bulletins PDF
   */
  const openBulletinModal = () => {
    const modal = $('#bulletinModal');
    if (modal) {
      modal.classList.add('active');
      modal.removeAttribute('hidden');
    }
  };

  /**
   * Ferme la modal génération bulletins + reset progress
   */
  const closeBulletinModal = () => {
    const modal = $('#bulletinModal');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('hidden', '');
    }

    // Reset progress bar
    $('#generationProgress')?.classList.add('hidden');
    const progressFill = $('#progressFill');
    if (progressFill) progressFill.style.width = '0%';
  };

  /**
   * Simule la génération de bulletins PDF (progress bar animée)
   */
  const generateBulletins = () => {
    const trimester = $('#trimesterSelect')?.value || 'T3';
    const classe = $('#bulletinClassSelect')?.value || 'all';

    // Calculer nombre de bulletins à générer
    const count = classe === 'all'
      ? state.students.length
      : state.students.filter((s) => s.class === classe).length;

    showToast(`Génération de ${count} bulletins (${trimester})...`, 'info');

    // Afficher progress bar
    const progressSection = $('#generationProgress');
    if (progressSection) progressSection.classList.remove('hidden');

    const progressFill = $('#progressFill');
    const progressText = $('#progressText');

    // Animation progress 0% → 100% (300ms par étape de 10%)
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;

      if (progressFill) progressFill.style.width = `${progress}%`;
      if (progressText) progressText.textContent = `Génération en cours... ${progress}%`;

      if (progress >= 100) {
        clearInterval(interval);

        // Fermer modal après 500ms de délai
        setTimeout(() => {
          closeBulletinModal();
          showToast(`✓ ${count} bulletins générés avec succès !`, 'success');
        }, 500);
      }
    }, 300);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 10. ÉVÉNEMENTS & INITIALISATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Lie tous les événements globaux de l'application
   */
  const bindEvents = () => {
    // ─────────────────────────────────────────────────────────────────
    // Recherche élève (debounced 300ms)
    // ─────────────────────────────────────────────────────────────────
    const searchInput = $('#searchStudent');
    if (searchInput) {
      const debouncedSearch = debounce((event) => {
        state.filters.search = event.target.value;
        applyFilters();
      }, 300);
      searchInput.addEventListener('input', debouncedSearch);
    }

    // ─────────────────────────────────────────────────────────────────
    // Filtres table (classe + paiement)
    // ─────────────────────────────────────────────────────────────────
    $('#filterClass')?.addEventListener('change', (event) => {
      state.filters.class = event.target.value;
      applyFilters();
    });

    $('#filterPayment')?.addEventListener('change', (event) => {
      state.filters.paymentStatus = event.target.value;
      applyFilters();
    });

    // ─────────────────────────────────────────────────────────────────
    // Filtre graphique (classe)
    // ─────────────────────────────────────────────────────────────────
    $('#classFilter')?.addEventListener('change', (event) => {
      state.selectedClass = event.target.value;
      buildGradesChart();
    });

    // ─────────────────────────────────────────────────────────────────
    // Bouton refresh (avec animation rotation)
    // ─────────────────────────────────────────────────────────────────
    $('#refreshBtn')?.addEventListener('click', () => {
      const btn = $('#refreshBtn');
      if (btn) {
        btn.style.transform = 'rotate(360deg)';
        btn.style.transition = 'transform 0.6s ease';
        setTimeout(() => {
          btn.style.transform = '';
        }, 600);
      }

      init();
      showToast('Données actualisées', 'success');
    });

    // ─────────────────────────────────────────────────────────────────
    // Modals (bulletins + détails élève)
    // ─────────────────────────────────────────────────────────────────
    $('#generateBulletinBtn')?.addEventListener('click', openBulletinModal);
    $('#closeBulletinModal')?.addEventListener('click', closeBulletinModal);
    $('#generateBtn')?.addEventListener('click', (event) => {
      event.preventDefault();
      generateBulletins();
    });

    $('#closeStudentModal')?.addEventListener('click', closeStudentModal);

    // ─────────────────────────────────────────────────────────────────
    // Bouton notifications (placeholder)
    // ─────────────────────────────────────────────────────────────────
    $('#notificationsBtn')?.addEventListener('click', () => {
      showToast('3 nouvelles notifications', 'info');
    });

    // ─────────────────────────────────────────────────────────────────
    // Export paiements CSV (placeholder)
    // ─────────────────────────────────────────────────────────────────
    $('#exportPaymentsBtn')?.addEventListener('click', () => {
      showToast('Export CSV en cours...', 'info');

      setTimeout(() => {
        showToast('✓ Paiements exportés', 'success');
      }, 1000);
    });

    // ─────────────────────────────────────────────────────────────────
    // Fermeture modals (overlay + Escape)
    // ─────────────────────────────────────────────────────────────────
    $$('.modal').forEach((modal) => {
      modal.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-overlay')) {
          modal.classList.remove('active');
          modal.setAttribute('hidden', '');
        }
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeStudentModal();
        closeBulletinModal();
      }
    });
  };

  /**
   * Initialisation principale de l'application
   * Génère données + affiche dashboard
   */
  const init = () => {
    // Génération données
    state.students = generateStudents();
    state.filteredStudents = [...state.students];
    state.payments = generatePayments();

    // Rendu dashboard
    updateAllKPIs();
    buildGradesChart();
    renderStudentsTable();
    renderPayments();

    // Log console (branding)
    console.log(
      '%c🎓 Intello School Manager',
      'color: #06b6d4; font-size: 18px; font-weight: bold; padding: 8px; background: rgba(6,182,212,0.1); border-radius: 4px;'
    );
    console.log(
      `%c${state.students.length} élèves chargés • ${state.payments.length} paiements récents`,
      'color: #9aa3b2; font-size: 12px; padding: 4px;'
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // DÉMARRAGE APPLICATION
  // ═══════════════════════════════════════════════════════════════════════

  // Attendre chargement DOM complet
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bindEvents();
      init();
    });
  } else {
    // DOM déjà chargé (cas script defer)
    bindEvents();
    init();
  }
})();