import React from 'react';
import Layout from '@theme/Layout';
import Translate from '@docusaurus/Translate';

function Resources() {
  return (
    <Layout title="External Resources">
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2 markdown">
            <h1 className="margin-bottom--sm">
              <Translate id="resourcePage.head.title">
                External Tutorials
              </Translate>
            </h1>

            <h2>
              <Translate id="resourcePage.sideguide.title">SideGuide Interactive Tutorial</Translate>
            </h2>
            <p>
              <a
                href="https://www.sideguide.dev/"
                target="_blank">
                SideGuide
              </a>{' '}
              <Translate id="resourcePage.sideguide.tutorial">
                has created an interactive tutorial for learning the basics with Recoil.
                Learn about creating your app and using atoms and selectors with
                live editable code samples.
              </Translate>
            </p>
            <a
              className="button button--outline button--secondary button--lg"
              href="https://app.sideguide.dev/recoil/tutorial/"
              target="_blank">
              <Translate id="resourcePage.sideguide.link">
                Interactive Tutorial
              </Translate>
            </a>

            <h2>
              <Translate id="resourcePage.learn.title">Learn Recoil Video Course</Translate>
            </h2>
            <p>
              <a
                href="https://twitter.com/jacques_codes"
                target="_blank"
                rel="noopener noreferrer">
                Jacques Blom
              </a>{' '}
              <Translate id="resourcePage.learn.course">
                has created a free Recoil video course, which takes you from
                setup to advanced usage. In the course you'll how to take full
                advantage of Recoil's powerful APIs.
              </Translate>
            </p>
            <p>
              <Translate id="resourcePage.learn.more">
                Learn how to do data fetching with Suspense, how to use Recoil
                to solve common React performance bottlenecks, and much more.
              </Translate>
            </p>
            <a
              className="button button--outline button--secondary button--lg"
              href="https://learnrecoil.com/?utm_source=docs&utm_medium=organic&utm_campaign=na"
              target="_blank"
              rel="noopener noreferrer">
              <Translate id="resourcePage.learn.watch">
                Watch the course
              </Translate>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Resources;
