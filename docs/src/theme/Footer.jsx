import React from 'react';
import Footer from '@theme-original/Footer';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useColorMode} from '@docusaurus/theme-common';
import {MendableFloatingButton} from '@mendable/search';

export default function FooterWrapper(props) {
  const {
    siteConfig: {customFields, darkModeConfig},
  } = useDocusaurusContext();

  return (
    <>
      <MendableFloatingButton
        style={{
          darkMode: false,
          accentColor: '#3577E5',
        }}
        icon={
          <img
            src="/img/logo-symbol-white.svg"
            style={{
              stroke: '#fff !important',
              width: '40px',
              height: '40px',
            }}
            alt="Recoil Logo"
          />
        }
        floatingButtonStyle={{
          color: '#ffffff',
          backgroundColor: '#3577E5',
        }}
        dialogCustomStyle={{
          dialogTopMargin: '48px',
        }}
        anon_key={customFields.mendableAnonKey}
        dismissPopupAfter={5}
        dialogPlaceholder='How do I install Recoil?'
        welcomeMessage='Welcome! How can I help?'
      />
    </>
  );
}
