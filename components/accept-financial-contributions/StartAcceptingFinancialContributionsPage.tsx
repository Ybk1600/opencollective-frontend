import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { confettiFireworks } from '../../lib/confettis';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { Account, Collective, Host } from '../../lib/graphql/types/v2/graphql';
import { getCountryDisplayName, isoCountryList } from '../../lib/i18n/countries';

import ApplyToHostModal from '../ApplyToHostModal';
import HowToUseOpenCollective from '../fiscal-hosting/HowCanAFiscalHostHelpSection';
import { Box, Flex, Grid } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import Loading from '../Loading';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledCollectiveCard from '../StyledCollectiveCard';
import StyledFilters from '../StyledFilters';
import StyledHr from '../StyledHr';
import StyledSelect from '../StyledSelect';
import { H1, P, Span } from '../Text';

export type StartAcceptingFinancialContributionsPageProps = {
  collective: Collective;
  onChange: (field: string, value: unknown) => void;
};

const HostCardContainer = styled(Grid).attrs({
  justifyItems: 'center',
  gridGap: '30px',
  gridTemplateColumns: ['repeat(auto-fill, minmax(250px, 1fr))'],
  gridAutoRows: ['1fr'],
})`
  & > * {
    padding: 0;
  }
`;

const RoundOr = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f6ff;
  color: #1869f5;
  text-transform: uppercase;
  font-family: 'Inter';
  font-style: normal;
  font-weight: 700;
  font-size: 20px;
  line-height: 18px;
  margin: 20px 0;
`;

const Illustration = styled.img`
  width: 160px;
  height: 160px;
  object-fit: cover;
`;

const ApplyButton = styled(StyledButton)`
  visibility: hidden;
`;

const StyledCollectiveCardWrapper = styled(StyledCollectiveCard)`
  &:hover ${ApplyButton} {
    visibility: visible;
  }

  &:hover {
    border-color: #1869f5;
  }
