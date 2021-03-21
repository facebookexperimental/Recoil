import React from 'react';
import Layout from '@theme/Layout';

function Resources() {
  return (
    <Layout title="External Resources">
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2 markdown">
            <h1 className="margin-bottom--sm">External Resources</h1>
            <h2>Learn Recoil</h2>
            <p>
              <a
                href="https://twitter.com/jacques_codes"
                target="_blank"
                rel="noopener noreferrer">
                Jacques Blom
              </a>{' '}
              has created a free Recoil video course, which takes you from setup
              to advanced usage. In the course you'll how to take full advantage
              of Recoil's powerful APIs.
            </p>
            <p>
              Learn how to do data fetching with Suspense, how to use Recoil to
              solve common React performance bottlenecks, and much more.
            </p>
            <a
              className="button button--outline button--secondary button--lg"
              href="https://learnrecoil.com/?utm_source=docs&utm_medium=organic&utm_campaign=na"
              target="_blank"
              rel="noopener noreferrer">
              Watch the course
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Resources;
