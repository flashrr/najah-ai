# Najah AI — Demo-Ready Plan
**Date:** 2026-04-16  
**Build state:** V2 complete, production build passing, 16 routes, 0 TypeScript errors

---

## PARTIE 1 — Application des migrations SQL

### Ordre exact d'application

```
1. 004_v2_features.sql        ← en premier (crée les nouvelles tables)
2. 005_v2_seed_weeks_3_4.sql  ← en second (insère les leçons dans les tables existantes)
```

### Procédure dans Supabase

1. Ouvrir le projet Supabase → **SQL Editor**
2. Cliquer sur **+ New query**
3. Ouvrir `supabase/migrations/004_v2_features.sql`, copier tout le contenu, coller, cliquer **Run**
4. Vérifier : pas d'erreur rouge en sortie
5. Ouvrir un nouvel onglet de requête
6. Ouvrir `supabase/migrations/005_v2_seed_weeks_3_4.sql`, copier, coller, cliquer **Run**
7. Vérifier : `INSERT 0 10` (leçons) et `INSERT 0 27` (exercices)

### Requête de vérification après les deux migrations

```sql
select 'invite_codes'    as tbl, count(*) from public.invite_codes
union all
select 'tutor_sessions',          count(*) from public.tutor_sessions
union all
select 'api_rate_limits',         count(*) from public.api_rate_limits
union all
select 'lessons_total',           count(*) from public.lessons
union all
select 'exercises_total',         count(*) from public.exercises;
```

**Résultats attendus :**

| tbl | count |
|---|---|
| invite_codes | 0 |
| tutor_sessions | 0 |
| api_rate_limits | 0 |
| lessons_total | 25 |
| exercises_total | 45 |

---

## PARTIE 2 — Tests immédiats après migration

À faire manuellement dans le navigateur juste après l'application :

1. **Inscription étudiant** → vérifier : pas de crash, redirection dashboard ou écran "Vérifiez votre email"
2. **Connexion étudiant** → dashboard charge, streak = 1, points = 0
3. **Aller sur /student/invite** → un code XXXX-XXXX apparaît (RPC `generate_invite_code` fonctionne)
4. **Inscrire un compte parent séparé** → aller sur /parent/dashboard → entrer le code de l'étape 3 → le nom de l'étudiant apparaît
5. **Aller sur /student/weekly-plan** → 4 semaines visibles, semaines 3 et 4 ont maintenant 5 leçons chacune
6. **Ouvrir une leçon de la semaine 3 ou 4** → contenu s'affiche, notation mathématique rendue si présente
7. **Aller sur /student/tutor** → envoyer un message → l'IA répond → rafraîchir la page → la conversation précédente est toujours là (persistance de session)
8. **Vérifier le rate limiting** → après 30 requêtes dans la même heure → message "Rate limit reached" (HTTP 429)

---

## PARTIE 3 — Checklist QA Complète

### 🧑‍🎓 Flow Étudiant

#### Inscription & Auth
- [ ] Inscription en tant qu'étudiant → écran confirmation email (si activé dans Supabase)
- [ ] Inscription → connexion directe si confirmation email désactivée → redirigé vers `/student/dashboard`
- [ ] Connexion avec mauvais mot de passe → affiche erreur, ne crashe pas
- [ ] Connexion correcte → redirigé vers `/student/dashboard`
- [ ] Déconnexion → redirigé vers `/login`, accès à `/student/dashboard` refusé
- [ ] Accès à `/student/dashboard` sans connexion → redirigé vers `/login`
- [ ] Accès à `/parent/dashboard` en tant qu'étudiant → redirigé (role guard actif)

