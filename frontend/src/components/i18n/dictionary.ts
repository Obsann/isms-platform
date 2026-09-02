export type AppLang = 'en' | 'am';

export const LANG_STORAGE_KEY = 'isms-lang';
export const LEGACY_LANG_STORAGE_KEY = 'isms-welcome-lang';

export const LANGUAGES = [
  { code: 'en' as const, short: 'EN', label: 'English' },
  { code: 'am' as const, short: 'አም', label: 'አማርኛ' },
];

export function isAppLang(value: unknown): value is AppLang {
  return value === 'en' || value === 'am';
}

type LeafDict = { [key: string]: string | LeafDict };

const en: LeafDict = {
  skipToContent: 'Skip to content',
  languageLabel: 'Change language',
  themeToDark: 'Switch to dark mode',
  themeToLight: 'Switch to light mode',
  brandTagline: 'Savings & Credit',

  nav: {
    dashboard: 'Dashboard',
    tellerDesk: 'Teller Desk',
    members: 'Members',
    loans: 'Loans & Credit',
    profile: 'Profile',
    settings: 'Settings',
    overview: 'Overview',
    tenants: 'Tenants',
    balance: 'Balance',
    statement: 'Statement',
    mobileMoney: 'Mobile money',
    memberLoans: 'Loans',
    tellerOps: 'Teller operations',
    account: 'Account',
    platform: 'Platform',
    main: 'Main',
    myAccount: 'My account',
  },

  portal: {
    teller: 'Teller',
    superAdmin: 'Super Admin',
    tenantAdmin: 'Tenant Admin',
    member: 'Member',
  },

  role: {
    'super-admin': 'Super Admin',
    'tenant-admin': 'Tenant Admin',
    teller: 'Teller',
    'loan-officer': 'Loan Officer',
    member: 'Member',
  },

  shell: {
    closeMenu: 'Close menu',
    openMenu: 'Open menu',
    search: 'Search',
    notifications: 'Notifications',
    notificationsUnread: 'Notifications, {count} unread',
    markAllRead: 'Mark all read',
    allCaughtUp: 'You’re all caught up',
    alertsHint: 'New alerts will show up here.',
    help: 'Help',
    accountMenu: 'Account menu',
    viewProfile: 'View Profile',
    settings: 'Settings',
    signOut: 'Sign Out',
  },

  login: {
    back: 'Back to home',
    subtitle: 'Sign in to your portal',
    tenantCode: 'Tenant code',
    tenantHelper:
      'SACCO code (tenant-a or tenant-b after seed). Super Admin uses “{code}”.',
    email: 'Email',
    password: 'Password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    failed: 'Could not sign in. Check your details and try again.',
  },

  footer: {
    tagline: 'One ledger-backed system for SACCO savings, shares, and loans.',
    quickLinks: 'Quick Links',
    services: 'Services',
    signIn: 'Sign in',
    dashboard: 'Dashboard',
    members: 'Members',
    tenants: 'Tenants',
    profile: 'Profile',
    settings: 'Settings',
    savings: 'Savings accounts',
    shares: 'Share capital',
    loans: 'Loans & credit',
    webPortal: 'Web portal · Tenant-scoped',
    facebook: 'ISMS on Facebook',
    instagram: 'ISMS on Instagram',
    telegram: 'ISMS on Telegram',
  },

  settings: {
    eyebrowAccount: 'Account Settings',
    eyebrowPlatform: 'Platform Settings',
    title: 'System Settings',
    subtitle: 'Manage your personal preferences, notifications, and application settings.',
    appearance: 'Appearance',
    appearanceDesc: 'Customize how the platform looks',
    darkMode: 'Dark Mode',
    darkModeDesc: 'Switch between light and dark themes',
    regional: 'Regional & Language',
    regionalDesc: 'Timezone and display language for this session.',
    language: 'Language',
    languageHint:
      'Use the language menu at the top of the page to switch English, Amharic, or Afaan Oromo.',
    timezone: 'Timezone',
    notifications: 'Notifications',
    notificationsDesc: 'Choose how you want to be alerted',
    emailAlerts: 'Email Alerts',
    emailAlertsDesc: 'Receive critical system alerts via email',
    smsAlerts: 'SMS Notifications',
    smsAlertsDesc: 'Get text messages for important events',
    monthlyReports: 'Monthly Reports',
    monthlyReportsDesc: 'Receive automated monthly portfolio summaries',
    security: 'Security & Audit',
    securityDesc: 'View your active session and role context',
    sessionDetails: 'Active Session Details',
    userId: 'User ID',
    role: 'Role',
    tenantScope: 'Tenant Scope',
    platformGlobal: 'Platform (Global)',
    reloadNote: 'Some settings may require a page reload to take full effect.',
    applied: 'Local preferences applied',
    saving: 'Saving...',
    save: 'Save Preferences',
  },

  profile: {
    eyebrowAccount: 'Account',
    eyebrowPlatform: 'Platform Account',
    title: 'My Profile',
    subtitle: 'View your account information and manage security settings.',
    platformBadge: 'Platform-Level Account · Operates outside per-tenant RLS scoping',
    loading: 'Loading profile…',
    loadError: 'Could not load profile. Please sign in again.',
    staffEyebrow: 'Staff Account',
    staffTitle: '{portal} Profile',
    staffSubtitle: 'Signed-in identity, role, and tenant. Members of another SACCO are not visible in this session.',
  },

  dash: {
    tellerEyebrow: 'Core Operations',
    tellerStation: 'Station #{id}',
    tellerTitle: 'Teller Dashboard',
    tellerIntro: 'Welcome back{name}. Manage counter operations and member servicing.',
    superEyebrow: 'Platform Overview',
    superTitle: 'Super Admin Dashboard',
    superIntro: 'Global platform statistics and tenant management overview.',
    tenantEyebrow: 'Tenant Admin',
    tenantTitle: 'Executive Dashboard',
    tenantIntroNamed: 'Welcome back, {name} — live figures from the ledger.',
    tenantIntro: 'Welcome back — live figures from the ledger.',
    memberEyebrow: 'My account',
    memberTitle: 'Member dashboard',
    memberDesc:
      'Live balances and loan counts, plus Chapa wallet deposits that credit savings only after verify.',
    memberAccounts: 'My accounts',
    memberBalanceTitle: 'Balance',
    memberBalanceDesc: 'Live savings and share balances from the ledger. These figures are not mocked.',
    memberStatementTitle: 'Statement',
    memberStatementDesc: 'Request a date-range statement. Rows come from ledger postings, not a mock list.',
    memberLoansTitle: 'Loan status',
    memberLoansDesc:
      'Applications and disbursements from the loans service. Amounts are full figures, not estimates.',
    memberChannels: 'Channels',
    memberMomoTitle: 'Pay with Chapa',
    memberMomoDesc:
      'Open Chapa checkout to deposit into your savings. Use sandbox phone 0900123456 (OTP 12345).',
    tenantsEyebrow: 'Platform Admin',
    tenantsTitle: 'SACCO Tenant Registry',
    tenantsDesc: 'Provision and manage tenant instances across the ISMS platform.',
  },
};

