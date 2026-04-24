# Pilot Support FAQ — Najah AI
# Coordinator reference — copy-paste responses for WhatsApp

Each issue includes:
- How to identify it
- What to send the student (copy-paste)
- What to check on your end (if any)

---

## ISSUE 1 — Can't log in / forgot password

**Student says:** "L'appli ne marche pas" / "J'arrive pas à me connecter"

**First: ask which step they're on:**
> "Tu es bloqué où exactement ? Tu as créé un compte ? Tu entres ton email/mot de passe et ça dit quoi ?"

**If they forgot their password — send this:**
> "Pas de problème ! Sur la page de connexion, clique sur **'Mot de passe oublié'**, entre ton email, et tu reçois un lien pour en créer un nouveau. Vérifie tes spams si tu ne vois rien dans 2 minutes."

**If the reset email doesn't arrive:**
> Check in Supabase → Authentication → Users — confirm the email address was registered. If not found, they may have used a different email. Ask them to try another.

**If they're completely locked out:**
> In Supabase → Authentication → Users → find their email → Actions → Send password reset. This bypasses the app flow.

---

## ISSUE 2 — Registered but see a blank/broken dashboard

**Student says:** "J'ai créé un compte mais rien s'affiche" / "Page blanche"

**Check in Supabase:**
- Go to `profiles` table → search their email
- Go to `students` table → check if a row exists with their `profile_id`
- If `students` row is missing → the trigger didn't fire

**Fix (run in Supabase SQL editor):**
```sql
-- Replace the values below with actual data
INSERT INTO students (profile_id, level, points, streak_days)
SELECT id, '3eme', 0, 0
FROM profiles
WHERE id = '[their-profile-uuid]'
ON CONFLICT DO NOTHING;
```

**Send to student after fixing:**
> "C'est corrigé ! Rafraîchis la page (ou ferme et réouvre l'appli) et ça devrait marcher."

---

## ISSUE 3 — Cannot find the lesson / confused about navigation

**Student says:** "Je trouve pas la leçon" / "C'est où le Chapitre 1 ?"

**Send:**
> "Voilà comment trouver le Chapitre 1 :
> 1. Menu en bas (ou en haut) → **Chapitres** 🗂️
> 2. Clique sur **Chapitre 1**
> 3. Tu vois la liste des leçons — clique sur la première
>
> Si tu ne vois pas 'Chapitres' dans le menu, dis-moi ce que tu vois exactement."

**If Chapters nav is missing:**
> This means their account may have a role issue. Check in Supabase `profiles` table → confirm `role = 'student'`. If not, update it.

---

## ISSUE 4 — Exercise not submitting / stuck after answering

**Student says:** "J'ai répondu mais rien ne se passe" / "Le bouton ne marche pas"

**Send:**
> "Essaie ça :
> 1. Sélectionne une réponse (elle devient bleue)
> 2. Clique sur **'Vérifier'** (le bouton qui apparaît après)
> 3. L'explication s'affiche — c'est normal, tu peux passer à la suivante
>
> Si ça ne marche toujours pas — essaie de rafraîchir la page. Tu ne perds pas ta progression."

**If it's a persistent bug:**
> Check in Supabase → `attempts` table → filter by student_id → see if attempts are being recorded. If not, it's a network or JS error. Ask the student to try on a different browser or WiFi.

---

## ISSUE 5 — Review queue still shows a lesson after they marked it as reviewed

**Student says:** "La leçon est encore dans mes révisions" / "J'ai marqué comme révisé mais elle revient"

**Explanation for student:**
> "C'est normal — la leçon revient dans ta liste après quelques jours. C'est le principe de la **révision espacée** : revoir une chose plusieurs fois, au bon moment, aide à vraiment la mémoriser. C'est comme ça que ça marche ! ✅"

**If the lesson shows as overdue immediately after review:**
> Check in Supabase → `lesson_progress` → find their row → check `completed_at`. If it wasn't updated to today's date, the mark-as-reviewed didn't save. Ask them to try again with a stable connection.

---

## ISSUE 6 — Score below 50% — can't mark lesson as complete

**Student says:** "J'arrive pas à terminer la leçon" / "Le bouton 'Marquer comme complétée' n'apparaît pas"

**Send:**
> "Pour valider une leçon, il faut avoir au moins **50% de bonnes réponses** aux exercices.
>
> Voilà quoi faire :
> 1. Relis la leçon (onglet **📖 Leçon**)
> 2. Regarde bien l'exemple guidé (💡) si disponible
> 3. Reviens aux exercices — les explications te donnent des indices pour la prochaine fois
> 4. Une fois ton score ≥ 50%, le bouton apparaît !
>
> Si tu bloques, pose ta question au **🤖 AI Tutor** — il t'aide étape par étape."

---

## ISSUE 7 — App very slow / videos not loading

**Student says:** "L'appli rame" / "La vidéo charge pas"

**Send:**
> "Voilà quelques astuces :
> 1. Ferme les autres applis ouvertes
> 2. Vérifie ta connexion (WiFi ou 4G)
> 3. Les vidéos sont optionnelles — tu peux faire les leçons et exercices sans elles
> 4. Si c'est trop lent sur téléphone, essaie sur ordinateur
>
> Les leçons et exercices eux-mêmes sont très légers — ça marche même avec une connexion 3G de base."

---

## ISSUE 8 — Forgot which exercises they already did

**Student says:** "J'arrive plus à me souvenir où j'en étais"

**Send:**
> "Pas de souci — l'appli garde tout en mémoire !
> - Les exercices déjà faits sont grisés (tu ne peux pas les refaire)
> - Les leçons complétées sont marquées ✅ en vert dans le Chapitre
> - Ton score est visible en haut de chaque leçon
>
> Continue juste là où les exercices ne sont pas encore grisés."

---

## ISSUE 9 — Parent asks about price / subscription

**Parent says:** "C'est combien ?" / "Kach hadchi makhsous ?"

**Response (French):**
> "Pour l'instant, c'est entièrement gratuit — votre enfant participe à un pilote test. Si le produit est lancé officiellement, les familles seront informées en premier avec une offre de lancement. Aucun engagement pour le moment. 🙏"

**Response (Darija):**
> "Daba machi f'had lwaqt — wldek / bntk kaydkhol f'pilot majjani. Ila la'aqna l'application f'chi mada, ghadi nkhabrou l'oussra lawla b'chi offre khassa. Ma kayn walo daba. 🙏"

**Do not give a price commitment yet.** The pilot is for learning what price the market will accept.

---

## ISSUE 10 — Student says AI tutor gave wrong answer

**Student says:** "Le tuteur IA m'a dit quelque chose de faux"

**Send:**
> "Merci de me le signaler — c'est très utile ! Peux-tu me copier ici :
> 1. Ta question exacte
> 2. Ce que le tuteur a répondu
>
> Je vais vérifier. L'IA peut faire des erreurs — c'est pour ça qu'on teste !"

**On your end:**
> Check `ai_tutor_logs` table for that student's session. Review the exchange. If the AI gave factually wrong math content, note it in your pilot observation log. This is a data point for AI tutor quality improvements.

---

## GENERAL SUPPORT PRINCIPLES

1. **Respond within 2 hours** during the pilot — slow support = students stop trying
2. **Never blame the student** — "l'appli a eu un souci" not "tu as mal fait"
3. **Always end with a positive nudge** — "Tu peux continuer maintenant !"
4. **Document every bug** — note the issue, student name, and date in your observation log
5. **If 3+ students report the same issue** — it's a product bug, not a user error. Escalate immediately.
