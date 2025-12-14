# Configuration Git - Logi Clinic

## Connexion GitHub

Le projet est connecté au dépôt GitHub suivant :
- **Dépôt** : `https://github.com/CHEzRIF21/logi-Clinic-1.git`
- **Branche principale** : `main`

## Token d'authentification

Le token GitHub est configuré dans l'URL du remote pour l'authentification.

⚠️ **IMPORTANT** : Le token est stocké dans `.git/config` qui n'est pas versionné.

## Commandes utiles

```bash
# Vérifier la connexion
git remote -v

# Tester la connexion
git fetch origin

# Pousser les changements
git push origin main

# Récupérer les changements
git pull origin main
```

## Sécurité

- Le token n'est pas dans le dépôt Git (fichier `.git/config` non versionné)
- Le fichier `.gitignore` exclut les fichiers sensibles (`.env`, tokens, etc.)
- Ne jamais commiter de tokens ou clés dans le code

## Dernière mise à jour

- Date : 2025-01-12
- Token configuré avec succès
- Connexion testée et fonctionnelle



