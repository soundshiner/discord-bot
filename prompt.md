## 📝 Nom souhaité de la commande
`/help`

---

## 🎯 Objectif
Permettre à un membre (ou un admin) de soumettre une idée de contenu à publier sur les réseaux, stockée dans Airtable.

---

## 🗣️ Comportement attendu (user flow)
1. L’utilisateur tape `/help`
2. Le bot valide l’entrée et affiche la liste des commandes accessibles selon leur rôle

---

## ⚙️ Options SlashCommand
N\A

---

## 🔐 Permissions
- Accessible à tous les membres ?
  - ✅ Oui
- Restreint à un rôle ?
  N\A

---

## 🔗 Intégrations nécessaires
- Logger
- Embed helper

---

## ✅ À coder :
- [ ] Fichier SlashCommand `bot/commands/tools/help.js`
- [ ] Réponse embed (confirm)
- [ ] Gestion erreurs

---

## 🧪 Tests envisagés
- Test de soumission de la commande → erreur attendue
- Test de log complet dans `/logs`



🔥 Commandes publiques (pour tout le monde, membres normaux)
/help — Liste des commandes accessibles selon leur rôle
/stats — Statistiques publiques de la communauté ou du bot (ex : nombre d’écoutes, posts, followers)
/suggest — Soumettre une idée de contenu ou de post (lié à Airtable)
/schedule — Voir le calendrier éditorial ou les prochaines publications
/ping — Test simple pour vérifier que le bot répond

🛠 Commandes SM Manager / Modérateurs (accès restreint)
/backlog — Voir et gérer les idées de posts en attente, validées ou refusées
/approve — Valider une idée de post / publication avant planification
/reject — Refuser une idée de post, avec raison (pour garder trace)
/editpost — Modifier un post programmé (titre, caption, heure)
/publishnow — Forcer la publication immédiate d’un post (urgent)
/stats detailed — Statistiques plus poussées : engagement, reach, performances par post
/userreport — Rapports sur les membres (ex : qui a soumis quoi, fréquence, etc.)
/announce — Faire une annonce officielle dans un canal spécifique
/logs — Accéder aux logs ou erreurs du bot (pour debug rapide)

🔐 Commandes Admin (accès ultra restreint)
/config — Modifier la config du bot (tokens, clés API, paramètres Airtable)
/reload — Recharger les commandes du bot (sans redémarrer)
/shutdown — Éteindre proprement le bot
/userban — Bannir un utilisateur (en interne au bot)
/rolemanage — Gérer les rôles Discord directement depuis le bot
/audit — Rapport complet d’audit des commandes exécutées, avec logs sécurisés

Bonus : commandes optionnelles qui peuvent aider
/export — Exporter les données (idées, calendrier, stats) au format CSV ou JSON
/remind — Envoyer un rappel programmé à une équipe ou un membre
/feedback — Collecter du feedback de l’équipe sur le bot ou les posts

Exemple de gestion d’accès
Tous voient /help, /ping, /stats
Seuls les rôles “SM Manager” ou “Modérateur” ont accès aux commandes de gestion de contenu (/backlog, /approve, /reject, etc.)
Seuls les Admins Discord (ou équivalent) ont accès aux commandes critiques et de config.

