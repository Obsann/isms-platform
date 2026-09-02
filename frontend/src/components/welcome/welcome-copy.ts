export type WelcomeLang = 'en' | 'am';

export const WELCOME_LANG_STORAGE_KEY = 'isms-welcome-lang';

export const WELCOME_LANGUAGES = [
  { code: 'en' as const, short: 'EN', label: 'English' },
  { code: 'am' as const, short: 'አም', label: 'አማርኛ' },
];

export interface WelcomeSlideCopy {
  badge: string;
  title: string;
}

export interface WelcomeCardCopy {
  title: string;
  body: string;
}

export interface WelcomeStepCopy {
  step: string;
  title: string;
  body: string;
}

export interface WelcomeHeroVisualCopy {
  accountLabel: string;
  accountMask: string;
  balanceLabel: string;
  balance: string;
  postingsLabel: string;
  debitLabel: string;
  debitAmount: string;
  creditLabel: string;
  creditAmount: string;
  balancedNote: string;
}

export interface WelcomeCopy {
  skipToContent: string;
  navSignIn: string;
  navContinue: string;
  slides: WelcomeSlideCopy[];
  intro: string;
  ctaSignIn: string;
  ctaContinue: string;
  ctaSecondary: string;
  tenantNote: string;
  slidesLabel: string;
  slideLabelPrefix: string;
  themeToDark: string;
  themeToLight: string;
  languageLabel: string;
  heroVisual: WelcomeHeroVisualCopy;
  servicesHeading: string;
  servicesIntro: string;
  services: WelcomeCardCopy[];
  gettingStartedHeading: string;
  steps: WelcomeStepCopy[];
}

const en: WelcomeCopy = {
  skipToContent: 'Skip to content',
  navSignIn: 'Sign in',
  navContinue: 'Continue',
  slides: [
    { badge: 'Integrated SACCO management', title: 'Welcome to ISMS' },
    {
      badge: 'One ledger-backed system',
      title: 'Savings, shares, and loans — in one place',
    },
    { badge: 'Built for many SACCOs', title: 'Ledger-backed. Tenant-scoped. Role-aware.' },
    { badge: 'From branch to web', title: 'From the counter to your screen' },
  ],
  intro:
    'ISMS is the web home for participating SACCOs. Staff work the counter and the back office; members sign in to read their own accounts. Every balance change posts through the ledger.',
  ctaSignIn: 'Sign in to your portal',
  ctaContinue: 'Continue to your portal',
  ctaSecondary: 'See what ISMS does',
  tenantNote: 'Sign-in needs a tenant code from your SACCO. Super Admin uses the platform code.',
  slidesLabel: 'Welcome slides',
  slideLabelPrefix: 'Slide',
  themeToDark: 'Switch to dark mode',
  themeToLight: 'Switch to light mode',
  languageLabel: 'Change language',
  heroVisual: {
    accountLabel: 'Savings · Main',
    accountMask: 'ACCT ••• 4821',
    balanceLabel: 'Available balance',
    balance: '45,230.00 ETB',
    postingsLabel: 'Latest posting',
    debitLabel: 'Cash on hand',
    debitAmount: '1,500.00 ETB',
    creditLabel: 'Member savings',
    creditAmount: '1,500.00 ETB',
    balancedNote: 'Debits equal credits',
  },
  servicesHeading: 'Service highlights',
  servicesIntro: 'What the platform does for participating SACCOs and their members.',
  services: [
    {
      title: 'Savings accounts',
      body: 'Deposits and withdrawals posted through a balanced ledger. Available balance respects held collateral.',
    },
    {
      title: 'Share capital',
      body: 'Share purchases tracked per member, with printable share certificates from live rows.',
    },
    {
      title: 'Loans & credit',
      body: 'Eligibility multiplier, approval threshold, guarantor holds, disbursement, and repayment.',
    },
    {
      title: 'Teller desk',
      body: 'Counter postings with an offline outbox and idempotent replay. Conflicts surface, never silently win.',
    },
    {
      title: 'Reports',
      body: 'Savings summary, loan portfolio, trial balance, and HTML statements, agreements, and receipts.',
    },
    {
      title: 'Member self-service',
      body: 'Members read their own balances, statement, and loan status on the web. No USSD in MVP.',
    },
  ],
  gettingStartedHeading: 'Getting started',
  steps: [
    {
      step: 'Step 1',
      title: 'Get your tenant code',
      body: 'Your SACCO issues the code you’ll enter at sign-in. Super Admin uses the platform code.',
    },
    {
      step: 'Step 2',
      title: 'Sign in to your portal',
      body: 'You land in the portal for your role. Staff and members each have their own.',
    },
    {
      step: 'Step 3',
      title: 'Work or self-serve',
      body: 'Staff post cash and loans at the desk; members read their balances, statement, and loan status.',
    },
  ],
};

