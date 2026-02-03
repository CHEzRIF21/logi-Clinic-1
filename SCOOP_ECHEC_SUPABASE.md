# Si l'installation Scoop échoue (fichier verrouillé, dossier déjà existant)

## Ce que vous voyez

Lors de l'installation de Scoop ou de Supabase via Scoop :

- `fatal: destination path '...\scoop\apps\scoop\current' already exists and is not an empty dir`
- `The process cannot access the file '...\scoop-main.zip' because it is being used by another process`

Scoop est souvent **déjà partiellement installé**. Un autre processus (terminal, antivirus, Cursor) verrouille un fichier.

---

## Option 1 : Utiliser npx (recommandé, sans Scoop)

Vous n'avez **pas besoin** de Scoop pour utiliser le CLI Supabase. Dans le dossier du projet :

```powershell
cd "C:\Users\Mustafa\Desktop\logi Clinic 1"
npm install
npx supabase db push
npx supabase functions deploy api
npx supabase link --project-ref bnfgemmlokvetmohiqch
```

Ou les scripts npm : `npm run supabase:db:push`, `npm run supabase:functions:deploy`, `npm run supabase:link`.

Aucune installation globale, aucun Scoop.

---

## Option 2 : Vérifier si Scoop fonctionne déjà

Scoop peut déjà être installé. Dans un **nouveau** PowerShell :

```powershell
scoop --version
```

- **Si ça affiche une version** : Scoop est OK. Ajoutez le bucket Supabase et installez le CLI :

  ```powershell
  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
  scoop install supabase
  ```

- **Si « scoop n'est pas reconnu »** : soit vous utilisez l’option 1 (npx), soit vous réparez Scoop (option 3).

---

## Option 3 : Réparer / réessayer Scoop

1. Fermez **tous** les terminaux (y compris ceux dans Cursor) et fermez Cursor.
2. Rouvrez **PowerShell** (en mode utilisateur ou en Administrateur).
3. Mettez à jour Scoop (si déjà installé) :

   ```powershell
   scoop update
   ```

4. Puis :

   ```powershell
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

Si le zip est encore verrouillé, redémarrez le PC puis réessayez les commandes ci-dessus.

---

## Résumé

| Situation | Action |
|-----------|--------|
| Vous voulez juste utiliser Supabase CLI | **Option 1** : `npm install` puis `npx supabase ...` ou `npm run supabase:...` |
| Scoop répond (`scoop --version` OK) | **Option 2** : `scoop bucket add supabase ...` puis `scoop install supabase` |
| Scoop ne répond pas ou échoue | **Option 1** ou **Option 3** (fermer tout, réessayer, voire redémarrer) |
