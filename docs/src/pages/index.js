/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React from 'react';
import classnames from 'classnames';
import Layout from '@theme/Layout';
import useThemeContext from '@theme/hooks/useThemeContext';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Translate from '@docusaurus/Translate';
import styles from './styles.module.css';

import WordMarkImaage from '../../static/img/wordmark.svg';

const features = [
  {
    title: (
      <Translate id="homePage.minimal.title">Minimal and Reactish</Translate>
    ),
    imageUrl: 'img/icons/icon-reactish.svg',
    imageUrlDark: 'img/icons/icon-reactish--dark.svg',
    imageAlt: 'React logo.',
    description: (
      <Translate id="homePage.minimal.text">
        Recoil works and thinks like React. Add some to your app and get fast
        and flexible shared state.
      </Translate>
    ),
  },
  {
    title: <Translate id="homePage.flow.title">Data-Flow Graph</Translate>,
    imageUrl: 'img/icons/icon-functional.svg',
    imageUrlDark: 'img/icons/icon-functional--dark.svg',
    imageAlt: 'F at x, representing functional programming.',
    description: (
      <Translate id="homePage.flow.text">
        Derived data and asynchronous queries are tamed with pure functions and
        efficient subscriptions.
      </Translate>
    ),
  },
  {
    title: (
      <Translate id="homePage.cross.title">Cross-App Observation</Translate>
    ),
    imageUrl: 'img/icons/icon-observation.svg',
    imageUrlDark: 'img/icons/icon-observation--dark.svg',
    imageAlt:
      'Connected dots, representing observation of values from various points in an application.',
    description: (
      <Translate id="homePage.cross.text">
        Implement persistence, routing, time-travel debugging, or undo by
        observing all state changes across your app, without impairing
        code-splitting.
      </Translate>
    ),
  },
];

function Feature({
  feature: {imageUrl, imageUrlDark, imageAlt, title, description},
}) {
  const {isDarkTheme} = useThemeContext();
  const resolvedImgUrl = useBaseUrl(isDarkTheme ? imageUrlDark : imageUrl);
  return (
    <div className={classnames('col col--4', styles.feature)}>
      {resolvedImgUrl && (
        <div>
          <img
            className={styles.featureImage}
            src={resolvedImgUrl}
            alt={imageAlt}
          />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const {siteConfig = {}} = context;
  return (
    <Layout description="A state management library for React.">
      <header className={classnames('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">
            <WordMarkImaage width="200" />
            <div className={styles.hiddenText} aria-hidden="true">
              Recoil
            </div>
          </h1>
          <p className="hero__subtitle">
            <Translate id="homePage.head.tagline">
              {siteConfig.tagline}
            </Translate>
          </p>
          <div className={styles.buttons}>
            <Link
              className={classnames(
                'hero__button button button--outline button--secondary button--lg',
                styles.getStarted,
              )}
              to={useBaseUrl('docs/introduction/getting-started')}>
              <Translate id="homePage.head.start">Get Started</Translate>
            </Link>
          </div>
        </div>
      </header>
      <main>
        {features && features.length && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map((feature) => (
                  <Feature key={feature.imageUrl} feature={feature} />
                ))}
              </div>
            </div>
          </section>
        )}
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              <div className="container">
                <div className="row" style={{justifyContent: 'center'}}>
                  <iframe
                    width="560"
                    height="315"
                    src="https://www.youtube-nocookie.com/embed/_ISAA_Jt9kI"
                    frameBorder="0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />{' '}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

export default Home;
