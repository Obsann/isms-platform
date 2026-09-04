'use client';

import { useEffect } from 'react';
import './google-translate.css';

declare global {
  interface Window {
    google?: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
          },
          elementId: string,
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
    __ismsGtPatched?: boolean;
    __ismsGtInited?: boolean;
  }
}

const ELEMENT_SCRIPT_ID = 'isms-gt-element-js';
const HOST_ID = 'google_translate_element';

function patchGoogleTranslateDom(): void {
  if (typeof window === 'undefined') return;
  if (window.__ismsGtPatched) return;
  if (typeof Node !== 'function' || !Node.prototype) return;

  window.__ismsGtPatched = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (this: Node, child: Node) {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child);
  } as typeof Node.prototype.removeChild;

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (this: Node, newNode: Node, refNode: Node | null) {
    if (refNode && refNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, refNode);
  } as typeof Node.prototype.insertBefore;
}

function initTranslateElement(): void {
  if (window.__ismsGtInited) return;

  const host = document.getElementById(HOST_ID);
  if (!host) return;
  if (host.querySelector('.goog-te-gadget')) {
    window.__ismsGtInited = true;
    return;
  }
  if (!window.google?.translate?.TranslateElement) return;

  window.__ismsGtInited = true;
  new window.google.translate.TranslateElement(
    {
      pageLanguage: 'en',
      includedLanguages: 'en,am,om',
      autoDisplay: false,
    },
    HOST_ID,
  );
}

function loadTranslateElement(): void {
  if (document.getElementById(ELEMENT_SCRIPT_ID)) return;
  if (document.querySelector('script[src*="translate.google.com/translate_a/element.js"]')) {
    initTranslateElement();
    return;
  }

  const script = document.createElement('script');
  script.id = ELEMENT_SCRIPT_ID;
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  document.body.appendChild(script);
}

export default function GoogleTranslate() {
  useEffect(() => {
    patchGoogleTranslateDom();
    window.googleTranslateElementInit = initTranslateElement;
    loadTranslateElement();
  }, []);

  return null;
}
