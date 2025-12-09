// Liste des pays avec leurs codes et drapeaux (emoji)
export interface Country {
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
}

export const countries: Country[] = [
  // Bénin en premier (favori)
  { code: 'BJ', name: 'Béninoise', flag: '🇧🇯', phoneCode: '+229' },
  
  // Autres pays africains
  { code: 'CI', name: 'Ivoirienne', flag: '🇨🇮', phoneCode: '+225' },
  { code: 'SN', name: 'Sénégalaise', flag: '🇸🇳', phoneCode: '+221' },
  { code: 'ML', name: 'Malienne', flag: '🇲🇱', phoneCode: '+223' },
  { code: 'BF', name: 'Burkinabè', flag: '🇧🇫', phoneCode: '+226' },
  { code: 'NE', name: 'Nigérienne', flag: '🇳🇪', phoneCode: '+227' },
  { code: 'TG', name: 'Togolaise', flag: '🇹🇬', phoneCode: '+228' },
  { code: 'GH', name: 'Ghanéenne', flag: '🇬🇭', phoneCode: '+233' },
  { code: 'NG', name: 'Nigériane', flag: '🇳🇬', phoneCode: '+234' },
  { code: 'CM', name: 'Camerounaise', flag: '🇨🇲', phoneCode: '+237' },
  { code: 'TD', name: 'Tchadienne', flag: '🇹🇩', phoneCode: '+235' },
  { code: 'CF', name: 'Centrafricaine', flag: '🇨🇫', phoneCode: '+236' },
  { code: 'GA', name: 'Gabonaise', flag: '🇬🇦', phoneCode: '+241' },
  { code: 'CG', name: 'Congolaise', flag: '🇨🇬', phoneCode: '+242' },
  { code: 'CD', name: 'Congolaise (RDC)', flag: '🇨🇩', phoneCode: '+243' },
  { code: 'AO', name: 'Angolaise', flag: '🇦🇴', phoneCode: '+244' },
  { code: 'GW', name: 'Bissau-Guinéenne', flag: '🇬🇼', phoneCode: '+245' },
  { code: 'GN', name: 'Guinéenne', flag: '🇬🇳', phoneCode: '+224' },
  { code: 'SL', name: 'Sierra-Léonaise', flag: '🇸🇱', phoneCode: '+232' },
  { code: 'LR', name: 'Libérienne', flag: '🇱🇷', phoneCode: '+231' },
  { code: 'MR', name: 'Mauritanienne', flag: '🇲🇷', phoneCode: '+222' },
  { code: 'GM', name: 'Gambienne', flag: '🇬🇲', phoneCode: '+220' },
  { code: 'CV', name: 'Cap-Verdienne', flag: '🇨🇻', phoneCode: '+238' },
  { code: 'ST', name: 'Santotoméenne', flag: '🇸🇹', phoneCode: '+239' },
  { code: 'GQ', name: 'Équato-Guinéenne', flag: '🇬🇶', phoneCode: '+240' },
  { code: 'DZ', name: 'Algérienne', flag: '🇩🇿', phoneCode: '+213' },
  { code: 'TN', name: 'Tunisienne', flag: '🇹🇳', phoneCode: '+216' },
  { code: 'MA', name: 'Marocaine', flag: '🇲🇦', phoneCode: '+212' },
  { code: 'LY', name: 'Libyenne', flag: '🇱🇾', phoneCode: '+218' },
  { code: 'EG', name: 'Égyptienne', flag: '🇪🇬', phoneCode: '+20' },
  { code: 'SD', name: 'Soudanaise', flag: '🇸🇩', phoneCode: '+249' },
  { code: 'ET', name: 'Éthiopienne', flag: '🇪🇹', phoneCode: '+251' },
  { code: 'ER', name: 'Érythréenne', flag: '🇪🇷', phoneCode: '+291' },
  { code: 'DJ', name: 'Djiboutienne', flag: '🇩🇯', phoneCode: '+253' },
  { code: 'SO', name: 'Somalienne', flag: '🇸🇴', phoneCode: '+252' },
  { code: 'KE', name: 'Kényane', flag: '🇰🇪', phoneCode: '+254' },
  { code: 'UG', name: 'Ougandaise', flag: '🇺🇬', phoneCode: '+256' },
  { code: 'RW', name: 'Rwandaise', flag: '🇷🇼', phoneCode: '+250' },
  { code: 'BI', name: 'Burundaise', flag: '🇧🇮', phoneCode: '+257' },
  { code: 'TZ', name: 'Tanzanienne', flag: '🇹🇿', phoneCode: '+255' },
  { code: 'MW', name: 'Malawienne', flag: '🇲🇼', phoneCode: '+265' },
  { code: 'ZM', name: 'Zambienne', flag: '🇿🇲', phoneCode: '+260' },
  { code: 'ZW', name: 'Zimbabwéenne', flag: '🇿🇼', phoneCode: '+263' },
  { code: 'BW', name: 'Botswanaise', flag: '🇧🇼', phoneCode: '+267' },
  { code: 'NA', name: 'Namibienne', flag: '🇳🇦', phoneCode: '+264' },
  { code: 'ZA', name: 'Sud-Africaine', flag: '🇿🇦', phoneCode: '+27' },
  { code: 'LS', name: 'Lesothane', flag: '🇱🇸', phoneCode: '+266' },
  { code: 'SZ', name: 'Swazie', flag: '🇸🇿', phoneCode: '+268' },
  { code: 'MZ', name: 'Mozambicaine', flag: '🇲🇿', phoneCode: '+258' },
  { code: 'MG', name: 'Malgache', flag: '🇲🇬', phoneCode: '+261' },
  { code: 'MU', name: 'Mauricienne', flag: '🇲🇺', phoneCode: '+230' },
  { code: 'SC', name: 'Seychelloise', flag: '🇸🇨', phoneCode: '+248' },
  { code: 'KM', name: 'Comorienne', flag: '🇰🇲', phoneCode: '+269' },
  
  // Autres pays
  { code: 'FR', name: 'Française', flag: '🇫🇷', phoneCode: '+33' },
  { code: 'BE', name: 'Belge', flag: '🇧🇪', phoneCode: '+32' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭', phoneCode: '+41' },
  { code: 'CA', name: 'Canadienne', flag: '🇨🇦', phoneCode: '+1' },
  { code: 'US', name: 'Américaine', flag: '🇺🇸', phoneCode: '+1' },
  { code: 'GB', name: 'Britannique', flag: '🇬🇧', phoneCode: '+44' },
  { code: 'DE', name: 'Allemande', flag: '🇩🇪', phoneCode: '+49' },
  { code: 'IT', name: 'Italienne', flag: '🇮🇹', phoneCode: '+39' },
  { code: 'ES', name: 'Espagnole', flag: '🇪🇸', phoneCode: '+34' },
  { code: 'PT', name: 'Portugaise', flag: '🇵🇹', phoneCode: '+351' },
  { code: 'BR', name: 'Brésilienne', flag: '🇧🇷', phoneCode: '+55' },
  { code: 'CN', name: 'Chinoise', flag: '🇨🇳', phoneCode: '+86' },
  { code: 'IN', name: 'Indienne', flag: '🇮🇳', phoneCode: '+91' },
  { code: 'JP', name: 'Japonaise', flag: '🇯🇵', phoneCode: '+81' },
  { code: 'KR', name: 'Coréenne', flag: '🇰🇷', phoneCode: '+82' },
  { code: 'AU', name: 'Australienne', flag: '🇦🇺', phoneCode: '+61' },
  { code: 'RU', name: 'Russe', flag: '🇷🇺', phoneCode: '+7' },
  { code: 'TR', name: 'Turque', flag: '🇹🇷', phoneCode: '+90' },
  { code: 'SA', name: 'Saoudienne', flag: '🇸🇦', phoneCode: '+966' },
  { code: 'AE', name: 'Émiratie', flag: '🇦🇪', phoneCode: '+971' },
];

// Fonction pour obtenir un pays par code
export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(c => c.code === code);
};

// Fonction pour obtenir un pays par code téléphone
export const getCountryByPhoneCode = (phoneCode: string): Country | undefined => {
  return countries.find(c => c.phoneCode === phoneCode);
};

// Pays par défaut (Bénin)
export const defaultCountry: Country = countries[0];

