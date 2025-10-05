// app.js - JavaScript commun pour toutes les pages

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#f43f5e'];

let globalData = [];
let charts = {};

// Charger les données depuis data.json
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Fichier data.json non trouvé');
        }
        const deputesData = await response.json();
        return processData(deputesData);
    } catch (error) {
        console.error('Erreur de chargement:', error);
        showError(error.message);
        return null;
    }
}

// Traiter les données brutes
function processData(deputesData) {
    const partiGroups = {};
    
    deputesData.forEach(depute => {
        const parti = depute.groupe_politique;
        if (!partiGroups[parti]) {
            partiGroups[parti] = [];
        }
        partiGroups[parti].push(depute);
    });

    const analysisData = Object.keys(partiGroups).map(parti => {
        const deputes = partiGroups[parti];
        const cspCounts = {};
        const genderCounts = { M: 0, F: 0 };
        
        deputes.forEach(d => {
            // Nettoyer les chiffres collés
            const csp = (d.Categorie_Socio || 'Non spécifié').replace(/\d+$/, '').trim();
            cspCounts[csp] = (cspCounts[csp] || 0) + 1;
            
            if (d.sexe === 'M') genderCounts.M++;
            else if (d.sexe === 'F') genderCounts.F++;
        });

        return {
            parti,
            total: deputes.length,
            categories: cspCounts,
            hommes: genderCounts.M,
            femmes: genderCounts.F
        };
    });

    analysisData.sort((a, b) => b.total - a.total);
    globalData = analysisData;
    return analysisData;
}

// Afficher une erreur
function showError(message) {
    const content = document.getElementById('content') || document.getElementById('app');
    if (content) {
        content.innerHTML = `
            <div class="card" style="text-align: center; padding: 3rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <h2>Erreur de chargement</h2>
                <p style="color: var(--gray-600); margin-top: 1rem;">${message}</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top: 2rem;">
                    Réessayer
                </button>
            </div>
        `;
    }
}

// === PAGE D'ACCUEIL ===
async function loadHomeStats() {
    const data = await loadData();
    if (!data) return;

    const totalDeputes = data.reduce((sum, p) => sum + p.total, 0);
    const totalPartis = data.length;
    const totalFemmes = data.reduce((sum, p) => sum + p.femmes, 0);
    const pariteFemmes = ((totalFemmes / totalDeputes) * 100).toFixed(1);

    document.getElementById('total-deputes').textContent = totalDeputes;
    document.getElementById('total-partis').textContent = totalPartis;
    document.getElementById('parite-femmes').textContent = pariteFemmes + '%';
}

// === PAGE COMPARAISON CSP ===
async function loadComparisonCSP() {
    const data = await loadData();
    if (!data) return;

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');

    renderComparisonChart(data);
    renderComparisonTable(data);
}

function renderComparisonChart(data) {
    const allCategories = new Set();
    data.forEach(parti => {
        Object.keys(parti.categories).forEach(cat => allCategories.add(cat));
    });

    const categories = Array.from(allCategories).sort();
    const datasets = data.slice(0, 10).map((parti, index) => ({
        label: parti.parti.substring(0, 35) + (parti.parti.length > 35 ? '...' : ''),
        data: categories.map(cat => {
            const count = parti.categories[cat] || 0;
            return parseFloat(((count / parti.total) * 100).toFixed(1));
        }),
        backgroundColor: COLORS[index % COLORS.length]
    }));

    const ctx = document.getElementById('comparison-chart');
    if (charts.comparison) charts.comparison.destroy();
    
    charts.comparison = new Chart(ctx, {
        type: 'bar',
        data: { labels: categories, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12 } },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (context) => context.dataset.label + ': ' + context.parsed.y + '%'
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Pourcentage (%)' } }
            }
        }
    });
}

