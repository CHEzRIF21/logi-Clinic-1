# 🎤 Instructions - Dictée Vocale Configurée

## ✅ Configuration Terminée

Votre clé API de transcription vocale a été configurée et toutes les installations nécessaires ont été effectuées.

## 📋 Ce qui a été fait

1. ✅ **Clé API configurée** dans :
   - `server/config.env`
   - `backend/config.env`
   - `docker-compose.yml`

2. ✅ **Dépendances installées** :
   - `multer` (gestion des fichiers audio)
   - `form-data` (envoi de données multipart)
   - `@types/multer` (types TypeScript)

3. ✅ **Composants mis à jour** :
   - `AnamneseEditor.tsx` utilise maintenant l'API backend
   - `ExamenPhysiqueForm.tsx` utilise maintenant l'API backend

4. ✅ **Service backend créé** :
   - Endpoint : `/api/speech-to-text/transcribe`
   - Statut : `/api/speech-to-text/status`

## 🚀 Utilisation

### 1. Démarrer le serveur

```bash
cd server
npm run dev
```

### 2. Vérifier que l'API est configurée

```bash
# Dans un autre terminal
curl http://localhost:3000/api/speech-to-text/status
```

Vous devriez voir :
```json
{
  "configured": true,
  "provider": "openai",
  "message": "Service de transcription disponible"
}
```

### 3. Utiliser la dictée vocale dans l'application

1. Ouvrez l'application dans votre navigateur
2. Allez dans le module Consultation
3. Cliquez sur le bouton 🎤 (microphone) dans les champs de texte
4. Parlez dans votre microphone
5. Le texte sera transcrit automatiquement

## 🔧 Dépannage

### Le service n'est pas configuré

Si vous voyez `"configured": false` :

1. Vérifiez que le fichier `server/config.env` existe et contient :
   ```
   SPEECH_TO_TEXT_API_KEY=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
   SPEECH_TO_TEXT_PROVIDER=openai
   ```

2. Redémarrez le serveur

### Erreur de microphone

1. Autorisez l'accès au microphone dans les paramètres du navigateur
2. Utilisez HTTPS en production (requis pour l'accès microphone)

### Erreur API

Si vous voyez une erreur API :

1. Vérifiez que votre clé API est valide
2. Vérifiez les quotas de votre compte OpenAI
3. Consultez les logs du serveur pour plus de détails

## 📝 Test Manuel

Pour tester manuellement la transcription :

```bash
# Créer un fichier audio de test (webm, wav, mp3, etc.)
# Puis envoyer :
curl -X POST http://localhost:3000/api/speech-to-text/transcribe \
  -F "audio=@votre-fichier.webm" \
  -F "language=fr-FR"
```

## 🎯 Fonctionnalités

- ✅ Transcription en temps réel
- ✅ Support de plusieurs langues (français par défaut)
- ✅ Fallback automatique sur l'API du navigateur si le backend n'est pas disponible
- ✅ Gestion des erreurs
- ✅ Support de plusieurs formats audio (webm, wav, mp3, ogg, m4a)

## 📚 Documentation

Pour plus de détails, consultez :
- `GUIDE_CONFIGURATION_TRANSCRIPTION_VOCALE.md` - Guide complet
- `CONFIGURATION_API_TRANSCRIPTION.md` - Guide rapide

---

**Note :** La dictée vocale fonctionne maintenant avec votre clé API OpenAI. Si le backend n'est pas disponible, le système utilisera automatiquement l'API du navigateur (si supportée).

