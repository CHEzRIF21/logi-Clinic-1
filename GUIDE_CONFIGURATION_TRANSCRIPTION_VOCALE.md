# 🎤 Guide de Configuration - Transcription Vocale avec API

Ce guide vous explique comment configurer la transcription vocale en utilisant une API externe (OpenAI Whisper, Google Speech-to-Text, Azure Speech, etc.).

## 📋 Prérequis

- Une clé API pour un service de transcription vocale
- Node.js et npm installés
- Le serveur backend configuré

## 🔑 Configuration de la Clé API

### Option 1: Via fichier .env (Recommandé)

Créez ou modifiez le fichier `.env` à la racine du projet `server/` :

```env
# Configuration Transcription Vocale
SPEECH_TO_TEXT_API_KEY=votre-clé-api-ici
SPEECH_TO_TEXT_PROVIDER=openai
SPEECH_TO_TEXT_API_URL=
```

### Option 2: Via docker-compose.yml

Ajoutez les variables dans `docker-compose.yml` :

```yaml
server:
  environment:
    SPEECH_TO_TEXT_API_KEY: votre-clé-api-ici
    SPEECH_TO_TEXT_PROVIDER: openai
    SPEECH_TO_TEXT_API_URL: # Optionnel, URL personnalisée
```

### Option 3: Variables d'environnement système

```bash
export SPEECH_TO_TEXT_API_KEY="votre-clé-api-ici"
export SPEECH_TO_TEXT_PROVIDER="openai"
```

## 🔧 Providers Supportés

### 1. OpenAI Whisper (Recommandé)

```env
SPEECH_TO_TEXT_PROVIDER=openai
SPEECH_TO_TEXT_API_KEY=sk-votre-clé-openai
```

**Avantages :**
- Très précis
- Supporte de nombreuses langues
- Modèle : `whisper-1`

**Obtenir une clé :**
1. Allez sur https://platform.openai.com/api-keys
2. Créez un compte ou connectez-vous
3. Générez une nouvelle clé API
4. Copiez la clé (commence par `sk-`)

### 2. Google Speech-to-Text

```env
SPEECH_TO_TEXT_PROVIDER=google
SPEECH_TO_TEXT_API_KEY=votre-clé-google-cloud
```

**Avantages :**
- Intégration Google Cloud
- Supporte le streaming
- Bonne qualité

**Obtenir une clé :**
1. Allez sur https://console.cloud.google.com/
2. Créez un projet ou sélectionnez-en un
3. Activez l'API Speech-to-Text
4. Créez une clé API dans "Identifiants"

### 3. Azure Speech Services

```env
SPEECH_TO_TEXT_PROVIDER=azure
SPEECH_TO_TEXT_API_KEY=votre-clé-azure
AZURE_SPEECH_REGION=francecentral
```

**Avantages :**
- Intégration Microsoft Azure
- Supporte plusieurs régions
- Bonne qualité

**Obtenir une clé :**
1. Allez sur https://portal.azure.com/
2. Créez une ressource "Speech Services"
3. Copiez la clé et la région

### 4. API Personnalisée

```env
SPEECH_TO_TEXT_PROVIDER=custom
SPEECH_TO_TEXT_API_KEY=votre-clé
SPEECH_TO_TEXT_API_URL=https://votre-api.com/transcribe
```

**Format attendu de la réponse :**
```json
{
  "text": "texte transcrit",
  "confidence": 0.95,
  "language": "fr-FR"
}
```

## 📦 Installation des Dépendances

Dans le répertoire `server/` :

```bash
npm install multer form-data
npm install --save-dev @types/multer
```

## 🚀 Utilisation

### Dans le Frontend

Le hook `useSpeechRecognitionAPI` utilise automatiquement le backend si configuré :

```typescript
import { useSpeechRecognitionAPI } from '@/hooks/useSpeechRecognitionAPI';

const MyComponent = () => {
  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    isUsingAPI, // true si utilise le backend API
  } = useSpeechRecognitionAPI('fr-FR', true, true, true);

  return (
    <div>
      <button onClick={startListening}>Démarrer</button>
      <button onClick={stopListening}>Arrêter</button>
      <p>{transcript}</p>
    </div>
  );
};
```

### Vérifier le Statut

```bash
# Vérifier si le service est configuré
curl http://localhost:3000/api/speech-to-text/status
```

Réponse :
```json
{
  "configured": true,
  "provider": "openai",
  "message": "Service de transcription disponible"
}
```

### Tester la Transcription

```bash
# Envoyer un fichier audio pour transcription
curl -X POST http://localhost:3000/api/speech-to-text/transcribe \
  -F "audio=@votre-fichier.webm" \
  -F "language=fr-FR"
```

## 🔄 Migration depuis l'API du Navigateur

Si vous utilisez actuellement `useSpeechRecognition`, remplacez-le par `useSpeechRecognitionAPI` :

**Avant :**
```typescript
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
```

**Après :**
```typescript
import { useSpeechRecognitionAPI } from '@/hooks/useSpeechRecognitionAPI';
```

Le hook fonctionne de la même manière, mais utilise le backend si disponible.

## 🐛 Dépannage

### Le service n'est pas configuré

**Erreur :** `Service de transcription non configuré`

**Solution :**
1. Vérifiez que les variables d'environnement sont définies
2. Redémarrez le serveur
3. Vérifiez le statut : `GET /api/speech-to-text/status`

### Erreur d'authentification API

**Erreur :** `Erreur API OpenAI` ou similaire

**Solution :**
1. Vérifiez que votre clé API est correcte
2. Vérifiez que votre clé API n'a pas expiré
3. Vérifiez les quotas de votre compte API

### Le microphone n'est pas accessible

**Erreur :** `Permission d'accès au microphone refusée`

**Solution :**
1. Autorisez l'accès au microphone dans les paramètres du navigateur
2. Utilisez HTTPS en production (requis pour l'accès microphone)

### Format audio non supporté

**Erreur :** `Format audio non supporté`

**Solution :**
Les formats supportés sont : webm, wav, mp3, ogg, m4a

## 📝 Exemples de Configuration Complète

### Configuration OpenAI

```env
SPEECH_TO_TEXT_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SPEECH_TO_TEXT_PROVIDER=openai
```

### Configuration Google

```env
SPEECH_TO_TEXT_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SPEECH_TO_TEXT_PROVIDER=google
```

### Configuration Azure

```env
SPEECH_TO_TEXT_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SPEECH_TO_TEXT_PROVIDER=azure
AZURE_SPEECH_REGION=francecentral
```

## ✅ Checklist de Configuration

- [ ] Clé API obtenue et copiée
- [ ] Variables d'environnement configurées
- [ ] Dépendances installées (`multer`, `form-data`)
- [ ] Serveur redémarré
- [ ] Statut vérifié : `GET /api/speech-to-text/status`
- [ ] Test de transcription effectué
- [ ] Hook frontend mis à jour si nécessaire

## 🔒 Sécurité

⚠️ **Important :** Ne commitez jamais votre clé API dans le dépôt Git !

1. Ajoutez `.env` à `.gitignore`
2. Utilisez des variables d'environnement système en production
3. Limitez les permissions de votre clé API
4. Surveillez l'utilisation de votre clé API

## 📚 Ressources

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference/audio)
- [Google Speech-to-Text](https://cloud.google.com/speech-to-text/docs)
- [Azure Speech Services](https://azure.microsoft.com/services/cognitive-services/speech-services/)

---

**Note :** Si aucune clé API n'est configurée, le système utilisera automatiquement l'API Web Speech Recognition du navigateur (si disponible).

