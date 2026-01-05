# 🔧 Explication de la Correction de l'Erreur PowerShell

## ❌ Le Problème

L'erreur se produisait à la **ligne 113-122** du script `reset_campus001_admin.ps1` :

```
Method invocation failed because [System.Net.Http.HttpResponseMessage] does not contain a method named 'GetResponseStream'.
```

### Pourquoi cette erreur ?

Dans **PowerShell moderne** (PowerShell Core 6+ et PowerShell 7+), `Invoke-RestMethod` utilise `HttpClient` qui retourne un objet `HttpResponseMessage`. Cet objet **n'a pas** la méthode `GetResponseStream()` qui existait dans les anciennes versions de PowerShell (Windows PowerShell 5.1).

**Ancien code (qui ne fonctionne pas) :**
```powershell
if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host $responseBody -ForegroundColor Red
}
```

---

## ✅ La Solution

Il faut utiliser la **bonne méthode** pour lire le contenu de l'erreur HTTP dans PowerShell moderne :

### Méthode 1 : Utiliser `$_.ErrorDetails.Message` (Recommandé)

```powershell
catch [Microsoft.PowerShell.Commands.HttpResponseException] {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorContent = $_.ErrorDetails.Message
    
    if ($errorContent) {
        # Parser le JSON si possible
        $errorJson = $errorContent | ConvertFrom-Json
        Write-Host "Erreur: $($errorJson.error)" -ForegroundColor Red
    }
}
```

### Méthode 2 : Utiliser `ReadAsStringAsync()` (Alternative)

```powershell
catch [Microsoft.PowerShell.Commands.HttpResponseException] {
    $response = $_.Exception.Response
    $stream = $response.Content.ReadAsStringAsync().Result
    Write-Host $stream -ForegroundColor Red
}
```

---

## 📋 Explication Step-by-Step de la Correction

### **ÉTAPE 1 : Identifier le Type d'Exception**

Au lieu de capturer toutes les exceptions avec `catch {`, on capture spécifiquement les erreurs HTTP :

```powershell
# AVANT (trop général)
catch {
    # ...
}

# APRÈS (spécifique aux erreurs HTTP)
catch [Microsoft.PowerShell.Commands.HttpResponseException] {
    # Gestion des erreurs HTTP
}
```

**Pourquoi ?**
- `HttpResponseException` est levée spécifiquement pour les erreurs HTTP (400, 401, 403, 404, 500, etc.)
- Cela permet de gérer différemment les erreurs HTTP et les autres erreurs (réseau, syntaxe, etc.)

---

### **ÉTAPE 2 : Récupérer le Code de Statut HTTP**

```powershell
$statusCode = $_.Exception.Response.StatusCode.value__
```

**Explication :**
- `$_.Exception.Response` : L'objet de réponse HTTP
- `.StatusCode` : Le code de statut (200, 400, 401, 404, 500, etc.)
- `.value__` : La valeur numérique du code (400, 401, etc.)

**Exemples de codes :**
- `200` : Succès
- `400` : Mauvaise requête (paramètres invalides)
- `401` : Non authentifié (token invalide)
- `403` : Non autorisé (pas les permissions)
- `404` : Non trouvé (fonction non déployée)
- `500` : Erreur serveur

---

### **ÉTAPE 3 : Récupérer le Message d'Erreur**

```powershell
$errorContent = $_.ErrorDetails.Message
```

**Explication :**
- `$_.ErrorDetails.Message` : Contient le corps de la réponse HTTP (généralement du JSON)
- C'est la **bonne méthode** pour PowerShell moderne
- Ne nécessite pas `GetResponseStream()` qui n'existe plus

**Exemple de contenu :**
```json
{
  "success": false,
  "error": "Clinic CAMPUS-001 not found",
  "details": "The clinic does not exist in the database"
}
```

---

### **ÉTAPE 4 : Parser le JSON d'Erreur**

