// Configuration Firebase
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_AUTH_DOMAIN",
    databaseURL: "https://esp32-f538f-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_STORAGE_BUCKET",
    messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
    appId: "VOTRE_APP_ID"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variables pour les graphiques
let temperatureData = [];
let humidityData = [];
let lightData = [];
let temperatureLabels = [];
const maxDataPoints = 20;

// Fonction pour redimensionner les graphiques
function resizeCharts() {
    temperatureChart.resize();
    humidityChart.resize();
    lightChart.resize();
}

// Fonction pour afficher la date et l'heure actuelles
function updateDateTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const formattedTime = `${hours}:${minutes}:${seconds}`;
    document.getElementById('current-date').textContent = formattedDate;
    document.getElementById('current-time').textContent = formattedTime;
}

// Mettre à jour la date et l'heure toutes les secondes
setInterval(updateDateTime, 1000);

// Initialiser les graphiques
const temperatureCtx = document.getElementById('temperatureChart').getContext('2d');
const humidityCtx = document.getElementById('humidityChart').getContext('2d');
const lightCtx = document.getElementById('lightChart').getContext('2d');

const temperatureChart = new Chart(temperatureCtx, {
    type: 'line',
    data: {
        labels: temperatureLabels,
        datasets: [{
            label: 'Température (°C)',
            data: temperatureData,
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1,
            fill: false
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: false
            }
        }
    }
});

const humidityChart = new Chart(humidityCtx, {
    type: 'line',
    data: {
        labels: temperatureLabels,
        datasets: [{
            label: 'Humidité (%)',
            data: humidityData,
            borderColor: 'rgb(54, 162, 235)',
            tension: 0.1,
            fill: false
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: false
            }
        }
    }
});

const lightChart = new Chart(lightCtx, {
    type: 'line',
    data: {
        labels: temperatureLabels,
        datasets: [{
            label: 'Luminosité (lux)',
            data: lightData,
            borderColor: 'rgb(255, 206, 86)',
            tension: 0.1,
            fill: false
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: false
            }
        }
    }
});

// Récupérer les données depuis Firebase
database.ref('/donnees').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        document.getElementById('temperature').textContent = data.temperature + " °C";
        document.getElementById('humidite').textContent = data.humidite + " %";
        document.getElementById('luminosite').textContent = data.luminosite + " lux";
        const now = new Date();
        const time = now.toLocaleTimeString();
        temperatureData.push(data.temperature);
        humidityData.push(data.humidite);
        lightData.push(data.luminosite);
        temperatureLabels.push(time);
        if (temperatureData.length > maxDataPoints) {
            temperatureData.shift();
            humidityData.shift();
            lightData.shift();
            temperatureLabels.shift();
        }
        temperatureChart.update();
        humidityChart.update();
        lightChart.update();
    }
});

// Gestion des seuils
document.getElementById('setTempThreshold').addEventListener('click', () => {
    const threshold = document.getElementById('tempThreshold').value;
    if (threshold) {
        database.ref('/seuils/temperature').set(parseFloat(threshold));
        alert(`Seuil de température défini à ${threshold} °C`);
    }
});

document.getElementById('setHumidityThreshold').addEventListener('click', () => {
    const threshold = document.getElementById('humidityThreshold').value;
    if (threshold) {
        database.ref('/seuils/humidite').set(parseFloat(threshold));
        alert(`Seuil d'humidité défini à ${threshold} %`);
    }
});

// Changer de thème
document.getElementById('themeToggle').addEventListener('click', () => {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
});

// Charger le thème enregistré
if (localStorage.getItem('theme') === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
}

// Sauvegarder la position des widgets dans localStorage
function saveWidgetPositions() {
    const widgetsGrid = document.querySelector('.widgets-grid');
    const cells = widgetsGrid.querySelectorAll('.grid-cell');
    const positions = {};

    cells.forEach((cell, index) => {
        const widget = cell.querySelector('.widget');
        if (widget) {
            positions[widget.id] = index;
        }
    });

    localStorage.setItem('widgetPositions', JSON.stringify(positions));
}

// Charger la position des widgets depuis localStorage
function loadWidgetPositions() {
    const savedPositions = localStorage.getItem('widgetPositions');
    if (savedPositions) {
        const positions = JSON.parse(savedPositions);
        const widgetsGrid = document.querySelector('.widgets-grid');
        const cells = widgetsGrid.querySelectorAll('.grid-cell');

        for (const widgetId in positions) {
            const widget = document.getElementById(widgetId);
            const cellIndex = positions[widgetId];
            if (widget && cells[cellIndex]) {
                cells[cellIndex].appendChild(widget);
            }
        }
    }
}

// Initialiser le Drag and Drop
let draggedWidget = null;

document.querySelectorAll('.widget').forEach(widget => {
    widget.addEventListener('dragstart', (e) => {
        draggedWidget = widget;
        e.dataTransfer.setData('text/plain', widget.id);
        widget.style.opacity = '0.5';
    });

    widget.addEventListener('dragend', () => {
        widget.style.opacity = '1';
        saveWidgetPositions(); // Sauvegarder les positions après un déplacement
    });
});

document.querySelectorAll('.grid-cell').forEach(cell => {
    cell.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    cell.addEventListener('drop', (e) => {
        e.preventDefault();
        const widgetId = e.dataTransfer.getData('text/plain');
        const widget = document.getElementById(widgetId);
        const targetCell = e.currentTarget;

        // Échanger les widgets
        if (targetCell.querySelector('.widget')) {
            const targetWidget = targetCell.querySelector('.widget');
            const sourceCell = draggedWidget.parentElement;
            sourceCell.appendChild(targetWidget);
        }

        targetCell.appendChild(widget);
        saveWidgetPositions(); // Sauvegarder les positions après un déplacement
    });
});

// Charger les positions des widgets au démarrage
loadWidgetPositions();

// Redimensionner les graphiques lors du chargement et du redimensionnement de la fenêtre
window.addEventListener('load', resizeCharts);
window.addEventListener('resize', resizeCharts);
