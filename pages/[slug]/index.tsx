import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
// import { isUndefined, omitBy } from 'lodash';
// import { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { createGlobalStyle } from 'styled-components';

import { addApolloState, initClient } from '../../lib/apollo-client';
import { getCollectivePageMetadata } from '../../lib/collective.lib';
import { generateNotFoundError } from '../../lib/errors';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { addParentToURLIfMissing, getCollectivePageCanonicalURL } from '../../lib/url-helpers';

import CollectivePageContent from '../../components/collective-page';
import CollectiveNotificationBar from '../../components/collective-page/CollectiveNotificationBar';
import { collectivePageQuery } from '../../components/collective-page/graphql/queries';
import CollectiveThemeProvider from '../../components/CollectiveThemeProvider';
import Container from '../../components/Container';
import { MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD } from '../../components/contribute-cards/constants';
import ErrorPage from '../../components/ErrorPage';
import Loading from '../../components/Loading';
import Page from '../../components/Page';

import Custom404 from '../404';

/** A page rendered when collective is pledged and not active yet */
const PledgedCollectivePage = dynamic(
  () => import(/* webpackChunkName: 'PledgedCollectivePage' */ '../../components/PledgedCollectivePage'),
  { loading: Loading },
);

/** A page rendered when collective is incognito */
const IncognitoUserCollective = dynamic(
  () => import(/* webpackChunkName: 'IncognitoUserCollective' */ '../../components/IncognitoUserCollective'),
  { loading: Loading },
);

/** A page rendered when collective is guest */
const GuestUserProfile = dynamic(
  () => import(/* webpackChunkName: 'GuestUserProfile' */ '../../components/GuestUserProfile'),
  { loading: Loading },
);

// /** Load the onboarding modal dynamically since it's not used often */
// const OnboardingModal = dynamic(
//   () => import(/* webpackChunkName: 'OnboardingModal' */ '../../components/onboarding-modal/OnboardingModal'),
//   { loading: Loading },
// );

const GlobalStyles = createGlobalStyle`
  section {
    margin: 0;
  }
`;

// type CollectivePageQuery = {
//   slug: string;
//   status: string;
//   step: string;
//   mode: string;
//   action: string;
// };

export async function getStaticPaths() {
  return {
    paths: [{ params: { slug: 'opensource' } }, { params: { slug: 'opencollective' } }],
    fallback: 'blocking', // fallback: blocking is essentially like getServerSideProps. fallback: true
  };
}

export async function getStaticProps(context) {
  const client = initClient();
  const variables = {
    slug: context.params.slug,
    nbContributorsPerContributeCard: MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD,
  };
  const res = await client.query({
    query: collectivePageQuery,
    variables,
  });

  console.log({ res, variables });

  return addApolloState(client, {
    props: {},
    // revalidate: 1,
  });
}

// export const getServerSideProps: GetServerSideProps = async context => {
//   const { slug, status, step, mode, action } = context.query as CollectivePageQuery;
//   const client = initClient();

//   const { data, error } = await client.query({
//     query: collectivePageQuery,
//     variables: { slug: context.query.slug, nbContributorsPerContributeCard: MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD },
//     // fetchPolicy: 'network-only',
//   });

//   return {
//     props: omitBy(
//       {
//         status,
//         step,
//         mode,
//         skipDataFromTree: false,
//         action,
//         slug,
//         data,
//         error: error || null,
//       },
//       isUndefined,
//     ),
//   };
// };

