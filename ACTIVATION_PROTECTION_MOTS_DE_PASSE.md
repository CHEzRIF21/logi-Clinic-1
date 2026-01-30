# Activation de la Protection contre les Mots de Passe Compromis

## Problème
Le linter Supabase a détecté que la protection contre les mots de passe compromis (Leaked Password Protection) est actuellement désactivée.

## Description
Supabase Auth peut empêcher l'utilisation de mots de passe compromis en vérifiant contre la base de données HaveIBeenPwned.org. Cette fonctionnalité améliore la sécurité en empêchant les utilisateurs d'utiliser des mots de passe qui ont été compromis lors de fuites de données.

## Solution : Activation Manuelle dans le Dashboard Supabase

Cette fonctionnalité doit être activée manuellement dans le Dashboard Supabase car elle nécessite une configuration dans l'interface d'administration.

### Étapes pour activer la protection :

1. **Accéder au Dashboard Supabase**
   - Se connecter à [https://app.supabase.com](https://app.supabase.com)
   - Sélectionner le projet concerné

2. **Naviguer vers les paramètres d'authentification**
   - Dans le menu latéral, aller à **Authentication**
   - Cliquer sur **Settings** (ou **Paramètres**)

3. **Activer la protection contre les mots de passe compromis**
   - Chercher la section **Password Security** ou **Sécurité des Mots de Passe**
   - Trouver l'option **"Leaked Password Protection"** ou **"Protection contre les Mots de Passe Compromis"**
   - Activer le toggle pour cette fonctionnalité

4. **Vérifier l'activation**
   - Après activation, les nouveaux utilisateurs ne pourront plus utiliser des mots de passe qui apparaissent dans la base de données HaveIBeenPwned.org
   - Les utilisateurs existants ne sont pas affectés

## Documentation Supabase
Pour plus d'informations, consulter :
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Note
Cette fonctionnalité utilise l'API HaveIBeenPwned.org de manière sécurisée (via k-anonymity) pour vérifier les mots de passe sans les transmettre en clair.
