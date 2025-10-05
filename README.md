# 📊 Analyse Députés - Assemblée Nationale 2024

Visualisations interactives et analyses approfondies de la composition socio-démographique de l'Assemblée nationale française.

🔗 **[Voir le site en ligne](https://florentgl.github.io/Politique-data/)**

## 📋 Vue d'ensemble

Ce projet propose une série d'analyses visuelles et statistiques sur les députés de l'Assemblée nationale (législature 2024), avec un focus sur :

- Les catégories socio-professionnelles (CSP)
- La parité hommes-femmes
- L'âge et les générations
- Les croisements CSP × Genre
- La représentativité par rapport à la population française

## 🎯 Analyses disponibles

### 1. **Comparaison des CSP par parti**
Répartition des catégories socio-professionnelles dans chaque groupe parlementaire. Révèle la surreprésentation des cadres (52% à 91% selon les partis) et l'absence quasi-totale des classes populaires.

### 2. **Détail par parti**
Exploration approfondie de la composition socio-professionnelle de chaque groupe politique avec graphiques en camembert et statistiques détaillées.

### 3. **Parité Hommes-Femmes**
Analyse de la représentation féminine par parti politique. Montre que la parité globale (37% de femmes) cache de fortes disparités entre groupes (de 20% à 55%).

### 4. **Âge par parti**
Pyramide des âges et distribution générationnelle. Âge moyen de 50 ans avec des écarts significatifs entre partis (de 45 à 58 ans).

### 5. **CSP × Genre (Analyse croisée)**
**Révélation majeure** : Contrairement à l'hypothèse du "sur-élitisme féminin", les données montrent une distribution quasi-identique entre hommes et femmes députés (68% de cadres pour les deux genres). La classe sociale prime sur le genre comme déterminant d'accès au Parlement.

### 6. **Représentativité**
Comparaison avec les données INSEE 2024 de la population active. Écarts massifs : les cadres sont surreprésentés ×3, les ouvriers sous-représentés ×20.

## 🛠️ Technologies utilisées

- **HTML5/CSS3** : Structure et design moderne responsive
- **JavaScript (Vanilla)** : Logique et manipulation des données
- **Chart.js v4.4.0** : Graphiques interactifs (barres, camemberts, courbes)
- **Design** : CSS custom avec variables, gradients, et animations
- **Analytics** : Google Analytics 4 (avec consentement cookies RGPD)

## 📊 Source des données

- **Députés** : [Assemblée nationale - Open Data](https://data.assemblee-nationale.fr/)
- **Population** : [INSEE - Enquête Emploi 2024](https://www.insee.fr/fr/statistiques/2489546)

## 🎨 Structure du projet

```
├── index.html                      # Page d'accueil
├── comparaison-csp.html           # Comparaison CSP par parti
├── detail-parti.html              # Détail d'un parti
├── parite-hommes-femmes.html      # Analyse parité H/F
├── age-par-parti.html             # Analyse âge
├── csp-genre.html                 # Croisement CSP×Genre
├── representativite.html          # Écarts avec population
├── a-propos.html                  # À propos
├── mentions-legales.html          # Mentions légales
├── style.css                      # Styles globaux responsive
├── app.js                         # Logique JavaScript
└── data.json                      # Données des députés
```

## 🔍 Points clés des analyses

### Constat 1 : Une Assemblée de cadres
Tous les partis sans exception ont une majorité de députés issus des CSP supérieures (52% minimum), avec une moyenne de 68%. Les cadres représentent pourtant seulement 23% de la population active.

### Constat 2 : L'absence des classes populaires
Employés et ouvriers (43% de la population) représentent moins de 7% des députés. Certains partis n'ont aucun ouvrier.

### Constat 3 : Pas de "sur-élitisme" féminin
L'analyse CSP×Genre révèle que hommes et femmes députés ont des profils quasi-identiques :
- Cadres : 68.0% hommes vs 67.0% femmes (-1.0 pt)
- Employés : 5.7% pour les deux (parité parfaite)
- Classes populaires : 6.5% hommes vs 7.1% femmes

**Conclusion** : La classe sociale est un déterminant plus fort que le genre pour accéder au Parlement.

### Constat 4 : Parité numérique, pas sociale
37% de femmes députées, mais la parité ne résout pas la question de la représentativité sociale. Femmes et hommes partagent le même élitisme.

## 📱 Responsive Design

Le site est entièrement responsive avec des breakpoints pour :
- Desktop (>1024px)
- Tablette (641-1024px)
- Mobile (481-640px)
- Petit mobile (<480px)

Les graphiques s'adaptent automatiquement avec :
- Hauteurs variables selon la taille d'écran
- Rotation des labels sur mobile
- Légendes repositionnées
- Tailles de police ajustées

## 🚀 Installation locale

```bash
# Cloner le repository
git clone https://github.com/florentgl/Politique-data.git

# Ouvrir le projet
cd Politique-data

# Lancer un serveur local (exemple avec Python)
python -m http.server 8000

# Ou avec Node.js
npx http-server
```

Puis ouvrir `http://localhost:8000` dans votre navigateur.

## 🔧 Fonctionnalités techniques

### Gestion des données
- Chargement asynchrone du fichier `data.json`
- Calculs dynamiques des statistiques
- Normalisation des noms de CSP
- Calcul automatique des âges depuis les dates de naissance

### Graphiques interactifs
- Tooltips avec détails au survol
- Redimensionnement automatique (resize listeners)
- Adaptation mobile/desktop
- Couleurs cohérentes entre graphiques

### Performance
- Destruction des graphiques avant recréation (évite les fuites mémoire)
- Debouncing sur les événements resize (250ms)
- Chargement des données en cache

## 📄 Licence

MIT License - Libre d'utilisation avec attribution

## 👤 Auteur

**Florent GL**
- GitHub: [@florentgl](https://github.com/florentgl)
- Projet: [Politique-data](https://github.com/florentgl/Politique-data)

## 🤝 Contributions

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles analyses
- Améliorer le design
- Mettre à jour les données

## 📝 Notes méthodologiques

### Normalisation des CSP
Les catégories ont été normalisées pour correspondre aux classifications INSEE :
- Regroupement des variantes orthographiques
- Nettoyage des chiffres collés aux noms
- Harmonisation "Professions intermédiaires" / "Professions Intermédiaires"

### Calcul de l'âge
Âge calculé comme : `2024 - année de naissance`

### Limitations
- Données limitées à la législature 2024
- Certains députés ont des CSP "Non spécifié" ou "Sans profession déclarée"
- Les comparaisons INSEE utilisent la population active, pas la population totale

## 🔮 Évolutions futures

- [ ] Ajout de l'analyse par région/département
- [ ] Comparaison avec législatures précédentes
- [ ] Export des graphiques en PNG
- [ ] Filtres interactifs par CSP/Genre/Âge
- [ ] API REST pour accès programmatique aux données
- [ ] Analyse des professions détaillées au-delà des CSP

## 📞 Contact

Pour toute question ou suggestion : [Ouvrir une issue](https://github.com/florentgl/Politique-data/issues)

---

**Dernière mise à jour** : Octobre 2024  
**Données** : Assemblée Nationale 2024