function renderComparisonTable(data) {
    const table = document.getElementById('comparison-table');
    let html = `
        <thead>
            <tr>
                <th>Parti</th>
                <th class="text-center">Total</th>
                <th class="text-center">Cadres</th>
                <th class="text-center">Prof. inter.</th>
                <th class="text-center">Employés</th>
                <th class="text-center">Ouvriers</th>
            </tr>
        </thead>
        <tbody>
    `;

    data.forEach(parti => {
        const cadres = parti.categories['Cadres et professions intellectuelles supérieures'] || 0;
        const profInt = (parti.categories['Professions intermédiaires'] || 0) + (parti.categories['Professions Intermédiaires'] || 0);
        const employes = parti.categories['Employés'] || 0;
        const ouvriers = parti.categories['Ouvriers'] || 0;

        html += `
            <tr>
                <td class="font-medium">${parti.parti}</td>
                <td class="text-center">${parti.total}</td>
                <td class="text-center">${cadres} <span class="text-gray-400">(${((cadres/parti.total)*100).toFixed(1)}%)</span></td>
                <td class="text-center">${profInt} <span class="text-gray-400">(${((profInt/parti.total)*100).toFixed(1)}%)</span></td>
                <td class="text-center">${employes} <span class="text-gray-400">(${((employes/parti.total)*100).toFixed(1)}%)</span></td>
                <td class="text-center">${ouvriers} <span class="text-gray-400">(${ouvriers > 0 ? ((ouvriers/parti.total)*100).toFixed(1) : '0'}%)</span></td>
            </tr>
        `;
    });

    html += '</tbody>';
    table.innerHTML = html;
}

// === PAGE PARITÉ ===
async function loadPariteData() {
    const data = await loadData();
    if (!data) return;

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');

    renderPariteStats(data);
    renderPariteChart(data);
    renderPariteTable(data);
}

function renderPariteStats(data) {
    const totalHommes = data.reduce((sum, p) => sum + p.hommes, 0);
    const totalFemmes = data.reduce((sum, p) => sum + p.femmes, 0);
    const totalDeputes = totalHommes + totalFemmes;
    
    const best = data.reduce((max, p) => 
        (p.femmes / p.total) > (max.femmes / max.total) ? p : max
    , data[0]);
    
    const worst = data.reduce((min, p) => 
        (p.femmes / p.total) < (min.femmes / min.total) ? p : min
    , data[0]);

    document.getElementById('stats-cards').innerHTML = `
        <div class="stat-card success">
            <h4 class="stat-label">Meilleure parité</h4>
            <p class="stat-value">${((best.femmes / best.total) * 100).toFixed(1)}%</p>
            <p class="stat-desc">${best.parti}</p>
        </div>
        <div class="stat-card danger">
            <h4 class="stat-label">Plus faible parité</h4>
            <p class="stat-value">${((worst.femmes / worst.total) * 100).toFixed(1)}%</p>
            <p class="stat-desc">${worst.parti}</p>
        </div>
        <div class="stat-card info">
            <h4 class="stat-label">Moyenne Assemblée</h4>
            <p class="stat-value">${((totalFemmes/totalDeputes)*100).toFixed(1)}%</p>
            <p class="stat-desc">de femmes députées</p>
        </div>
    `;
}

