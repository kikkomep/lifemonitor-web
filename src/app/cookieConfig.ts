/*
Copyright (c) 2020-2024 CRS4

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

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
    href: 'https://lifemonitor.eu/legal/privacy-policy.pdf',
    policy: 'Cookie Policy',

    privacyPolicyLink: 'Privacy Policy',
    privacyPolicyHref: 'https://lifemonitor.eu/legal/privacy-policy.pdf',

    tosLink: 'Terms of Service',
    tosHref: 'https://lifemonitor.eu/legal/terms-and-conditions.pdf',
  },

  onInitialise: (status: any) => {
    // console.debug('onInitialise', status);
  },
};
