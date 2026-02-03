# Pourquoi `npm install -g supabase` échoue et que faire

## Ce que vous voyez

En exécutant :

```powershell
npm install -g supabase
```

vous obtenez notamment :

1. **Erreurs EPERM** (operation not permitted) lors du nettoyage de dossiers dans `%AppData%\npm\node_modules\supabase`.
2. **Message explicite du CLI Supabase** :
   ```text
   Installing Supabase CLI as a global module is not supported.
   Please use one of the supported package managers: https://github.com/supabase/cli#install-the-cli
   ```

---

## Pourquoi ça échoue

1. **Supabase interdit l’installation globale via npm**  
   Le script `postinstall` du package `supabase` vérifie le type d’installation et **refuse** l’installation globale. Ce n’est pas un bug, c’est voulu par Supabase.

2. **Les EPERM** viennent souvent de :
   - un autre terminal ou Cursor qui utilise encore `supabase` ou des fichiers npm ;
   - l’antivirus qui verrouille des dossiers ;
   - des droits insuffisants sur `C:\Users\...\AppData\Roaming\npm`.

Même si vous corrigez les EPERM (fermer les processus, lancer en admin, etc.), **l’installation globale sera quand même bloquée** par le message « Installing Supabase CLI as a global module is not supported ».

---

## Que faire à la place

Vous avez **deux options** pour utiliser le CLI Supabase sans `npm install -g supabase`.

### Option A : Utiliser le projet (recommandé, sans rien installer globalement)

Le CLI est déjà en **devDependency** du projet. Dans le dossier du projet :

```powershell
cd "C:\Users\Mustafa\Desktop\logi Clinic 1"
npm install
```

Puis utilisez **npx** ou les scripts npm :

```powershell
npx supabase db push
npx supabase functions deploy api
npx supabase link --project-ref bnfgemmlokvetmohiqch
```

Ou les scripts définis dans `package.json` :

```powershell
npm run supabase:db:push
npm run supabase:functions:deploy
npm run supabase:link
```

Aucune installation globale, tout reste dans le projet.

---

### Option B : Installer le CLI globalement avec Scoop (Windows)

Si vous voulez taper `supabase` dans n’importe quel terminal, utilisez **Scoop** (méthode officielle pour Windows).

1. **Installer Scoop** (PowerShell, en mode utilisateur) :

   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
   ```

2. **Ajouter le bucket Supabase et installer le CLI** :

   ```powershell
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

3. **Vérifier** :

   ```powershell
   supabase --version
   ```

Ensuite vous pouvez utiliser `supabase db push`, `supabase functions deploy api`, etc. partout.

---

## Résumé

| Méthode                         | Résultat |
|---------------------------------|----------|
| `npm install -g supabase`       | **Ne fonctionne pas** (bloqué volontairement par Supabase) |
| `npm install` + `npx supabase`  | **Fonctionne** (CLI dans le projet) |
| Scoop : `scoop install supabase` | **Fonctionne** (CLI global sur Windows) |

Pour éviter tout échec, **n’utilisez pas** `npm install -g supabase`. Utilisez soit **npx / scripts npm** dans le projet, soit **Scoop** pour une installation globale sous Windows.