const am: LeafDict = {
  skipToContent: 'ወደ ዋናው ክፍል ዝለል',
  languageLabel: 'ቋንቋ ይቀይሩ',
  themeToDark: 'ወደ ጨለማ ገጽታ ይቀይሩ',
  themeToLight: 'ወደ ብርሃን ገጽታ ይቀይሩ',
  brandTagline: 'ቁጠባ እና ብድር',

  nav: {
    dashboard: 'ዳሽቦርድ',
    tellerDesk: 'የገንዘብ ተቀባይ ጠረጴዛ',
    members: 'አባላት',
    loans: 'ብድርና ክሬዲት',
    profile: 'መገለጫ',
    settings: 'ቅንብሮች',
    overview: 'አጠቃላይ እይታ',
    tenants: 'ድርጅቶች',
    balance: 'ቀሪ ሒሳብ',
    statement: 'የሒሳብ መግለጫ',
    mobileMoney: 'የሞባይል ገንዘብ',
    memberLoans: 'ብድር',
    tellerOps: 'የገንዘብ ተቀባይ ሥራዎች',
    account: 'መለያ',
    platform: 'መድረክ',
    main: 'ዋና',
    myAccount: 'የእኔ መለያ',
  },

  portal: {
    teller: 'ገንዘብ ተቀባይ',
    superAdmin: 'ሱፐር አድሚን',
    tenantAdmin: 'የድርጅት አድሚን',
    member: 'አባል',
  },

  role: {
    'super-admin': 'ሱፐር አድሚን',
    'tenant-admin': 'የድርጅት አድሚን',
    teller: 'ገንዘብ ተቀባይ',
    'loan-officer': 'የብድር ባለሙያ',
    member: 'አባል',
  },

  shell: {
    closeMenu: 'ምናሌን ዝጋ',
    openMenu: 'ምናሌን ክፈት',
    search: 'ፈልግ',
    notifications: 'ማሳወቂያዎች',
    notificationsUnread: 'ማሳወቂያዎች፣ {count} ያልተነበቡ',
    markAllRead: 'ሁሉንም እንደተነበበ ምልክት አድርግ',
    allCaughtUp: 'አዲስ ማሳወቂያ የለም',
    alertsHint: 'አዲስ ማሳወቂያዎች እዚህ ይታያሉ።',
    help: 'እገዛ',
    accountMenu: 'የመለያ ምናሌ',
    viewProfile: 'መገለጫ ይመልከቱ',
    settings: 'ቅንብሮች',
    signOut: 'ውጣ',
  },

  login: {
    back: 'ወደ መነሻ ተመለስ',
    subtitle: 'ወደ መድረክዎ ይግቡ',
    tenantCode: 'የድርጅት ኮድ',
    tenantHelper: 'የSACCO ኮድ (ከseed በኋላ tenant-a ወይም tenant-b)። ሱፐር አድሚን “{code}” ይጠቀማል።',
    email: 'ኢሜይል',
    password: 'የይለፍ ቃል',
    showPassword: 'የይለፍ ቃል አሳይ',
    hidePassword: 'የይለፍ ቃል ደብቅ',
    signIn: 'ይግቡ',
    signingIn: 'በመግባት ላይ…',
    failed: 'መግባት አልተቻለም። ዝርዝሮችዎን ይመልከቱና እንደገና ይሞክሩ።',
  },

  footer: {
    tagline: 'ለSACCO ቁጠባ፣ አክሲዮንና ብድር በአንድ የሒሳብ መዝገብ የተደገፈ ሥርዓት።',
    quickLinks: 'ፈጣን አገናኞች',
    services: 'አገልግሎቶች',
    signIn: 'ይግቡ',
    dashboard: 'ዳሽቦርድ',
    members: 'አባላት',
    tenants: 'ድርጅቶች',
    profile: 'መገለጫ',
    settings: 'ቅንብሮች',
    savings: 'የቁጠባ ሒሳቦች',
    shares: 'የአክሲዮን ካፒታል',
    loans: 'ብድርና ክሬዲት',
    webPortal: 'የኢንተርኔት መድረክ · በድርጅት የተከፋፈለ',
    facebook: 'ISMS በፌስቡክ',
    instagram: 'ISMS በኢንስታግራም',
    telegram: 'ISMS በቴሌግራም',
  },

  settings: {
    eyebrowAccount: 'የመለያ ቅንብሮች',
    eyebrowPlatform: 'የመድረክ ቅንብሮች',
    title: 'የሥርዓት ቅንብሮች',
    subtitle: 'የግል ምርጫዎችዎን፣ ማሳወቂያዎችንና የመተግበሪያ ቅንብሮችን ያስተዳድሩ።',
    appearance: 'ገጽታ',
    appearanceDesc: 'መድረኩ እንዴት እንደሚታይ ያብጁ',
    darkMode: 'ጨለማ ገጽታ',
    darkModeDesc: 'በብርሃንና ጨለማ ገጽታ መካከል ይቀይሩ',
    regional: 'ክልል እና ቋንቋ',
    regionalDesc: 'የቋንቋና የሰዓት ሰቅ ምርጫዎችዎን ያዘጋጁ',
    language: 'ቋንቋ',
    languageHint:
      'Use the language menu at the top of the page to switch English, Amharic, or Afaan Oromo.',
    timezone: 'የሰዓት ሰቅ',
    notifications: 'ማሳወቂያዎች',
    notificationsDesc: 'እንዴት እንደሚያሳውቁ ይምረጡ',
    emailAlerts: 'የኢሜይል ማሳወቂያዎች',
    emailAlertsDesc: 'ወሳኝ የሥርዓት ማሳወቂያዎችን በኢሜይል ይቀበሉ',
    smsAlerts: 'የSMS ማሳወቂያዎች',
    smsAlertsDesc: 'ለአስፈላጊ ክስተቶች የጽሑፍ መልእክት ይቀበሉ',
    monthlyReports: 'ወርሃዊ ሪፖርቶች',
    monthlyReportsDesc: 'በራስ-ሰር የሚዘጋጅ ወርሃዊ የፖርትፎሊዮ ማጠቃለያ ይቀበሉ',
    security: 'ደህንነት እና ኦዲት',
    securityDesc: 'ንቁ ክፍለ-ጊዜዎንና የሥራ ድርሻዎን ይመልከቱ',
    sessionDetails: 'የንቁ ክፍለ-ጊዜ ዝርዝር',
    userId: 'የተጠቃሚ መለያ',
    role: 'ሥራ ድርሻ',
    tenantScope: 'የድርጅት ወሰን',
    platformGlobal: 'መድረክ (አጠቃላይ)',
    reloadNote: 'አንዳንድ ቅንብሮች ሙሉ ለመሥራት ገጹን እንደገና መጫን ሊጠይቁ ይችላሉ።',
    applied: 'የአካባቢ ምርጫዎች ተተግብረዋል',
    saving: 'በማስቀመጥ ላይ...',
    save: 'ምርጫዎችን አስቀምጥ',
  },

  profile: {
    eyebrowAccount: 'መለያ',
    eyebrowPlatform: 'የመድረክ መለያ',
    title: 'የእኔ መገለጫ',
    subtitle: 'የመለያ መረጃዎን ይመልከቱ እና የደህንነት ቅንብሮችን ያስተዳድሩ።',
    platformBadge: 'የመድረክ-ደረጃ መለያ · ከየድርጅቱ RLS ወሰን ውጪ ይሠራል',
    loading: 'መገለጫ በመጫን ላይ…',
    loadError: 'መገለጫን መጫን አልተቻለም። እባክዎ እንደገና ይግቡ።',
    staffEyebrow: 'የሠራተኛ መለያ',
    staffTitle: 'የ{portal} መገለጫ',
    staffSubtitle: 'የገቡበት ማንነት፣ ሥራ ድርሻና ድርጅት። የሌላ SACCO አባላት በዚህ ክፍለ-ጊዜ አይታዩም።',
  },

  dash: {
    tellerEyebrow: 'ዋና ሥራዎች',
    tellerStation: 'ጣቢያ #{id}',
    tellerTitle: 'የገንዘብ ተቀባይ ዳሽቦርድ',
    tellerIntro: 'እንኳን ደህና መጡ{name}። የጠረጴዛ ሥራዎችንና የአባል አገልግሎትን ያስተዳድሩ።',
    superEyebrow: 'የመድረክ አጠቃላይ እይታ',
    superTitle: 'የሱፐር አድሚን ዳሽቦርድ',
    superIntro: 'ዓለም አቀፍ የመድረክ ስታቲስቲክስና የድርጅት አስተዳደር አጠቃላይ እይታ።',
    tenantEyebrow: 'የድርጅት አድሚን',
    tenantTitle: 'የአስተዳደር ዳሽቦርድ',
    tenantIntroNamed: 'እንኳን ደህና መጡ፣ {name} — ከሒሳብ መዝገቡ የቀጥታ ቁጥሮች።',
    tenantIntro: 'እንኳን ደህና መጡ — ከሒሳብ መዝገቡ የቀጥታ ቁጥሮች።',
    memberEyebrow: 'የእኔ መለያ',
    memberTitle: 'የአባል ዳሽቦርድ',
    memberDesc: 'የቀጥታ ቀሪ ሒሳብና የብድር ብዛት፣ እንዲሁም ከማረጋገጫ በኋላ ብቻ ወደ ቁጠባ የሚገባ የChapa ተቀማጭ።',
    memberAccounts: 'የእኔ ሒሳቦች',
    memberBalanceTitle: 'ቀሪ ሒሳብ',
    memberBalanceDesc: 'ከሒሳብ መዝገቡ የቀጥታ ቁጠባና አክሲዮን ቀሪ ሒሳቦች። እነዚህ ቁጥሮች አልተመሰሉም።',
    memberStatementTitle: 'የሒሳብ መግለጫ',
    memberStatementDesc: 'በቀን ክልል የሒሳብ መግለጫ ይጠይቁ። ረድፎች ከመዝገብ ምዝገባዎች ናቸው፤ የተመሰለ ዝርዝር አይደሉም።',
    memberLoansTitle: 'የብድር ሁኔታ',
    memberLoansDesc: 'ከብድር አገልግሎቱ ማመልከቻዎችና ክፍያዎች። መጠኖቹ ሙሉ ቁጥሮች ናቸው፤ ግምት አይደሉም።',
    memberChannels: 'ቻናሎች',
    memberMomoTitle: 'በChapa ይክፈሉ',
    memberMomoDesc: 'ወደ ቁጠባ ለማስገባት የChapa ክፍያ ገጽ ይከፈታል። የሙከራ ስልክ 0900123456 (OTP 12345)።',
    tenantsEyebrow: 'የመድረክ አድሚን',
    tenantsTitle: 'የSACCO ድርጅት መዝገብ',
    tenantsDesc: 'በISMS መድረክ ላይ የድርጅት ምሳሌዎችን ያዘጋጁ እና ያስተዳድሩ።',
  },
};

export const DICTIONARIES: Record<AppLang, LeafDict> = { en, am };

export function lookupDict(dict: unknown, key: string): string | undefined {
  const parts = key.split('.');
  let cur: unknown = dict;
  for (const part of parts) {
    if (cur && typeof cur === 'object' && part in (cur as object)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof cur === 'string' ? cur : undefined;
}