`;

const CommunityTypes = ['Open Source', 'Mutual Aid', 'Climate', 'BLM', 'Indigenous', 'Education', 'Festival'];

function ApplyToHostCard(props: {
  host: Pick<Host, 'slug' | 'totalHostedCollectives' | 'description' | 'currency' | 'hostFeePercent'>;
  collective: Pick<Account, 'slug'>;
  onHostApplyClick: (host: Partial<Host>) => void;
}) {
  const [showApplyToHostModal, setShowApplyToHostModal] = React.useState(false);
  const router = useRouter();

  return (
    <React.Fragment>
      {/* @ts-ignore StyledCollectiveCard is not typed */}
      <StyledCollectiveCardWrapper
        /* @ts-ignore StyledCollectiveCard is not typed */
        collective={props.host}
        minWidth={250}
        position="relative"
        width="100%"
        paddingBottom="20px !important"
        childrenContainerProps={{ height: '100%', flexGrow: 1, justifyContent: 'flex-start' }}
        bodyProps={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <Box flexGrow={1}>
          <Box mx={3}>
            <P>
              <FormattedMessage
                defaultMessage="{ hostedCollectives, plural, one {<b>#</b> Collective} other {<b>#</b> Collectives} } hosted"
                values={{
                  hostedCollectives: props.host.totalHostedCollectives,
                  b: chunks => <strong>{chunks}</strong>,
                }}
              />
            </P>
            <P mt={2}>
              <FormattedMessage
                defaultMessage="<b>{ currencyCode  }</b> Currency"
                values={{
                  currencyCode: props.host.currency.toUpperCase(),
                  b: chunks => <strong>{chunks}</strong>,
                }}
              />
            </P>
            {props.host.hostFeePercent !== null && (
              <P mt={2}>
                <FormattedMessage
                  defaultMessage="<b>{ hostFeePercent }%</b> Host fee"
                  values={{
                    hostFeePercent: props.host.hostFeePercent,
                    b: chunks => <strong>{chunks}</strong>,
                  }}
                />
              </P>
            )}
          </Box>
          {props.host.description !== null && props.host.description.length !== 0 && (
            <React.Fragment>
              <Flex mx={3} pt={3} alignItems="center">
                <Span
                  color="black.700"
                  fontSize="12px"
                  lineHeight="16px"
                  textTransform="uppercase"
                  fontWeight="500"
                  letterSpacing="0.06em"
                >
                  <FormattedMessage id="OurPurpose" defaultMessage="Our purpose" />
                </Span>
                <StyledHr borderColor="black.300" flex="1 1" ml={2} />
              </Flex>
              <P mx={3} mt={1} fontSize="12px" lineHeight="18px" color="black.800">
                {props.host.description}
              </P>
            </React.Fragment>
          )}
        </Box>
        <Box mx={3} mt={3}>
          <ApplyButton
            onClick={() => {
              props.onHostApplyClick(props.host);
              setShowApplyToHostModal(true);
            }}
            buttonStyle="primary"
            width="100%"
          >
            <FormattedMessage id="Apply" defaultMessage="Apply" />
          </ApplyButton>
        </Box>
      </StyledCollectiveCardWrapper>
      {showApplyToHostModal && (
        <ApplyToHostModal
          hostSlug={props.host.slug}
          collective={props.collective}
          onClose={() => setShowApplyToHostModal(false)}
          onSuccess={() => {
            return router
              .push(`${props.collective.slug}/accept-financial-contributions/host/success`)
              .then(() => window.scrollTo(0, 0))
              .then(() => {
                confettiFireworks(5000, { zIndex: 3000 });
              });
          }}
        />
      )}
    </React.Fragment>
  );
}

function IndependentCollectiveCard(props: { collective: Collective }) {
  const router = useRouter();
  return (
    <StyledCard width="800px" padding="32px 24px">
      <Flex>
        <Box>
          <Illustration
            alt="A place to grow and thrive illustration"
            src="/static/images/fiscal-hosting/what-is-a-fiscalhost-illustration.png"
          />
        </Box>
        <Flex
          pl="20px"
          fontWeight={400}
          fontSize="15px"
          lineHeight="22px"
          flexDirection="column"
          justifyContent="center"
        >
          <P fontSize="20px" mb={3} lineHeight="28px" fontWeight="700" color="black.800">
            <FormattedMessage defaultMessage="I want to be an Independent Collective" />
          </P>
          <FormattedMessage
            defaultMessage="You will need your own bank account, you will have to be your own legal entity and take care of accounting, invoices, taxes, admins, payments and liability. <link>Read more</link>"
            values={{
              link: getI18nLink({
                as: Link,
                openInNewTab: true,
                href: 'https://docs.opencollective.com/help/independent-collectives',
              }),
            }}
          />
        </Flex>
      </Flex>
      <StyledButton
        onClick={() => router.push(`/${props.collective.slug}/accept-financial-contributions/ourselves`)}
        mt={3}
        buttonStyle="primary"
        width="100%"
      >
        <FormattedMessage id="acceptContributions.picker.ourselves" defaultMessage="Independent Collective" />
      </StyledButton>
    </StyledCard>
  );
}

const FindAFiscalHostQuery = gql`
  query FindAFiscalHostQuery($tags: [String], $limit: Int, $country: [CountryISO]) {
    hosts(tag: $tags, limit: $limit, tagSearchOperator: OR, country: $country) {
      totalCount
      nodes {
        id
        legacyId
        createdAt
        settings
        type
        name
        slug
        description
        longDescription
        currency
        totalHostedCollectives
        hostFeePercent
        isTrustedHost
        location {
          id
          country
        }
        tags
      }
    }
  }