#### Dashboard
- [ ] Dashboard charge en moins de 3 secondes
- [ ] Points affichés correctement (0 pour nouvel étudiant)
- [ ] Streak = 1 à la première visite, s'incrémente les jours suivants
- [ ] CTA "Commencer le diagnostic" visible si aucun résultat de diagnostic
- [ ] Après diagnostic : CTA disparaît, scores par matière apparaissent
- [ ] Section "Skill performance" apparaît après quelques tentatives
- [ ] Compétences faibles (< 60%) affichées avec badges orange
- [ ] Les 4 liens rapides naviguent correctement
- [ ] Badges affichés correctement (gagnés = brillant, non gagnés = grisé)
- [ ] Skeleton de chargement visible avant le chargement des données

#### Diagnostic
- [ ] Diagnostic charge les 5 matières avec questions
- [ ] Réponse à toutes les questions → résultats sauvegardés dans `diagnostic_results`
- [ ] Score et sujets faibles affichés par matière
- [ ] Couleurs : rouge < 50%, jaune 50–75%, vert > 75%
- [ ] Bouton "Voir votre plan personnalisé →" navigue vers le plan hebdomadaire
- [ ] Retour sur la page diagnostic → bouton "Reprendre le diagnostic" visible (pas l'intro vide)
- [ ] Clic "Reprendre" → anciens résultats supprimés, nouveau test commence
- [ ] Nouveau test → nouveaux résultats sauvegardés, dashboard mis à jour

#### Plan Hebdomadaire
- [ ] Les 4 semaines visibles
- [ ] Semaines 1–2 : 15 leçons au total
- [ ] Semaines 3–4 : 10 leçons au total (après migration 005)
- [ ] Leçons affichent les badges de difficulté corrects (easy/medium/hard)
- [ ] Leçons terminées affichent ✓, en cours ◑, non commencées ○
- [ ] Clic sur une leçon → navigation vers `/student/lessons/[lessonId]`
- [ ] Skeleton de chargement visible avant le chargement des données

#### Visionneuse de Leçon
- [ ] En-tête : titre, objectif, icône matière, difficulté, durée estimée
- [ ] Barre de progression des exercices se met à jour au fil des réponses
- [ ] **Onglet 📖 Leçon** : markdown rendu correctement (gras, titres, listes)
- [ ] **Onglet 📖 Leçon** : notation mathématique rendue si la leçon contient `$...$` ou `$$...$$`
- [ ] Bouton "Aller aux exercices →" bascule sur l'onglet exercices
- [ ] **Onglet ✏️ Exercices** : options MCQ affichées avec labels A/B/C/D
- [ ] Bonne réponse → surlignage vert + explication affichée
- [ ] Mauvaise réponse → surlignage rouge + explication affichée
- [ ] Bonne réponse → +5 points ajoutés (vérifier sur le dashboard)
- [ ] Tous les exercices répondus → résumé du score apparaît
- [ ] Score ≥ 50% → bouton "Mark complete" actif, affiche "+20pts"
- [ ] Score < 50% → bouton "Mark complete" absent, "↩ Review lesson" affiché à la place
- [ ] Clic "Mark complete" → +20 points, redirection vers le plan hebdomadaire
- [ ] Leçon affiche ✓ sur le plan hebdomadaire
- [ ] **Onglet 🤖 AI Tutor** : charge la conversation précédente (après migration 004)
- [ ] Envoi d'un message → l'IA répond avec guidage socratique
- [ ] L'IA ne donne PAS directement la réponse aux devoirs
- [ ] Conversation persiste après rafraîchissement de la page

#### Code d'Invitation
- [ ] `/student/invite` charge sans erreur
- [ ] Code XXXX-XXXX apparaît (8 caractères + tiret)
- [ ] Bouton "Copier" copie dans le presse-papiers
- [ ] Confirmation "Copié !" s'affiche brièvement
- [ ] Naviguer ailleurs et revenir → même code affiché (pas un nouveau)
- [ ] Lien 🔗 Invite dans la barre de navigation fonctionne

#### Tuteur IA Autonome
- [ ] `/student/tutor` charge avec les boutons de matière
- [ ] Message envoyé, réponse reçue
- [ ] Historique de conversation persistant après rafraîchissement

---

### 👨‍👩‍👧 Flow Parent

#### Inscription & Auth
- [ ] Inscription en tant que parent → arrive sur `/parent/dashboard`
- [ ] Sans enfant lié → affiche état vide avec formulaire de code d'invitation

#### Liaison d'un enfant
- [ ] Entrer un code XXXX-XXXX valide → l'enfant apparaît sur le dashboard
- [ ] Entrer un code invalide/expiré → formulaire ne fait rien (limitation connue — erreur silencieuse)
- [ ] Entrer un code déjà utilisé → formulaire ne fait rien
- [ ] Après liaison : nom, points, streak de l'enfant visibles
- [ ] Expandeur "Lier un autre enfant" visible après le premier enfant lié
- [ ] Possibilité de lier plusieurs enfants

#### Vue Progression Enfant
- [ ] Points et streak de l'enfant affichés correctement
- [ ] Leçons réalisées / total affichés
- [ ] Score moyen calculé correctement
- [ ] Barre de progression globale rendue
- [ ] Scores par matière (du diagnostic) affichés en barres de progression
- [ ] Couleurs : vert ≥ 75%, jaune ≥ 50%, rouge < 50%
- [ ] Zones faibles (< 60%) affichées en badges orange
- [ ] Recommandations apparaissent selon zones faibles / streak / score
- [ ] Accès à `/parent/dashboard` sans connexion → redirection `/login`
- [ ] Accès à `/student/dashboard` en tant que parent → redirigé (role guard)

---

### 🛠️ Flow Admin

#### Auth & Accès
- [ ] Inscription admin → arrive sur `/admin/dashboard`
- [ ] Dashboard admin affiche : total étudiants, leçons, exercices, tentatives
- [ ] Liste des étudiants récents affichée correctement
- [ ] Accès pages admin sans connexion → redirection `/login`

#### Gestion des Leçons
- [ ] Liste des leçons affiche les 25 leçons avec matière, semaine, difficulté
- [ ] Filtre par matière → leçons correctes affichées
- [ ] Filtre "All" → toutes les leçons de nouveau affichées
- [ ] **+ Ajouter leçon** → formulaire s'ouvre
- [ ] Remplir matière, semaine, titre, contenu → Sauvegarder → leçon apparaît dans la liste
- [ ] Nouvelle leçon persiste après rafraîchissement (sauvegardée en DB)
- [ ] Bouton **Edit** → formulaire pré-rempli avec les données existantes
- [ ] Modifier le titre, sauvegarder → liste mise à jour, DB reflète le changement
- [ ] **Delete** → dialog de confirmation → leçon supprimée
- [ ] Suppression d'une leçon supprime aussi ses exercices (cascade delete)

#### Gestion des Exercices
- [ ] Liste des exercices affiche les 45 exercices
- [ ] Filtre par leçon → exercices corrects affichés
- [ ] **+ Ajouter exercice (MCQ)** → 4 champs d'options apparaissent
- [ ] Dropdown "Réponse correcte" affiche uniquement les options remplies
- [ ] **+ Ajouter exercice (short_answer)** → pas de champs d'options
- [ ] Sauvegarder exercice → apparaît dans la liste, visible par les étudiants
- [ ] Bouton **Edit** → formulaire pré-rempli (options MCQ rembourrées à 4 si moins)
- [ ] Modifier la réponse correcte, sauvegarder → exercice étudiant reflète le changement
- [ ] **Delete** → dialog de confirmation → exercice supprimé

---

### 🤖 Flow Tuteur IA

#### Qualité & Sécurité
- [ ] Nouvelle conversation s'ouvre avec salutation socratique (pas vide)
- [ ] Poser une question directe de maths → l'IA demande ce que vous avez essayé, ne donne pas la réponse immédiatement
- [ ] Après 2–3 indices, si toujours bloqué → l'IA fournit un exemple étape par étape
- [ ] Réponse de l'IA ≤ 4 courts paragraphes (pas un mur de texte)
- [ ] L'IA utilise des exemples marocains/du quotidien si pertinent
- [ ] Question hors-sujet ("Raconte-moi une blague") → l'IA redirige doucement vers les études

#### Conscience du Contexte
- [ ] Ouvrir le tuteur depuis une leçon → l'IA mentionne le sujet de la leçon dans son guidage
- [ ] Étudiant avec scores diagnostics faibles → l'IA référence ces zones faibles si pertinent
- [ ] Conversation précédente visible en retournant sur l'onglet tuteur de la même leçon

#### Rate Limiting
- [ ] Après 30 requêtes en 1 heure → réponse "Rate limit reached" (HTTP 429)
- [ ] Erreur affichée proprement dans le chat (pas un écran blanc)
- [ ] Après la fenêtre d'une heure → les requêtes fonctionnent à nouveau
- [ ] Rate limit par étudiant (compte différent → limite fraîche)

#### Technique
- [ ] Réponse IA enregistrée dans la table `ai_tutor_logs` (vérifier dans Supabase)
- [ ] Chaque requête crée une ligne dans la table `api_rate_limits`
- [ ] Conversation sauvegardée dans la table `tutor_sessions` après chaque échange

---

## PARTIE 4 — Phase Demo-Ready

### Phase D1 — Refonte Landing Page (4–5 heures)
**Problème actuel :** La landing page ressemble à un prototype.

**Ce qu'il faut construire :**
1. **Hero fort** — Titre clair, sous-titre, un seul CTA
   - Titre : *"Le compagnon d'apprentissage personnalisé pour votre 3ème"*
   - Sous-titre : *"Diagnostic, leçons adaptées, tuteur IA et suivi parental — tout en un"*
   - CTA : **Commencer gratuitement** (→ /register?role=student) + **Je suis un parent** (→ /register?role=parent)
2. **Bande preuve sociale** — "Conçu pour le programme 3ème collège marocain"
3. **Comment ça marche** — 3 étapes visuelles : Diagnostic → Plan personnalisé → Parents suivent
4. **Cards fonctionnalités** : Tuteur IA Socratique / Plan hebdomadaire adapté / Visibilité parentale
5. **Section CTA finale** — "Essayez le test diagnostique — 10 minutes, sans inscription"
6. **Footer** — Logo, tagline, liens /login et /register

**Fichier à modifier :** `src/app/page.tsx`

---

### Phase D2 — Page Tarifs (2 heures)
**Pourquoi :** Signale que c'est un vrai produit, pas un projet scolaire. Cadre la valeur tôt.

**Structure recommandée :**

| Plan | Prix | Pour |
|---|---|---|
| **Gratuit** | 0 MAD | 1 matière, 2 leçons/semaine, tuteur IA basique |
| **Étudiant** | 99 MAD/mois | 5 matières, leçons illimitées, tuteur IA complet |
| **Famille** | 149 MAD/mois | Plan Étudiant + dashboard parent + rapports hebdomadaires |
| **École Pilote** | Nous contacter | Étudiants en masse, panel admin, comptes enseignants |

> Pas d'intégration paiement pour l'instant — CTA "Bientôt disponible" ou "Nous contacter" suffit pour la phase démo.

**Fichier à créer :** `src/app/pricing/page.tsx`

---

### Phase D3 — Flow d'Onboarding (3–4 heures)
**Problème actuel :** Après inscription → dashboard vide. Aucun guidage. L'étudiant ne sait pas quoi faire.

**Ce qu'il faut construire — wizard 3 étapes (modal, une seule fois) :**

```
Étape 1 : "Bienvenue, [Prénom] ! 👋"
           → Expliquer ce qu'est Najah AI en 2 phrases
           → "Commençons par évaluer ton niveau dans chaque matière"
           → Bouton [Démarrer le test diagnostique]

Étape 2 : (Après le diagnostic)
           → Afficher le résumé des scores
           → "Voici ton plan personnalisé pour la semaine 1"
           → Bouton [Voir mon plan]

Étape 3 : (Après la première leçon)
           → "Tu as gagné [X] points ! 🎉"
           → "Partage ta progression avec tes parents"
           → Bouton [Obtenir le code d'invitation] + [Passer]
```

**Approche d'implémentation :**
- Stocker `onboarding_completed` dans `localStorage` (simple, pas de changement DB)
- Ou ajouter colonne `onboarding_completed boolean` dans la table `students` (plus propre, persiste entre appareils)
- Afficher comme modal centré par-dessus le dashboard

**Fichiers à créer/modifier :**
- Nouveau : `src/components/OnboardingModal.tsx`
- Modifier : `src/app/(student)/student/dashboard/page.tsx`

---

### Phase D4 — Mise en Place des Tests Pilotes (1–2 heures setup, continu)

**Objectif :** 5 à 10 vrais étudiants de 3ème utilisent le produit pendant 1 semaine.

**Checklist setup :**

1. **Créer des comptes démo** — un étudiant, un parent, un admin — avec progression pré-remplie pour que la démo ait quelque chose à montrer
2. **Rédiger un brief testeur 1 page** :
   - Ce qu'est Najah AI
   - Quoi tester (diagnostic, plan hebdomadaire, tuteur IA)
   - Comment donner son avis (Google Form)
   - Engagement attendu : 20 min/jour × 5 jours
3. **Formulaire de feedback** (Google Form ou Typeform) :
   - Le tuteur IA vous a-t-il aidé à comprendre la leçon ? (1–5)
   - Le diagnostic était-il précis pour votre niveau ? (oui/non + notes)
   - Qu'est-ce qui vous a le plus dérouté ?
   - Utiliseriez-vous ceci chaque jour ?
4. **Ajouter un bouton "Feedback"** flottant sur le dashboard étudiant → lien vers votre formulaire

---

### Phase D5 — Migration Données Démo (30 min)
**Pourquoi :** Montrer un dashboard vide à des investisseurs ou une école pilote donne une mauvaise impression.

**Ce qu'il faut créer :** `supabase/migrations/006_demo_data.sql`
- 3 utilisateurs démo (étudiant, parent, admin) avec progression réaliste
- Étudiant : 8 leçons terminées, 73% score moyen, 5 jours de streak, 245 points
- Diagnostic : maths et physique comme zones faibles
- Parent lié à l'étudiant démo
- Peut être désactivé pour la production

---

## Ordre d'Exécution Recommandé

```
Semaine 1 (maintenant) :
  1. Appliquer migrations 004 + 005               ← 15 min (vous le faites)
  2. Parcourir la checklist QA ci-dessus          ← 1–2 heures
  3. Phase D3 : Flow d'onboarding                 ← plus grand gap UX actuel
  4. Phase D1 : Refonte landing page              ← amélioration la plus visible

Semaine 2 :
  5. Phase D5 : Migration données démo            ← nécessaire avant toute démo
  6. Phase D2 : Page tarifs                       ← signale le sérieux du produit
  7. Phase D4 : Setup tests pilotes               ← commencer à recruter des testeurs

Semaine 3 :
  8. Collecter les retours de 5–10 testeurs
  9. Corriger les 3 principaux points de friction
 10. V3.1 : Personnalisation du plan hebdomadaire ← plus haute valeur pédagogique
```

---

## État de Vérification du Build

| Vérification | Statut |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ CLEAN — 0 erreurs |
| Build production (`npm run build`) | ✅ CLEAN — 16 routes |
| Serveur dev (`npm run dev`) | ✅ Démarre (500 attendu sans .env.local réel) |
| Migrations Supabase 001–003 | ✅ Appliquées |
| Migration Supabase 004 | ⚠️ EN ATTENTE — doit être exécutée |
| Migration Supabase 005 | ⚠️ EN ATTENTE — doit être exécutée |
