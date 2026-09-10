import { FlagsProvider, useFlag } from '@zenmanage/react';

function CachedFeature(): JSX.Element {
  const { value } = useFlag('cached-feature', false);
  return <p>{value ? 'Cached feature enabled' : 'Cached feature disabled'}</p>;
}

export function CachingExample(): JSX.Element {
  return (
    <FlagsProvider
      environmentToken={process.env.ZENMANAGE_ENVIRONMENT_TOKEN || 'cli_placeholder'}
      cacheTtl={300}
      enableUsageReporting={true}
    >
      <CachedFeature />
    </FlagsProvider>
  );
}
