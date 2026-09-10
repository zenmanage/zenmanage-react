import { Context } from '@zenmanage/sdk';
import { FlagsProvider, useFlag } from '@zenmanage/react';

const userContext = Context.single('user', 'user-987');

function RolloutPanel(): JSX.Element {
  const { value } = useFlag('new-checkout-rollout', false);

  return value ? <p>User is in rollout bucket</p> : <p>User is in control bucket</p>;
}

export function PercentageRolloutsExample(): JSX.Element {
  return (
    <FlagsProvider
      environmentToken={process.env.ZENMANAGE_ENVIRONMENT_TOKEN || 'cli_placeholder'}
      context={userContext}
    >
      <RolloutPanel />
    </FlagsProvider>
  );
}
