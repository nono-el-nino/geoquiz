# Flag ada 🐦✈️

*Le quiz qui te met à plat.* Flagada, petit oiseau aviateur complètement perdu, cherche son chemin entre les drapeaux et les capitales.

Quiz de géographie mobile inspiré de JetPunk : **drapeaux** et **capitales** des **193 États membres de l'ONU**.

## Jouer
- **Défi du jour** : 10 questions identiques pour tout le monde (5 drapeaux, 5 capitales), un essai par jour, résultat partageable façon Wordle (🟩 rapide, 🟨 lent, 🟥 raté).
- **Éclair** : 10 questions à 4 choix, 10 s chacune. Bonus de vitesse et multiplicateur de combo (jusqu'à x3).
- **Saisie** : 10 questions où l'on écrit la réponse, 25 s chacune. Orthographe souple (fautes de frappe tolérées, sans accents), un mot suffit pour les noms composés s'il n'est pas ambigu (« Burkina », « Moresby » ; mais pas « Corée » ni « Guinée »). Propositions automatiques pendant la frappe, bouton 💡 Indice (première lettre et longueur, points divisés par 2), possibilité de réessayer ou de passer.
- **Survie** : 3 vies, jusqu'à épuisement de la zone.
- **Marathon** (à la JetPunk) : on tape un maximum de réponses avant la fin du chrono. Pas d'accents ni de validation nécessaires ; un mot non ambigu suffit.
- Zones : Monde, Afrique, Europe, Asie, Amériques, Océanie.

## Gamification
XP et niveaux avec titres (Touriste → Atlas vivant), série de jours 🔥, 15 badges, records par mode/zone, confettis, sons et vibrations, partage du score (texte + image 1080×1080 via le menu de partage du téléphone, ou copie dans le presse-papiers).

## Direction artistique
Cartoon japonais épuré : contours encre épais, aplats orange mandarine (`#ff8a1f`) et bleu ciel (`#8fd3ff`), cartes et drapeaux façon autocollants (bord blanc découpé, légère rotation), police arrondie M PLUS Rounded 1c. La mascotte (`js/mascot.js`, SVG) a trois humeurs : perdue, contente, sonnée.

## Technique
Application web installable (PWA), sans dépendance ni build : HTML/CSS/JS. Fonctionne hors ligne après la première visite. Progression stockée sur l'appareil (localStorage).

```bash
cd geoquiz
python3 -m http.server 5173   # puis ouvrir http://localhost:5173
npm test                      # tests de la logique et des données
```

Pour l'installer sur un téléphone, il faut l'héberger en HTTPS (GitHub Pages, Netlify, Vercel…), l'ouvrir puis « Ajouter à l'écran d'accueil ».

Fichiers : `js/data.js` (pays, capitales, réponses acceptées), `js/game.js` (règles, score, badges), `js/app.js` (écrans), `js/mascot.js` (mascotte).
