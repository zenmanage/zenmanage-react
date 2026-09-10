import { FlagsProvider, useFlag } from '@zenmanage/react';

function SimpleFlagsPanel(): JSX.Element {
  const { value: newNavEnabled, isLoading } = useFlag('new-navigation', false);

  if (isLoading) {
    return <p>Loading flags...</p>;
  }

  return <p>{newNavEnabled ? 'New navigation enabled' : 'Using classic navigation'}</p>;
}

export function SimpleFlagsExample(): JSX.Element {
  return (
    <FlagsProvider environmentToken={process.env.ZENMANAGE_ENVIRONMENT_TOKEN || 'cli_placeholder'}>
      <SimpleFlagsPanel />
    </FlagsProvider>
  );
}