function renderPariteChart(data) {
    const ctx = document.getElementById('gender-chart');
    if (charts.gender) charts.gender.destroy();

    charts.gender = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(p => p.parti.length > 35 ? p.parti.substring(0, 32) + '...' : p.parti),
            datasets: [
                {
                    label: 'Hommes (%)',
                    data: data.map(p => parseFloat(((p.hommes / p.total) * 100).toFixed(1))),
                    backgroundColor: '#3b82f6'
                },
                {
                    label: 'Femmes (%)',
                    data: data.map(p => parseFloat(((p.femmes / p.total) * 100).toFixed(1))),
                    backgroundColor: '#ec4899'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const parti = data[context.dataIndex];
                            const isHommes = context.datasetIndex === 0;
                            const count = isHommes ? parti.hommes : parti.femmes;
                            return `${context.dataset.label}: ${count} (${context.parsed.x}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Pourcentage (%)' }
                },
                y: { stacked: true }
            }
        }
    });
}

function renderPariteTable(data) {
    const totalHommes = data.reduce((sum, p) => sum + p.hommes, 0);
    const totalFemmes = data.reduce((sum, p) => sum + p.femmes, 0);
    const totalDeputes = totalHommes + totalFemmes;

    let html = `
        <thead>
            <tr>
                <th>Parti</th>
                <th class="text-center">Total</th>
                <th class="text-center">Hommes</th>
                <th class="text-center">Femmes</th>
                <th class="text-center">% Femmes</th>
                <th>Parité</th>
            </tr>
        </thead>
        <tbody>
    `;

    data.forEach(parti => {
        const percentFemmes = ((parti.femmes / parti.total) * 100).toFixed(1);
        const parite = parseFloat(percentFemmes);
        const colorClass = parite >= 40 ? 'text-green-600' : parite >= 30 ? 'text-yellow-600' : 'text-red-600';

        html += `
            <tr>
                <td class="font-medium">${parti.parti}</td>
                <td class="text-center">${parti.total}</td>
                <td class="text-center">${parti.hommes}</td>
                <td class="text-center">${parti.femmes}</td>
                <td class="text-center"><span class="${colorClass}">${percentFemmes}%</span></td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentFemmes}%"></div>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
        </tbody>
        <tfoot>
            <tr>
                <td>TOTAL ASSEMBLÉE</td>
                <td class="text-center">${totalDeputes}</td>
                <td class="text-center">${totalHommes}</td>
                <td class="text-center">${totalFemmes}</td>
                <td class="text-center">${((totalFemmes/totalDeputes)*100).toFixed(1)}%</td>
                <td></td>
            </tr>
        </tfoot>
    `;

    document.getElementById('gender-table').innerHTML = html;
}

// === PAGE DÉTAIL PAR PARTI ===
async function loadDetailParti() {
    const data = await loadData();
    if (!data) return;

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');

    // Remplir le sélecteur de partis
    const select = document.getElementById('parti-select');
    data.forEach(parti => {
        const option = document.createElement('option');
        option.value = parti.parti;
        option.textContent = `${parti.parti} (${parti.total} députés)`;
        select.appendChild(option);
    });

    // Afficher le premier parti par défaut
    renderDetailParti(data[0], data);

    // Écouter les changements
    select.addEventListener('change', (e) => {
        const selectedParti = data.find(p => p.parti === e.target.value);
        renderDetailParti(selectedParti, data);
    });
}

function renderDetailParti(parti, allData) {
    // Mettre à jour le titre
    document.getElementById('parti-name').textContent = parti.parti;
    document.getElementById('parti-total').textContent = `${parti.total} députés`;

    // Statistiques
    const percentFemmes = ((parti.femmes / parti.total) * 100).toFixed(1);
    const cadres = parti.categories['Cadres et professions intellectuelles supérieures'] || 0;
    const percentCadres = ((cadres / parti.total) * 100).toFixed(1);

    document.getElementById('parti-stats').innerHTML = `
        <div class="stat-card info">
            <h4 class="stat-label">Femmes</h4>
            <p class="stat-value">${parti.femmes}</p>
            <p class="stat-desc">${percentFemmes}% du groupe</p>
        </div>
        <div class="stat-card success">
            <h4 class="stat-label">Cadres</h4>
            <p class="stat-value">${cadres}</p>
            <p class="stat-desc">${percentCadres}% du groupe</p>
        </div>
        <div class="stat-card danger">
            <h4 class="stat-label">Classement</h4>
            <p class="stat-value">${allData.findIndex(p => p.parti === parti.parti) + 1}</p>
            <p class="stat-desc">sur ${allData.length} groupes</p>
        </div>
    `;

    // Graphique camembert
    renderDetailChart(parti);

    // Liste détaillée
    renderDetailList(parti);
}

function renderDetailChart(parti) {
    const detailData = Object.entries(parti.categories)
        .map(([category, count]) => ({
            name: category,
            value: count,
            percentage: ((count / parti.total) * 100).toFixed(1)
        }))
        .sort((a, b) => b.value - a.value);

    const ctx = document.getElementById('detail-chart');
    if (charts.detail) charts.detail.destroy();

    charts.detail = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: detailData.map(d => d.name),
            datasets: [{
                data: detailData.map(d => d.value),
                backgroundColor: COLORS,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 11 }, padding: 10 }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const item = detailData[context.dataIndex];
                            return `${item.name}: ${item.value} (${item.percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderDetailList(parti) {
    const detailData = Object.entries(parti.categories)
        .map(([category, count]) => ({
            name: category,
            value: count,
            percentage: ((count / parti.total) * 100).toFixed(1)
        }))
        .sort((a, b) => b.value - a.value);

    let html = '';
    detailData.forEach((item, index) => {
        html += `
            <div class="flex items-center" style="margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 8px;">
                <div class="color-dot" style="background-color: ${COLORS[index % COLORS.length]}; margin-right: 1rem;"></div>
                <div style="flex: 1;">
                    <div class="flex justify-between items-center" style="margin-bottom: 0.5rem;">
                        <span class="text-sm font-medium text-gray-700">${item.name}</span>
                        <span class="text-sm text-gray-500">${item.value} (${item.percentage}%)</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${item.percentage}%; background-color: ${COLORS[index % COLORS.length]}"></div>
                    </div>
                </div>
            </div>
        `;
    });

    document.getElementById('detail-list').innerHTML = html;
}

// === FONCTIONS ADDITIONNELLES pour les nouvelles pages ===
// À ajouter à la fin de votre app.js existant

// === PAGE ÂGE PAR PARTI ===

function calculerAge(dateNaissance) {
    // Extraire l'année de naissance depuis le format "Né le XX mois YYYY"
    const match = dateNaissance.match(/\d{4}/);
    if (!match) return null;
    const anneeNaissance = parseInt(match[0]);
    const anneeActuelle = 2024;
    return anneeActuelle - anneeNaissance;
}

async function loadAgeData() {
    try {
        const response = await fetch('data.json');
        const deputesData = await response.json();
        
        // Calculer les âges
        const deputesAvecAge = deputesData.map(d => ({
            ...d,
            age: d.date_naissance ? calculerAge(d.date_naissance) : null
        })).filter(d => d.age !== null);

        // Grouper par parti
        const partiGroups = {};
        deputesAvecAge.forEach(depute => {
            const parti = depute.groupe_politique;
            if (!partiGroups[parti]) partiGroups[parti] = [];
            partiGroups[parti].push(depute);
        });

        // Calculer statistiques par parti
        const ageStats = Object.keys(partiGroups).map(parti => {
            const ages = partiGroups[parti].map(d => d.age);
            const moyenne = ages.reduce((a, b) => a + b, 0) / ages.length;
            
            // Compter par tranches
            const tranches = {
                'Moins de 30': ages.filter(a => a < 30).length,
                '30-40': ages.filter(a => a >= 30 && a < 40).length,
                '40-50': ages.filter(a => a >= 40 && a < 50).length,
                '50-60': ages.filter(a => a >= 50 && a < 60).length,
                '60-70': ages.filter(a => a >= 60 && a < 70).length,
                'Plus de 70': ages.filter(a => a >= 70).length
            };

            return {
                parti,
                moyenne: moyenne.toFixed(1),
                min: Math.min(...ages),
                max: Math.max(...ages),
                total: ages.length,
                tranches
            };
        }).sort((a, b) => b.total - a.total);

        // Stats globales
        const tousAges = deputesAvecAge.map(d => d.age);
        const moyenneGlobale = (tousAges.reduce((a, b) => a + b, 0) / tousAges.length).toFixed(1);
        const plusJeune = Math.min(...tousAges);
        const plusAge = Math.max(...tousAges);
        const moins40 = tousAges.filter(a => a < 40).length;

        document.getElementById('age-moyen-global').textContent = moyenneGlobale;
        document.getElementById('plus-jeune').textContent = plusJeune;
        document.getElementById('plus-age').textContent = plusAge;
        
        // Tranche dominante
        const allTranches = {
            'Moins de 30': tousAges.filter(a => a < 30).length,
            '30-40': tousAges.filter(a => a >= 30 && a < 40).length,
            '40-50': tousAges.filter(a => a >= 40 && a < 50).length,
            '50-60': tousAges.filter(a => a >= 50 && a < 60).length,
            '60+': tousAges.filter(a => a >= 60).length
        };
        const trancheDominante = Object.entries(allTranches).sort((a, b) => b[1] - a[1])[0][0];
        document.getElementById('tranche-dominante').textContent = trancheDominante + ' ans';

        // Parti le plus jeune et le plus âgé
        const partiPlusJeune = ageStats.reduce((min, p) => parseFloat(p.moyenne) < parseFloat(min.moyenne) ? p : min);
        const partiPlusAge = ageStats.reduce((max, p) => parseFloat(p.moyenne) > parseFloat(max.moyenne) ? p : max);

        document.getElementById('parti-plus-jeune-age').textContent = partiPlusJeune.moyenne + ' ans';
        document.getElementById('parti-plus-jeune-nom').textContent = partiPlusJeune.parti;
        document.getElementById('parti-plus-age-age').textContent = partiPlusAge.moyenne + ' ans';
        document.getElementById('parti-plus-age-nom').textContent = partiPlusAge.parti;
        document.getElementById('moins-40-count').textContent = moins40;
        document.getElementById('moins-40-percent').textContent = ((moins40 / tousAges.length) * 100).toFixed(1) + '% des députés';

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('content').classList.remove('hidden');

        renderAgeMoyenChart(ageStats);
        renderAgeDistributionChart(ageStats);
        renderAgeTable(ageStats);

    } catch (error) {
        showError('Erreur lors du chargement des données : ' + error.message);
    }
}

function renderAgeMoyenChart(ageStats) {
    const ctx = document.getElementById('age-moyen-chart');
    if (charts.ageMoyen) charts.ageMoyen.destroy();

    charts.ageMoyen = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ageStats.map(p => p.parti.substring(0, 30)),
            datasets: [{
                label: 'Âge moyen (années)',
                data: ageStats.map(p => parseFloat(p.moyenne)),
                backgroundColor: COLORS[0]
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `Âge moyen: ${context.parsed.x} ans`
                    }
                }
            },
            scales: {
                x: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Âge moyen (années)' }
                }
            }
        }
    });
}

