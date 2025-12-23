"""
Script pour corriger les tests générés par TestSprite
- Corrige les endpoints d'authentification
- Met à jour les mots de passe
- Corrige le format de réponse du token
"""

import os
import re
import glob

# Configuration
BASE_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'testsprite_tests')
TEST_FILES = glob.glob(os.path.join(BASE_DIR, 'TC*.py'))

# Corrections à appliquer
CORRECTIONS = [
    # Endpoint d'authentification
    (r'f"{BASE_URL}/auth/login"', r'f"{BASE_URL}/api/auth/login"'),
    (r'"{BASE_URL}/auth/login"', r'"{BASE_URL}/api/auth/login"'),
    (r'/auth/login', r'/api/auth/login'),
    
    # Mots de passe
    (r'"password": "superadminpassword"', r'"password": "SuperAdmin2024!"'),
    (r'"password": "clinicadminpassword"', r'"password": "TempClinic2024!"'),
    (r"'password': 'superadminpassword'", r"'password': 'SuperAdmin2024!'"),
    (r"'password': 'clinicadminpassword'", r"'password': 'TempClinic2024!'"),
    
    # Format de réponse du token
    (r'response\.json\(\)\.get\("access_token"\)', r'response.json().get("token")'),
    (r'response\["access_token"\]', r'response["token"]'),
    (r'\.get\("access_token"\)', r'.get("token")'),
]

def fix_test_file(file_path):
    """Corrige un fichier de test"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes_made = False
        
        # Appliquer toutes les corrections
        for pattern, replacement in CORRECTIONS:
            new_content = re.sub(pattern, replacement, content)
            if new_content != content:
                changes_made = True
                content = new_content
        
        # Sauvegarder si des changements ont été faits
        if changes_made:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Corrigé: {os.path.basename(file_path)}")
            return True
        else:
            print(f"ℹ️  Aucun changement: {os.path.basename(file_path)}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors de la correction de {file_path}: {e}")
        return False

def main():
    print("🔧 Correction des tests générés par TestSprite...\n")
    
    fixed_count = 0
    total_count = len(TEST_FILES)
    
    for test_file in TEST_FILES:
        if fix_test_file(test_file):
            fixed_count += 1
    
    print(f"\n✅ Correction terminée: {fixed_count}/{total_count} fichiers corrigés")

if __name__ == '__main__':
    main()

