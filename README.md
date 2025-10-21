# 🎓 Education Platform — Dashboard Administration

Tableau de bord administratif pour gestion scolaire — Prototype premium par [Intello](https://intello.sn).

![Interface Tableau de bord](screenshots/interface_tableau_de_bord.png)

---

## ✨ Fonctionnalités

- **📊 KPIs temps réel** : Élèves inscrits, paiements en attente, moyenne générale, absences
- **📈 Graphiques évolution** : Moyennes par classe sur 3 trimestres (Chart.js)
- **👥 Gestion élèves** : Table avec filtres (classe, statut paiement, recherche)
- **💰 Suivi paiements** : Transactions récentes avec méthodes (Wave, Orange Money)
- **📄 Génération bulletins** : Modal avec sélection trimestre/classe + progress bar
- **🔍 Fiches détaillées** : Modal élève avec notes par matière
- **🔔 Notifications** : Toast system pour feedback utilisateur
- **📱 Responsive** : Optimisé mobile/tablette/desktop

---

## 🛠️ Stack technique

- **HTML5 + CSS3** : Variables CSS, glassmorphism, animations
- **JavaScript ES6+** : Vanilla (state management, filtres dynamiques)
- **Chart.js 4.4** : Graphiques évolution moyennes
- **CountUp.js 2.8** : Animations KPIs
- **Données** : ~200 élèves fictifs avec noms sénégalais réalistes

---

## 🚀 Installation

### Option 1 : Ouverture directe
Double-cliquez sur `index.html`

### Option 2 : Serveur local


# Cloner le repo
git clone https://github.com/intello-agence/education-platform-prototype.git
cd education-platform-prototype

# Lancer serveur
python -m http.server 8000
# OU
npx http-server -p 8000


Puis ouvrir http://localhost:8000

📸 Screenshots

Interface tableau de bord

![Interface Tableau de bord](screenshots/interface_tableau_de_bord.png)

Liste élèves avec filtres
Liste élèves
![Liste élèves](screenshots/liste_eleves.png)



📦 Structure

education-platform-prototype/
├── index.html          # Structure HTML (dashboard admin)
├── styles.css          # Styles glassmorphism + animations
├── app.js              # Logique métier (KPIs, filtres, génération)
├── screenshots/        # Captures d'écran
│   ├── interface_tableau_de_bord.png
│   └── liste_eleves.png
└── README.md           # Documentation


🎮 Utilisation

Fonctionnalités principales
Fonctionnalité	Description
KPIs animés	Élèves, paiements, moyenne, absences avec CountUp
Filtres élèves	Par classe (6ème-3ème), statut paiement, recherche nom
Chart évolution	Moyennes par classe sur 3 trimestres
Génération bulletins	Sélection trimestre + classe → progress bar simulation
Détails élève	Modal avec notes par matière + infos paiement
Données générées
Classes : 6ème, 5ème, 4ème, 3ème (~50 élèves/classe)
Noms : Prénoms et noms sénégalais (Amadou Diallo, Fatou Ndiaye, etc.)
Notes : Aléatoires entre 8-18/20 avec distribution réaliste
Statuts paiement : Payé (70%), En attente (20%), Retard (10%)
🎨 Personnalisation
Les données sont générées dans app.js (fonction generateStudents()).

Pour connecter une vraie base de données :

// Remplacer la génération par fetch API
async function recupererEleves() {
  const res = await fetch('/api/eleves');
  return res.json();
}

🔗 Lien avec landing page
Ce prototype illustre le SaaS Intello School Manager présenté sur :
👉 intello.sn/offres/ecoles/

📄 Licence
MIT License — Libre d'utilisation commerciale et personnelle.

👤 Auteur
Intello — Agence digitale Dakar 🇸🇳

🌐 Site : intello.sn
📧 Email : intellopjsn@gmail.com
📱 WhatsApp : +221 77 553 28 04
💼 GitHub : @intello-agence
⭐ Support
Si ce prototype vous a été utile :

⭐ Star le repo
🐦 Partager sur LinkedIn
📧 Nous contacter pour un projet sur mesure

Fait par Intello

```bash