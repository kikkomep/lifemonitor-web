import { NgcCookieConsentConfig } from 'ngx-cookieconsent';

export const cookieConfig: NgcCookieConsentConfig = {
  cookie: {
    domain: 'lifemonitor.eu',
  },
  position: 'bottom',
  theme: 'edgeless',
  palette: {
    popup: {
      background: '#094b4b',
      text: '#ffffff',
      link: '#ffffff',
    },
    button: {
      background: '#f9b233',
      text: '#000000',
      border: 'transparent',
    },
  },
  type: 'info',
  content: {
    message:
      'We use cookies to optimise our website and our service, in accordance with our privacy policy.',
    dismiss: 'Got it!',
    deny: 'Refuse cookies',
    link: 'Learn more',
    href: 'https://www.crs4.it/privacy-policy/',
    policy: 'Cookie Policy',

    privacyPolicyLink: 'Privacy Policy',
    privacyPolicyHref: 'https://www.crs4.it/privacy-policy/',

    tosLink: 'Terms of Service',
    tosHref: 'https://www.crs4.it/privacy-policy/',
  },

  onInitialise: (status: any) => {
    // console.debug('onInitialise', status);
  },
};