function renderAgeDistributionChart(ageStats) {
    const ctx = document.getElementById('age-distribution-chart');
    if (charts.ageDistribution) charts.ageDistribution.destroy();

    const trancheNames = ['Moins de 30', '30-40', '40-50', '50-60', '60-70', 'Plus de 70'];
    const datasets = ageStats.slice(0, 8).map((parti, index) => ({
        label: parti.parti.substring(0, 30),
        data: trancheNames.map(t => parti.tranches[t] || 0),
        backgroundColor: COLORS[index % COLORS.length]
    }));

    charts.ageDistribution = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: trancheNames,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Nombre de députés' }
                }
            }
        }
    });
}

function renderAgeTable(ageStats) {
    let html = `
        <thead>
            <tr>
                <th>Parti</th>
                <th class="text-center">Total</th>
                <th class="text-center">Âge moyen</th>
                <th class="text-center">Plus jeune</th>
                <th class="text-center">Plus âgé</th>
                <th class="text-center">Moins de 40</th>
            </tr>
        </thead>
        <tbody>
    `;

    ageStats.forEach(parti => {
        const moins40 = parti.tranches['Moins de 30'] + parti.tranches['30-40'];
        const percentMoins40 = ((moins40 / parti.total) * 100).toFixed(1);

        html += `
            <tr>
                <td class="font-medium">${parti.parti}</td>
                <td class="text-center">${parti.total}</td>
                <td class="text-center font-semibold">${parti.moyenne} ans</td>
                <td class="text-center">${parti.min} ans</td>
                <td class="text-center">${parti.max} ans</td>
                <td class="text-center">${moins40} <span class="text-gray-400">(${percentMoins40}%)</span></td>
            </tr>
        `;
    });

    html += '</tbody>';
    document.getElementById('age-table').innerHTML = html;
}