```powershell
if ($errorContent) {
    try {
        $errorJson = $errorContent | ConvertFrom-Json
        Write-Host "Erreur: $($errorJson.error)" -ForegroundColor Red
        if ($errorJson.details) {
            Write-Host "Détails: $($errorJson.details)" -ForegroundColor Red
        }
    } catch {
        # Si ce n'est pas du JSON, afficher tel quel
        Write-Host "Réponse: $errorContent" -ForegroundColor Red
    }
}
```

**Explication :**
1. **Vérifier** si `$errorContent` existe
2. **Essayer** de convertir en JSON avec `ConvertFrom-Json`
3. **Afficher** les champs structurés (`error`, `details`, etc.)
4. **Si échec** (pas du JSON), afficher le contenu brut

**Pourquoi un try/catch ici ?**
- Parfois la réponse n'est pas du JSON (texte brut, HTML, etc.)
- On veut afficher quelque chose même si le parsing échoue

---

### **ÉTAPE 5 : Gérer les Autres Erreurs**

```powershell
} catch {
    # Gestion des autres erreurs (non-HTTP)
    Write-Host "❌ Erreur inattendue" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
}
```

**Explication :**
- Ce `catch` général capture toutes les autres erreurs :
  - Erreurs de réseau (pas de connexion)
  - Erreurs de syntaxe PowerShell
  - Erreurs inattendues

---

## 🔍 Comparaison Avant/Après

### **AVANT (Ne fonctionne pas)**

```powershell
catch {
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host $responseBody -ForegroundColor Red
    }
}
```

**Problèmes :**
- ❌ `GetResponseStream()` n'existe pas dans PowerShell moderne
- ❌ Ne distingue pas les erreurs HTTP des autres erreurs
- ❌ Ne parse pas le JSON d'erreur
- ❌ N'affiche pas le code de statut HTTP

---

### **APRÈS (Fonctionne)**

```powershell
catch [Microsoft.PowerShell.Commands.HttpResponseException] {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorContent = $_.ErrorDetails.Message
    
    Write-Host "❌ Erreur HTTP $statusCode" -ForegroundColor Red
    
    if ($errorContent) {
        try {
            $errorJson = $errorContent | ConvertFrom-Json
            Write-Host "Erreur: $($errorJson.error)" -ForegroundColor Red
            if ($errorJson.details) {
                Write-Host "Détails: $($errorJson.details)" -ForegroundColor Red
            }
        } catch {
            Write-Host "Réponse: $errorContent" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Erreur inattendue: $($_.Exception.Message)" -ForegroundColor Red
}
```

**Avantages :**
- ✅ Utilise `$_.ErrorDetails.Message` (méthode correcte)
- ✅ Distingue les erreurs HTTP des autres erreurs
- ✅ Parse et affiche le JSON d'erreur de manière structurée
- ✅ Affiche le code de statut HTTP
- ✅ Gère les cas où la réponse n'est pas du JSON

---

## 🎯 Résultat Attendu

Maintenant, quand une erreur se produit, vous verrez :

```
❌ Erreur HTTP 404 lors de l'appel à bootstrap-clinic-admin-auth

Erreur: Clinic CAMPUS-001 not found
Détails: The clinic does not exist in the database

💡 Solutions possibles :
   1. Vérifiez que la migration 'reset_campus001_admin_password' a été appliquée
   2. Vérifiez que l'utilisateur Auth a été supprimé
   3. Vérifiez que le token SUPER_ADMIN est valide
   4. Vérifiez que la fonction bootstrap-clinic-admin-auth est déployée
   5. Vérifiez que la clinique CAMPUS-001 existe et est active
```

Au lieu de :

```
❌ Erreur lors de l'appel à bootstrap-clinic-admin-auth
Method invocation failed because [System.Net.Http.HttpResponseMessage] does not contain a method named 'GetResponseStream'.
```

---

## 📚 Références

- **PowerShell Documentation** : [Invoke-RestMethod](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/invoke-restmethod)
- **HttpResponseException** : [Microsoft.PowerShell.Commands.HttpResponseException](https://learn.microsoft.com/en-us/dotnet/api/microsoft.powershell.commands.httpresponseexception)

---

**🎉 Maintenant le script affichera correctement les erreurs HTTP avec tous les détails !**

