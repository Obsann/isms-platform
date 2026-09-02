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
  heroVisual: WelcomeHeroVisualCopy;
  servicesHeading: string;
  servicesIntro: string;
  services: WelcomeCardCopy[];
  gettingStartedHeading: string;
  steps: WelcomeStepCopy[];
}

export const WELCOME_COPY: WelcomeCopy = {
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