`;

function FeaturedFiscalHostResults({
  hosts,
  collective,
  onHostApplyClick,
}: {
  hosts: Pick<Host, 'slug' | 'totalHostedCollectives' | 'description' | 'currency' | 'hostFeePercent'>[];
  collective: Pick<Account, 'slug'>;
  onHostApplyClick: (host: Partial<Host>) => void;
}) {
  return (
    <StyledCard padding={4} bg="#F1F6FF" borderRadius="24px" borderStyle="none">
      <Flex>
        <P fontSize="24px" lineHeight="32px" fontWeight="700" color="black.900">
          <FormattedMessage defaultMessage="Recommended Hosts" />
        </P>
        <P ml={1} fontSize="14px" lineHeight="32px" fontWeight="400" color="black.900">
          <FormattedMessage
            defaultMessage="{ hostCount, plural, one {# host} other {# hosts} } found"
            values={{
              hostCount: hosts.length,
            }}
          />
        </P>
      </Flex>
      <P fontSize="14px" lineHeight="24px" fontWeight="700" color="black.700" opacity={0.5}>
        <FormattedMessage defaultMessage="Our most trusted hosts" />
      </P>
      <HostCardContainer mt={3}>
        {hosts.map(host => {
          return (
            <ApplyToHostCard key={host.slug} host={host} collective={collective} onHostApplyClick={onHostApplyClick} />
          );
        })}
      </HostCardContainer>
    </StyledCard>
  );
}

function OtherFiscalHostResults({
  hosts,
  collective,
  onHostApplyClick,
}: {
  hosts: Pick<Host, 'slug' | 'totalHostedCollectives' | 'description' | 'currency' | 'hostFeePercent'>[];
  collective: Pick<Account, 'slug'>;
  onHostApplyClick: (host: Partial<Host>) => void;
}) {
  return (
    <Box>
      <Flex>
        <P fontSize="24px" lineHeight="32px" fontWeight="700" color="black.900">
          <FormattedMessage defaultMessage="Other Hosts" />
        </P>
        <P ml={1} fontSize="14px" lineHeight="32px" fontWeight="400" color="black.900">
          <FormattedMessage
            defaultMessage="{ hostCount, plural, one {# host} other {# hosts} } found"
            values={{
              hostCount: hosts.length,
            }}
          />
        </P>
      </Flex>
      <HostCardContainer mt={3}>
        {hosts.map(host => {
          return (
            <ApplyToHostCard key={host.slug} host={host} collective={collective} onHostApplyClick={onHostApplyClick} />
          );
        })}
      </HostCardContainer>
    </Box>
  );
}

function FindAHostSearch(props: {
  selectedCommunityType: string[];
  selectedCountry: string;
  collective: Account;
  onHostApplyClick: (host: Partial<Host>) => void;
}) {
  const { data, loading } = useQuery<{
    hosts: { nodes: Pick<Host, 'slug' | 'currency' | 'totalHostedCollectives' | 'hostFeePercent' | 'isTrustedHost'>[] };
  }>(FindAFiscalHostQuery, {
    variables: {
      tags: props.selectedCommunityType.length !== 0 ? props.selectedCommunityType : undefined,
      country: props.selectedCountry !== 'ALL' ? [props.selectedCountry] : null,
      limit: 50,
    },
    context: API_V2_CONTEXT,
  });

  if (loading) {
    return (
      <Box mt={2}>
        <P fontSize="24px" lineHeight="32px" fontWeight="700" color="black.900">
          <FormattedMessage defaultMessage="Finding the right host for you..." />
        </P>
        <Loading />
      </Box>
    );
  }

  const hosts = data?.hosts?.nodes || [];
  if (hosts.length === 0) {
    return <div>Empty state</div>;
  }

  const featuredHosts = hosts.filter(host => host.isTrustedHost);
  const otherHosts = hosts.filter(host => !host.isTrustedHost);

  return (
    <React.Fragment>
      {featuredHosts.length !== 0 && (
        <Box mb={3}>
          <FeaturedFiscalHostResults
            collective={props.collective}
            hosts={featuredHosts}
            onHostApplyClick={props.onHostApplyClick}
          />
        </Box>
      )}
      {otherHosts.length !== 0 && (
        <Box padding={4}>
          <OtherFiscalHostResults
            collective={props.collective}
            hosts={otherHosts}
            onHostApplyClick={props.onHostApplyClick}
          />
        </Box>
      )}
    </React.Fragment>
  );
}

const I18nMessages = defineMessages({
  ALL_COUNTRIES: {
    defaultMessage: 'All countries',
  },
});

export default function StartAcceptingFinancialContributionsPage(props: StartAcceptingFinancialContributionsPageProps) {
  const intl = useIntl();
  const allCountriesSelectOption = { value: 'ALL', label: intl.formatMessage(I18nMessages.ALL_COUNTRIES) };
  const [selectedCommunityType, setSelectedCommunityType] = React.useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = React.useState(allCountriesSelectOption);
  const [searchingForFiscalHost, setSearchingForFiscalHost] = React.useState(false);
  const router = useRouter();
  const independentCollectiveOption = router.query.independentCollectiveOption === 'true';

  const countrySelectOptions = React.useMemo(() => {
    const countryList = isoCountryList
      .map(countryCode => ({
        value: countryCode,
        label: getCountryDisplayName(intl, countryCode),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return [allCountriesSelectOption, ...countryList];
  }, [intl]);

  return (
    <Flex my={5} alignItems="center" flexDirection="column">
      <Illustration
        alt="A place to grow and thrive illustration"
        src="/static/images/fiscal-hosting/what-is-a-fiscalhost-illustration.png"
      />
      <Box mt={4} mb={4}>
        <H1
          fontSize={['20px', '32px']}
          lineHeight={['24px', '40px']}
          fontWeight="700"
          color="black.900"
          textAlign="center"
        >
          <FormattedMessage id="contributions.startAccepting" defaultMessage="Start accepting contributions" />
        </H1>
        <P mt={3} fontSize="16px" lineHeight="24px" fontWeight="500" color="black.700" textAlign="center">
          <FormattedMessage defaultMessage="Choose who will hold the money on your behalf" />
        </P>
      </Box>
      <StyledCard width="800px" padding="32px 24px">
        <P mb={1} fontSize="16px" lineHeight="24px" fontWeight="700" color="black.800">
          <FormattedMessage defaultMessage="What type of community are you?" />
        </P>
        <StyledFilters
          multiSelect
          filters={CommunityTypes}
          onChange={setSelectedCommunityType}
          selected={selectedCommunityType}
        />

        <P mt={4} fontSize="16px" lineHeight="24px" fontWeight="700" color="black.800">
          <FormattedMessage defaultMessage="Where would your collective be most active?" />
        </P>
        <StyledSelect
          value={selectedCountry}
          inputId="country-input"
          options={countrySelectOptions}
          onChange={setSelectedCountry}
        />
        <P color="black.600" fontWeight="400" fontSize="11px" lineHeight="16px">
          <FormattedMessage defaultMessage="If multiple areas, please select most prominent of them all." />
        </P>

        {!searchingForFiscalHost && (
          <React.Fragment>
            <StyledHr borderTopColor="black.200" mt={4} />

            <P mt={4} fontSize="20px" lineHeight="28px" fontWeight="700" color="black.800">
              <FormattedMessage defaultMessage="Continue with a Fiscal Host" />
            </P>
            <Flex mt={3}>
              <Box>
                <Illustration
                  alt="A place to grow and thrive illustration"
                  src="/static/images/watering-plants-bird-illustration.png"
                />
              </Box>
              <Flex
                pl="20px"
                fontWeight={400}
                fontSize="15px"
                lineHeight="22px"
                flexDirection="column"
                justifyContent="center"
              >
                <FormattedMessage
                  defaultMessage="A fiscal host allows you to start accepting contributions without the need to set up a legal entity and bank account for your project. The host will hold funds on your behalf, and will take care of accounting, invoices, taxes, admin, payments, and liability. You can use their NGO Status to raise runds. <link>Read more</link>"
                  values={{
                    link: getI18nLink({
                      as: Link,
                      openInNewTab: true,
                      href: 'https://opencollective.com/fiscal-hosting',
                    }),
                  }}
                />
              </Flex>
            </Flex>
            <StyledButton onClick={() => setSearchingForFiscalHost(true)} mt={3} buttonStyle="primary" width="100%">
              <FormattedMessage defaultMessage="Search for Fiscal Hosts" />
            </StyledButton>
          </React.Fragment>
        )}
      </StyledCard>
      {!searchingForFiscalHost && independentCollectiveOption && (
        <React.Fragment>
          <RoundOr>
            <FormattedMessage defaultMessage="Or" />
          </RoundOr>
          <IndependentCollectiveCard collective={props.collective} />
        </React.Fragment>
      )}

      {!searchingForFiscalHost && <HowToUseOpenCollective />}

      {searchingForFiscalHost && (
        <Box mt={3} width="1000px">
          <FindAHostSearch
            collective={props.collective}
            selectedCommunityType={selectedCommunityType}
            selectedCountry={selectedCountry.value}
            onHostApplyClick={host => {
              props.onChange('chosenHost', host);
            }}
          />
        </Box>
      )}
    </Flex>
  );
}
