# Sync Santé — Spec Produit

## En une phrase

L'utilisateur connecte les données santé de son téléphone une fois et son journal SkinEasy se remplit tout seul (sommeil, sport, nutrition, stress) — sans saisie manuelle, sur iOS comme sur Android.

## Pourquoi

La saisie quotidienne est le principal point de friction du journal. Plus l'utilisateur saute de jours, moins le score est fiable, moins les recommandations sont pertinentes. Les téléphones modernes centralisent déjà la majorité de ces données via leurs hubs santé natifs (et les wearables associés). On lit, on remplit, l'utilisateur ne fait rien.

## Public cible

- Utilisateurs iPhone (iOS 15.1+)
- Utilisateurs Android (avec hub santé natif disponible)
- Bonus si montre connectée (débloque le score de stress automatique)
- Bonus si app de tracking nutritionnel tierce qui pousse vers le hub santé (MyFitnessPal, Lifesum, Yazio, etc.)

## Ce que ça remplit automatiquement

| Catégorie     | Source                                     | Poids dans le score |
| ------------- | ------------------------------------------ | ------------------- |
| **Sommeil**   | Analyse du sommeil (heures + qualité)      | 30 %                |
| **Activité**  | Workouts (durée + type + intensité via FC) | 20 %                |
| **Stress**    | HRV + Fréquence cardiaque au repos         | 15 %                |
| **Nutrition** | Calories + protéines + glucides + lipides  | 20 %                |

→ Jusqu'à **85 % du score quotidien** peut être renseigné sans aucune action.

L'utilisateur garde la main : il peut toujours saisir ou écraser manuellement. Les observations subjectives (15 % restants) restent manuelles — il n'existe pas d'équivalent dans les hubs santé.

## Parcours utilisateur

1. **Onboarding** — proposition d'activer la synchro santé. Skippable.
2. **Première autorisation** — le système affiche sa propre feuille de permissions native (l'utilisateur coche les types de données qu'il accepte de partager).
3. **Sync automatique** :
   - À chaque ouverture de l'app
   - À chaque retour en premier plan (foreground)
   - Dans les deux cas, throttle d'1h pour éviter le spam
4. **Affichage** — les indicateurs et le calendrier se rafraîchissent automatiquement après un sync.

L'utilisateur n'a **rien à faire** au quotidien. La connexion est faite une fois, la mise à jour est silencieuse.

## Détails de mapping

### Sommeil

- Heures = temps endormi cumulé sur la nuit
- Qualité (1-5) = ratio temps endormi / temps au lit (efficacité du sommeil)

### Sport

- Durée + type d'activité (running, yoga, cycling, etc. — 12+ types reconnus)
- Intensité (1-5) = fréquence cardiaque moyenne pendant le workout / FC max théorique (`220 - âge`). Sans FC, défaut à 3.

### Stress

- Calculé sur la base de la HRV (variabilité de fréquence cardiaque) et de la FC au repos comparées à la moyenne 7 jours de l'utilisateur.
- Plus la HRV chute / la FC au repos monte vs sa baseline → plus le stress est élevé.
- Nécessite des données HRV (typiquement une montre connectée). Sans, la catégorie reste manuelle.

### Nutrition

- Une "fausse" entrée repas par jour, agrégée depuis les totaux quotidiens du hub santé (calories, macros).
- Les hubs santé ne stockent pas les repas individuellement — uniquement des totaux par jour.

## Ce qu'on ne synchronise pas (volontairement)

| Donnée            | Raison                                            |
| ----------------- | ------------------------------------------------- |
| Pas               | Pas pertinent pour la peau                        |
| Hydratation       | Rarement loggué                                   |
| Repas individuels | Hubs santé ne stockent que des totaux journaliers |
| Observations      | Subjectif — pas de signal disponible              |

## Confidentialité

- **Lecture seule** : on ne pousse jamais rien vers le hub santé.
- L'utilisateur contrôle scope par scope dans les réglages système.
- Données stockées dans Supabase comme n'importe quelle entrée du journal. Aucune donnée brute du hub santé ne quitte l'appareil — on ne stocke que les agrégats déjà mappés sur nos types `SleepEntry`/`SportEntry`/etc.

## Limites connues

- **Pas de déduplication** — si l'utilisateur a saisi manuellement et que le hub santé a la même donnée, on aura potentiellement deux entrées sport ce jour-là.
- **Pas de sync en arrière-plan** — si l'app n'est jamais ouverte, rien ne se synchronise. Le throttle d'1h évite le spam mais l'utilisateur doit ouvrir l'app au moins une fois par jour pour que le journal se remplisse.
- **Refus de permission non récupérable in-app** — si l'utilisateur refuse, il doit aller manuellement dans les réglages système pour réactiver. On expose un raccourci "Ouvrir Réglages → Santé" en cas de refus détecté.

## Pistes futures

- **Activation du sync en arrière-plan** → données toujours à jour sans ouvrir l'app.
- **Déduplication** entre saisies manuelles et données du hub santé.
- **Cycles menstruels** — fort signal pour la peau, déjà disponible dans les hubs santé, non exploité.
- **Hydratation** — si l'utilisateur la log dans le hub santé.
