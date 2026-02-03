# Correction : commande `supabase` non reconnue dans le terminal

## Problème

Sous PowerShell, les commandes suivantes échouent :

```text
supabase db push
supabase functions deploy api
```

Erreur : **« supabase: The term 'supabase' is not recognized... »**

**Cause :** le **Supabase CLI** n’est pas installé (ou pas dans le PATH). Le projet utilise uniquement le client JS `@supabase/supabase-js`, pas l’outil en ligne de commande.

---

## Solution 1 : Utiliser npm (recommandé, sans installation globale)

Le CLI Supabase a été ajouté en **devDependency** du projet. Après avoir installé les dépendances :

### 1. Installer les dépendances

Dans le dossier du projet :

```powershell
cd "C:\Users\Mustafa\Desktop\logi Clinic 1"
npm install
```

### 2. Utiliser les scripts npm

| Action | Commande |
|--------|----------|
| Pousser les migrations (DB) | `npm run supabase:db:push` |
| Déployer toutes les Edge Functions | `npm run supabase:functions:deploy` |
| Lier le projet Supabase | `npm run supabase:link` |

**Déployer une seule fonction (ex. `api`) :**

```powershell
npx supabase functions deploy api
```

**Autres exemples avec `npx` :**

```powershell
npx supabase db push
npx supabase functions deploy create-clinic
npx supabase link --project-ref bnfgemmlokvetmohiqch
```

`npx` utilise le CLI installé dans `node_modules`, donc **aucune installation globale n’est nécessaire**.

---

## Solution 2 : Installer le CLI globalement (Windows avec Scoop)

**Important :** `npm install -g supabase` **ne fonctionne pas**. Supabase refuse explicitement l’installation globale via npm (« Installing Supabase CLI as a global module is not supported »).

Sur **Windows**, la méthode officielle pour avoir la commande `supabase` partout est **Scoop** :

### 1. Installer Scoop (si pas déjà fait)

Dans PowerShell (en mode utilisateur, pas Admin) :

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

### 2. Installer le CLI Supabase

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 3. Vérifier

```powershell
supabase --version
```

Ensuite vous pouvez utiliser `supabase db push`, `supabase functions deploy api`, etc. dans n’importe quel terminal.

---

## Résumé des commandes utiles

| Ce que vous voulez faire | Commande (avec npx, sans install globale) |
|--------------------------|------------------------------------------|
| Migrations DB | `npx supabase db push` |
| Déployer l’API | `npx supabase functions deploy api` |
| Déployer create-clinic | `npx supabase functions deploy create-clinic` |
| Déployer toutes les fonctions | `npx supabase functions deploy` |
| Lier le projet | `npx supabase link --project-ref bnfgemmlokvetmohiqch` |
| Se connecter (login) | `npx supabase login` |

Ou avec les scripts npm (après `npm install`) :

- `npm run supabase:db:push`
- `npm run supabase:functions:deploy`
- `npm run supabase:link`

---

## Déploiement des fonctions : prérequis

1. **Lier le projet** (une seule fois) :

   ```powershell
   npx supabase link --project-ref bnfgemmlokvetmohiqch
   ```

   Si demandé, utilisez votre **Access Token** Supabase (Dashboard → Account → Access Tokens).

2. **Déployer** :

   ```powershell
   npx supabase functions deploy api
   ```

   Ou pour toutes les fonctions :

   ```powershell
   npx supabase functions deploy
   ```

En suivant l’une de ces méthodes, les commandes Supabase ne dépendent plus d’une installation globale et fonctionnent depuis le terminal du projet.
