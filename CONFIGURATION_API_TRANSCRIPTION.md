# 🎤 Configuration Rapide - API de Transcription Vocale

## 📝 Étapes Rapides

### 1. Ajouter votre clé API

**Option A : Fichier .env (Recommandé)**

Créez ou modifiez le fichier `.env` dans le répertoire `server/` :

```env
SPEECH_TO_TEXT_API_KEY=votre-clé-api-ici
SPEECH_TO_TEXT_PROVIDER=openai
```

**Option B : Docker Compose**

Ajoutez dans `docker-compose.yml` (déjà configuré) :

```yaml
environment:
  SPEECH_TO_TEXT_API_KEY: votre-clé-api-ici
  SPEECH_TO_TEXT_PROVIDER: openai
```

### 2. Installer les dépendances

```bash
cd server
npm install multer form-data
npm install --save-dev @types/multer
```

### 3. Redémarrer le serveur

```bash
# Si vous utilisez Docker
docker-compose restart server

# Si vous utilisez npm
cd server
npm run dev
```

### 4. Vérifier la configuration

```bash
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

## 🔑 Providers Supportés

### OpenAI Whisper (Recommandé)
```env
SPEECH_TO_TEXT_PROVIDER=openai
SPEECH_TO_TEXT_API_KEY=sk-votre-clé-ici
```

### Google Speech-to-Text
```env
SPEECH_TO_TEXT_PROVIDER=google
SPEECH_TO_TEXT_API_KEY=votre-clé-google
```

### Azure Speech Services
```env
SPEECH_TO_TEXT_PROVIDER=azure
SPEECH_TO_TEXT_API_KEY=votre-clé-azure
AZURE_SPEECH_REGION=francecentral
```

## ✅ C'est tout !

Le système utilisera automatiquement votre API pour la transcription vocale. Si aucune clé n'est configurée, il utilisera l'API du navigateur (si disponible).

## 📚 Documentation Complète

Voir `GUIDE_CONFIGURATION_TRANSCRIPTION_VOCALE.md` pour plus de détails.