// === PAGE CSP × GENRE - VERSION COMPLÈTE CORRIGÉE ===

function calculerCSPGenre(deputesData, filter) {
    const cspGenre = {};
    
    deputesData.forEach(depute => {
        // Nettoyer la CSP
        let csp = (depute.Categorie_Socio || 'Non spécifié').replace(/\d+$/, '').trim();
        
        // Normaliser les noms
        if (csp.includes('Artisan') || csp.includes('commerçant') || csp.includes('chef')) {
            csp = 'Artisans, commerçants, chefs d\'entreprises';
        } else if (csp.includes('Cadres')) {
            csp = 'Cadres et professions intellectuelles supérieures';
        } else if (csp.includes('Professions intermédiaires') || csp.includes('Professions Intermédiaires')) {
            csp = 'Professions intermédiaires';
        } else if (csp === 'Agriculteurs exploitants') {
            csp = 'Agriculteurs exploitants';
        }
        
        if (!cspGenre[csp]) {
            cspGenre[csp] = { hommes: 0, femmes: 0, total: 0 };
        }
        
        if (depute.sexe === 'M') {
            cspGenre[csp].hommes++;
        } else if (depute.sexe === 'F') {
            cspGenre[csp].femmes++;
        }
        cspGenre[csp].total++;
    });
    
    return cspGenre;
}

async function loadCSPGenreData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Fichier data.json non trouvé');
        }
        const deputesData = await response.json();
        
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('content').classList.remove('hidden');

        // Calculer la répartition CSP × Genre globale
        const cspGenreGlobal = calculerCSPGenre(deputesData, 'all');
        
        // Grouper par parti pour le sélecteur
        const partiGroups = {};
        deputesData.forEach(depute => {
            const parti = depute.groupe_politique;
            if (!partiGroups[parti]) {
                partiGroups[parti] = [];
            }
            partiGroups[parti].push(depute);
        });

        // Remplir le sélecteur de partis
        const select = document.getElementById('parti-select');
        Object.keys(partiGroups).sort((a, b) => partiGroups[b].length - partiGroups[a].length).forEach(parti => {
            const option = document.createElement('option');
            option.value = parti;
            option.textContent = `${parti} (${partiGroups[parti].length} députés)`;
            select.appendChild(option);
        });

        // Afficher les données globales
        renderCSPGenreChart(cspGenreGlobal);
        renderCSPGenreVisualMatrix(cspGenreGlobal);
        renderCSPGenreTable(cspGenreGlobal);
        renderPartiCSPGenreChart(cspGenreGlobal);

        // Écouter les changements de parti
        select.addEventListener('change', (e) => {
            const selectedParti = e.target.value;
            if (selectedParti === 'all') {
                const data = calculerCSPGenre(deputesData, 'all');
                renderPartiCSPGenreChart(data);
            } else {
                const data = calculerCSPGenre(partiGroups[selectedParti], selectedParti);
                renderPartiCSPGenreChart(data);
            }
        });

    } catch (error) {
        console.error('Erreur:', error);
        showError('Erreur lors du chargement des données : ' + error.message);
    }
}