const CollectivePage = props => {
  const { LoggedInUser } = useLoggedInUser();
  const router = useRouter();
  const { slug, status, step, mode, action } = router.query;
  const variables = { slug: router.query.slug, nbContributorsPerContributeCard: MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD };
  const { data, loading, error } = useQuery(collectivePageQuery, {
    variables,
    // Setting this value to true will make the component rerender when
    // the "networkStatus" changes, so we are able to know if it is fetching
    // more data
    notifyOnNetworkStatusChange: true,
  });

  const collective = data?.Collective;

  console.log({ data, loading, error, variables });
  //  const [showOnboardingModal, setShowOnboardingModal] = React.useState(false);

  //   React.useEffect(() => {
  //     if (LoggedInUser) {
  //       fetchData();
  //     }
  //   }, [LoggedInUser]);

  React.useEffect(() => {
    addParentToURLIfMissing(router, collective);
  }, [collective]);

  // if (!query.loading) {
  if (!data || data.error) {
    return <ErrorPage data={data} />;
  } else if (!data.Collective) {
    return <ErrorPage error={generateNotFoundError(router.query.slug)} log={false} />;
  } else if (data.Collective.isPledged && !data.Collective.isActive) {
    return <PledgedCollectivePage collective={data.Collective} />;
  } else if (data.Collective.isIncognito) {
    return <IncognitoUserCollective collective={data.Collective} />;
  } else if (data.Collective.isGuest) {
    return <GuestUserProfile account={data.Collective} />;
  }
  // }

  // Don't allow /collective/apply
  if (props.action === 'apply' && !collective?.isHost) {
    return <Custom404 />;
  }

  return (
    <Page
      collective={collective}
      canonicalURL={getCollectivePageCanonicalURL(collective)}
      {...getCollectivePageMetadata(collective)}
    >
      <GlobalStyles />
      {router.isFallback ? (
        <Container py={[5, 6]}>
          <Loading />
        </Container>
      ) : (
        <React.Fragment>
          <CollectiveNotificationBar
            collective={collective}
            host={collective.host}
            status={props.status}
            LoggedInUser={LoggedInUser}
            refetch={data.refetch}
          />
          <CollectiveThemeProvider collective={collective}>
            {({ onPrimaryColorChange }) => (
              <CollectivePageContent
                collective={collective}
                host={collective.host}
                coreContributors={collective.coreContributors}
                financialContributors={collective.financialContributors}
                tiers={collective.tiers}
                events={collective.events}
                projects={collective.projects}
                connectedCollectives={collective.connectedCollectives}
                transactions={collective.transactions}
                expenses={collective.expenses}
                stats={collective.stats}
                updates={collective.updates}
                conversations={collective.conversations}
                LoggedInUser={LoggedInUser}
                isAdmin={Boolean(LoggedInUser && LoggedInUser.isAdminOfCollective(collective))}
                isHostAdmin={Boolean(LoggedInUser && LoggedInUser.isHostAdmin(collective))}
                isRoot={Boolean(LoggedInUser && LoggedInUser.isRoot)}
                onPrimaryColorChange={onPrimaryColorChange}
                step={props.step}
                mode={props.mode}
                refetch={data.refetch}
              />
            )}
          </CollectiveThemeProvider>
          {/* {props.mode === 'onboarding' && LoggedInUser?.isAdminOfCollective(collective) && (
            <OnboardingModal
              showOnboardingModal={showOnboardingModal}
              setShowOnboardingModal={setShowOnboardingModal}
              step={props.step}
              mode={props.mode}
              collective={collective}
              LoggedInUser={LoggedInUser}
            />
          )} */}
        </React.Fragment>
      )}
    </Page>
  );
};

CollectivePage.propTypes = {
  slug: PropTypes.string.isRequired, // from getInitialProps
  /** A special status to show the notification bar (collective created, archived...etc) */
  status: PropTypes.oneOf(['collectiveCreated', 'collectiveArchived', 'fundCreated', 'projectCreated', 'eventCreated']),
  step: PropTypes.string,
  mode: PropTypes.string,
  action: PropTypes.string,
  LoggedInUser: PropTypes.object, // from withUser
  router: PropTypes.object,
  data: PropTypes.shape({
    loading: PropTypes.bool,
    error: PropTypes.any,
    account: PropTypes.object,
    Collective: PropTypes.shape({
      name: PropTypes.string,
      type: PropTypes.string.isRequired,
      description: PropTypes.string,
      twitterHandle: PropTypes.string,
      image: PropTypes.string,
      isApproved: PropTypes.bool,
      isArchived: PropTypes.bool,
      isHost: PropTypes.bool,
      isActive: PropTypes.bool,
      isPledged: PropTypes.bool,
      isIncognito: PropTypes.bool,
      isGuest: PropTypes.bool,
      parentCollective: PropTypes.shape({ slug: PropTypes.string, image: PropTypes.string }),
      host: PropTypes.object,
      stats: PropTypes.object,
      coreContributors: PropTypes.arrayOf(PropTypes.object),
      financialContributors: PropTypes.arrayOf(PropTypes.object),
      tiers: PropTypes.arrayOf(PropTypes.object),
      events: PropTypes.arrayOf(PropTypes.object),
      connectedCollectives: PropTypes.arrayOf(PropTypes.object),
      transactions: PropTypes.arrayOf(PropTypes.object),
      expenses: PropTypes.arrayOf(PropTypes.object),
      updates: PropTypes.arrayOf(PropTypes.object),
    }),
    refetch: PropTypes.func,
  }).isRequired, // from withData
};

export default CollectivePage;