const am: WelcomeCopy = {
  skipToContent: 'ወደ ዋናው ክፍል ዝለል',
  navSignIn: 'ይግቡ',
  navContinue: 'ይቀጥሉ',
  slides: [
    { badge: 'የተቀናጀ የSACCO አስተዳደር', title: 'ወደ ISMS እንኳን በደህና መጡ' },
    {
      badge: 'በአንድ የሒሳብ መዝገብ የተደገፈ',
      title: 'ቁጠባ፣ አክሲዮንና ብድር — በአንድ ቦታ',
    },
    { badge: 'ለብዙ SACCOዎች የተሠራ', title: 'በመዝገብ የተደገፈ። ለየድርጅቱ የተከፋፈለ። በሥራ ድርሻ የሚመራ።' },
    { badge: 'ከቅርንጫፍ እስከ ኢንተርኔት', title: 'ከአገልግሎት መስጫው እስከ ስክሪንዎ' },
  ],
  intro:
    'ISMS ለተሳታፊ SACCOዎች የተዘጋጀ የኢንተርኔት መድረክ ነው። ሠራተኞች በአገልግሎት መስጫውና በጀርባ ቢሮ ይሠራሉ፤ አባላት ገብተው የራሳቸውን ሒሳብ ያያሉ። ማንኛውም የቀሪ ሒሳብ ለውጥ በመዝገቡ በኩል ይመዘገባል።',
  ctaSignIn: 'ወደ መድረክዎ ይግቡ',
  ctaContinue: 'ወደ መድረክዎ ይቀጥሉ',
  ctaSecondary: 'ISMS ምን እንደሚያደርግ ይመልከቱ',
  tenantNote: 'ለመግባት ከSACCOዎ የተሰጠ የድርጅት ኮድ ያስፈልጋል። ሱፐር አድሚን የመድረኩን ኮድ ይጠቀማል።',
  slidesLabel: 'የመግቢያ ገጾች',
  slideLabelPrefix: 'ገጽ',
  themeToDark: 'ወደ ጨለማ ገጽታ ይቀይሩ',
  themeToLight: 'ወደ ብርሃን ገጽታ ይቀይሩ',
  languageLabel: 'ቋንቋ ይቀይሩ',
  heroVisual: {
    accountLabel: 'ቁጠባ · ዋና',
    accountMask: 'ሒሳብ ••• 4821',
    balanceLabel: 'የሚነሳ ቀሪ ሒሳብ',
    balance: '45,230.00 ETB',
    postingsLabel: 'የመጨረሻ ምዝገባ',
    debitLabel: 'በእጅ ያለ ገንዘብ',
    debitAmount: '1,500.00 ETB',
    creditLabel: 'የአባል ቁጠባ',
    creditAmount: '1,500.00 ETB',
    balancedNote: 'ተቀናሽና ተጨማሪ እኩል ናቸው',
  },
  servicesHeading: 'የአገልግሎት ማጠቃለያ',
  servicesIntro: 'መድረኩ ለተሳታፊ SACCOዎችና ለአባላቶቻቸው የሚያደርገው።',
  services: [
    {
      title: 'የቁጠባ ሒሳቦች',
      body: 'ተቀማጭና ወጪ በተመጣጠነ የሒሳብ መዝገብ ይመዘገባል። የሚነሳ ቀሪ ሒሳብ በዋስትና የተያዘውን ገንዘብ አይጨምርም።',
    },
    {
      title: 'የአክሲዮን ካፒታል',
      body: 'የአክሲዮን ግዢ ለየአባሉ ይመዘገባል፤ የአክሲዮን ማረጋገጫም ካለው ትክክለኛ መረጃ ታትሞ ይወጣል።',
    },
    {
      title: 'ብድርና ክሬዲት',
      body: 'የብድር መጠን ማባዣ፣ የማጽደቅ ገደብ፣ የዋስ መያዣ፣ የብድር አሰጣጥና መመለስ።',
    },
    {
      title: 'የገንዘብ ተቀባይ ጠረጴዛ',
      body: 'በአገልግሎት መስጫው የሚደረግ ምዝገባ፣ ከመስመር ውጪ የሚያከማች ሳጥንና ድግግሞሽ የማይፈጥር መልሶ መላክ። ግጭት ሲኖር ይታያል፤ በስውር አያልፍም።',
    },
    {
      title: 'ሪፖርቶች',
      body: 'የቁጠባ ማጠቃለያ፣ የብድር ዝርዝር፣ የሒሳብ ሚዛን፣ እንዲሁም የሒሳብ መግለጫ፣ ውልና ደረሰኝ።',
    },
    {
      title: 'የአባላት ራስ-አገልግሎት',
      body: 'አባላት የራሳቸውን ቀሪ ሒሳብ፣ የሒሳብ መግለጫና የብድር ሁኔታ በኢንተርኔት ያያሉ። በዚህ እትም USSD አይካተትም።',
    },
  ],
  gettingStartedHeading: 'እንዴት መጀመር ይቻላል',
  steps: [
    {
      step: 'ደረጃ 1',
      title: 'የድርጅትዎን ኮድ ያግኙ',
      body: 'ሲገቡ የሚያስገቡትን ኮድ SACCOዎ ይሰጣል። ሱፐር አድሚን የመድረኩን ኮድ ይጠቀማል።',
    },
    {
      step: 'ደረጃ 2',
      title: 'ወደ መድረክዎ ይግቡ',
      body: 'ለሥራ ድርሻዎ የተዘጋጀው መድረክ ላይ ይደርሳሉ። ሠራተኞችና አባላት የየራሳቸው መድረክ አላቸው።',
    },
    {
      step: 'ደረጃ 3',
      title: 'ይሥሩ ወይም ራስዎን ያገልግሉ',
      body: 'ሠራተኞች ገንዘብና ብድር በጠረጴዛው ይመዘግባሉ፤ አባላት ቀሪ ሒሳባቸውን፣ የሒሳብ መግለጫቸውንና የብድር ሁኔታቸውን ያያሉ።',
    },
  ],
};

export const WELCOME_COPY: Record<WelcomeLang, WelcomeCopy> = { en, am };

export function isWelcomeLang(value: unknown): value is WelcomeLang {
  return value === 'en' || value === 'am';
}