function renderCSPGenreChart(cspGenreData) {
    const ctx = document.getElementById('csp-genre-chart');
    if (!ctx) {
        console.error('Element csp-genre-chart introuvable');
        return;
    }
    
    if (charts.cspGenre) charts.cspGenre.destroy();

    const categories = Object.keys(cspGenreData).sort((a, b) => cspGenreData[b].total - cspGenreData[a].total);
    const mobile = window.innerWidth < 768;

    charts.cspGenre = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories.map(c => mobile && c.length > 20 ? c.substring(0, 17) + '...' : c),
            datasets: [
                {
                    label: 'Hommes',
                    data: categories.map(c => cspGenreData[c].hommes),
                    backgroundColor: COLORS[0]
                },
                {
                    label: 'Femmes',
                    data: categories.map(c => cspGenreData[c].femmes),
                    backgroundColor: COLORS[5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: mobile ? 'bottom' : 'top',
                    labels: {
                        font: { size: mobile ? 10 : 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        afterLabel: (context) => {
                            const csp = categories[context.dataIndex];
                            const total = cspGenreData[csp].total;
                            const percent = ((context.parsed.y / total) * 100).toFixed(1);
                            return `${percent}% de cette CSP`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: { size: mobile ? 9 : 11 },
                        maxRotation: mobile ? 45 : 0
                    }
                },
                y: { 
                    beginAtZero: true,
                    stacked: false,
                    title: { 
                        display: !mobile,
                        text: 'Nombre de députés',
                        font: { size: mobile ? 10 : 12 }
                    },
                    ticks: {
                        font: { size: mobile ? 9 : 11 }
                    }
                }
            }
        }
    });
}

function renderCSPGenreVisualMatrix(cspGenreData) {
    const container = document.getElementById('csp-genre-matrix');
    if (!container) {
        console.error('Element csp-genre-matrix introuvable');
        return;
    }
    
    const categories = Object.keys(cspGenreData).sort((a, b) => cspGenreData[b].total - cspGenreData[a].total);
    
    let html = '';
    
    categories.forEach(csp => {
        const data = cspGenreData[csp];
        const percentHommes = data.total > 0 ? ((data.hommes / data.total) * 100).toFixed(1) : 0;
        const percentFemmes = data.total > 0 ? ((data.femmes / data.total) * 100).toFixed(1) : 0;
        
        // Couleur selon la parité
        const parite = parseFloat(percentFemmes);
        const bgColor = parite >= 45 ? '#10b981' : parite >= 35 ? '#f59e0b' : '#ef4444';
        
        html += `
            <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 8px; border-left: 4px solid ${bgColor};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                    <h4 style="margin: 0; font-weight: 600; color: var(--gray-900); font-size: 1rem;">${csp}</h4>
                    <span style="background: ${bgColor}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem; font-weight: 600;">
                        ${percentFemmes}% de femmes
                    </span>
                </div>
                
                <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <div style="flex: ${percentHommes}; background: #3b82f6; height: 32px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.875rem; font-weight: 600; min-width: 60px;">
                        ${data.hommes} H
                    </div>
                    <div style="flex: ${percentFemmes}; background: #ec4899; height: 32px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.875rem; font-weight: 600; min-width: 60px;">
                        ${data.femmes} F
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--gray-600);">
                    <span>Hommes: ${percentHommes}%</span>
                    <span>Total: ${data.total}</span>
                    <span>Femmes: ${percentFemmes}%</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderPartiCSPGenreChart(cspGenreData) {
    const ctx = document.getElementById('parti-csp-genre-chart');
    if (!ctx) {
        console.error('Element parti-csp-genre-chart introuvable');
        return;
    }
    
    if (charts.partiCSPGenre) charts.partiCSPGenre.destroy();

    const categories = Object.keys(cspGenreData).sort((a, b) => cspGenreData[b].total - cspGenreData[a].total);

    charts.partiCSPGenre = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories.map(c => c.length > 35 ? c.substring(0, 32) + '...' : c),
            datasets: [
                {
                    label: 'Hommes',
                    data: categories.map(c => cspGenreData[c].hommes),
                    backgroundColor: '#3b82f6'
                },
                {
                    label: 'Femmes',
                    data: categories.map(c => cspGenreData[c].femmes),
                    backgroundColor: '#ec4899'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        afterLabel: (context) => {
                            const csp = categories[context.dataIndex];
                            const total = cspGenreData[csp].total;
                            const percent = ((context.parsed.y / total) * 100).toFixed(1);
                            return `${percent}% de cette CSP`;
                        }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    stacked: false,
                    title: { display: true, text: 'Nombre de députés' }
                }
            }
        }
    });
}

function renderCSPGenreTable(cspGenreData) {
    const table = document.getElementById('csp-genre-table');
    if (!table) {
        console.error('Element csp-genre-table introuvable');
        return;
    }
    
    const categories = Object.keys(cspGenreData).sort((a, b) => cspGenreData[b].total - cspGenreData[a].total);
    
    let html = `
        <thead>
            <tr>
                <th>CSP</th>
                <th class="text-center">Hommes</th>
                <th class="text-center">Femmes</th>
                <th class="text-center">Total</th>
                <th class="text-center">% Femmes</th>
            </tr>
        </thead>
        <tbody>
    `;

    categories.forEach(csp => {
        const data = cspGenreData[csp];
        const percentFemmes = data.total > 0 ? ((data.femmes / data.total) * 100).toFixed(1) : '0.0';
        const parite = parseFloat(percentFemmes);
        const colorClass = parite >= 40 ? 'text-green-600' : parite >= 30 ? 'text-yellow-600' : 'text-red-600';

        html += `
            <tr>
                <td class="font-medium">${csp}</td>
                <td class="text-center">${data.hommes}</td>
                <td class="text-center">${data.femmes}</td>
                <td class="text-center font-semibold">${data.total}</td>
                <td class="text-center"><span class="${colorClass} font-semibold">${percentFemmes}%</span></td>
            </tr>
        `;
    });

    // Total
    const totalHommes = categories.reduce((sum, csp) => sum + cspGenreData[csp].hommes, 0);
    const totalFemmes = categories.reduce((sum, csp) => sum + cspGenreData[csp].femmes, 0);
    const totalGeneral = totalHommes + totalFemmes;
    const totalPercentFemmes = ((totalFemmes / totalGeneral) * 100).toFixed(1);

    html += `
        </tbody>
        <tfoot style="background: var(--gray-100); font-weight: bold;">
            <tr>
                <td>TOTAL ASSEMBLÉE</td>
                <td class="text-center">${totalHommes}</td>
                <td class="text-center">${totalFemmes}</td>
                <td class="text-center">${totalGeneral}</td>
                <td class="text-center">${totalPercentFemmes}%</td>
            </tr>
        </tfoot>
    `;

    table.innerHTML = html;
}
// === PAGE REPRÉSENTATIVITÉ - VERSION AVEC DONNÉES INSEE 2024 OFFICIELLES ===
// Remplacez la fonction loadRepresentativiteData() dans votre app.js par celle-ci

async function loadRepresentativiteData() {
    const data = await loadData();
    if (!data) return;

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');

    // Données officielles INSEE 2024 (Enquête Emploi)
    // Source: https://www.insee.fr/fr/statistiques/2489546
    const populationData = {
        'Agriculteurs exploitants': 1.3,
        'Artisans, commerçants, chefs d\'entreprises': 6.8,
        'Cadres et professions intellectuelles supérieures': 23.0,
        'Professions intermédiaires': 25.2,
        'Employés': 24.8,
        'Ouvriers': 18.0
    };

    // Calculer la répartition à l'Assemblée
    const totalDeputes = data.reduce((sum, p) => sum + p.total, 0);
    const assembleeDataRaw = {};
    
    data.forEach(parti => {
        Object.entries(parti.categories).forEach(([csp, count]) => {
            // Nettoyer le nom de la CSP
            let cspClean = csp.replace(/\d+$/, '').trim();
            
            // Normaliser les noms pour correspondre aux catégories INSEE
            if (cspClean === 'Agriculteurs exploitants') {
                cspClean = 'Agriculteurs exploitants';
            } else if (cspClean.includes('Artisan') || cspClean.includes('commerçant') || cspClean.includes('chef')) {
                cspClean = 'Artisans, commerçants, chefs d\'entreprises';
            } else if (cspClean.includes('Cadres')) {
                cspClean = 'Cadres et professions intellectuelles supérieures';
            } else if (cspClean.includes('Professions intermédiaires') || cspClean.includes('Professions Intermédiaires')) {
                cspClean = 'Professions intermédiaires';
            } else if (cspClean === 'Employés') {
                cspClean = 'Employés';
            } else if (cspClean === 'Ouvriers') {
                cspClean = 'Ouvriers';
            }
            
            assembleeDataRaw[cspClean] = (assembleeDataRaw[cspClean] || 0) + count;
        });
    });

    // Convertir en pourcentages
    const assembleeData = {};
    Object.keys(assembleeDataRaw).forEach(csp => {
        assembleeData[csp] = ((assembleeDataRaw[csp] / totalDeputes) * 100).toFixed(1);
    });

    renderRepresentativiteCSPChart(populationData, assembleeData);
    renderRepresentativiteGenreChart();
    renderRepresentativiteAgeChart();
    renderEcartsTable(populationData, assembleeData);
}

function renderRepresentativiteCSPChart(populationData, assembleeData) {
    const ctx = document.getElementById('representativite-csp-chart');
    if (charts.repCSP) charts.repCSP.destroy();

    const categories = Object.keys(populationData);

    charts.repCSP = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories.map(c => c.length > 40 ? c.substring(0, 37) + '...' : c),
            datasets: [
                {
                    label: 'Population active INSEE 2024 (%)',
                    data: categories.map(c => populationData[c]),
                    backgroundColor: COLORS[2]
                },
                {
                    label: 'Assemblée nationale (%)',
                    data: categories.map(c => parseFloat(assembleeData[c] || 0)),
                    backgroundColor: COLORS[0]
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.parsed.y}%`
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Pourcentage (%)' }
                }
            }
        }
    });
}

function renderRepresentativiteGenreChart() {
    const ctx = document.getElementById('representativite-genre-chart');
    if (charts.repGenre) charts.repGenre.destroy();

    // Données genre - INSEE 2024: 50/50 dans la population
    // Assemblée: environ 37% de femmes (à calculer depuis vos données réelles)
    const assembleeHommes = 63;
    const assembleeFemmes = 37;

    charts.repGenre = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Hommes', 'Femmes'],
            datasets: [
                {
                    label: 'Population (%)',
                    data: [50, 50],
                    backgroundColor: [COLORS[0] + '80', COLORS[5] + '80'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: {
                    display: true,
                    text: `Population: 50/50 | Assemblée: ${assembleeHommes}/${assembleeFemmes}`,
                    font: { size: 14, weight: 'bold' }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.parsed;
                            return `${label}: ${value}% (Population)`;
                        }
                    }
                }
            }
        }
    });
}

function renderRepresentativiteAgeChart() {
    const ctx = document.getElementById('representativite-age-chart');
    if (charts.repAge) charts.repAge.destroy();

    // Données approximatives pour l'âge (à affiner avec vos données réelles)
    charts.repAge = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['18-30', '30-45', '45-60', '60+'],
            datasets: [
                {
                    label: 'Population active (%)',
                    data: [15, 35, 35, 15],
                    backgroundColor: COLORS[2]
                },
                {
                    label: 'Assemblée (%)',
                    data: [2, 25, 55, 18],
                    backgroundColor: COLORS[0]
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { 
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        footer: () => 'Note: Données âge approximatives'
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Pourcentage (%)' }
                }
            }
        }
    });
}

function renderEcartsTable(populationData, assembleeData) {
    let html = '';
    
    Object.keys(populationData).forEach(csp => {
        const popPercent = populationData[csp];
        const assPercent = parseFloat(assembleeData[csp] || 0);
        const ecart = (assPercent - popPercent).toFixed(1);
        const ratio = popPercent > 0 ? (assPercent / popPercent).toFixed(1) : 'N/A';
        
        const isOver = assPercent > popPercent;
        const colorClass = isOver ? 'text-green-600' : 'text-red-600';
        const icon = isOver ? '↑' : '↓';

        html += `
            <tr>
                <td class="font-medium">${csp}</td>
                <td class="text-center">${popPercent}%</td>
                <td class="text-center">${assPercent}%</td>
                <td class="text-center ${colorClass} font-semibold">${ecart > 0 ? '+' : ''}${ecart} pts</td>
                <td>
                    <span class="${colorClass}">${icon} ${isOver ? 'Sur' : 'Sous'}-représenté (×${ratio})</span>
                </td>
            </tr>
        `;
    });

    document.getElementById('ecarts-tbody').innerHTML = html;
}