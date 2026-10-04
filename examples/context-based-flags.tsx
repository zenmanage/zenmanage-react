import { Attribute, Context } from '@zenmanage/sdk';
import { FlagsProvider, useFlag } from '@zenmanage/react';

const userContext = new Context('user', 'Jane Doe', 'user-123', [
  new Attribute('country', ['US']),
  new Attribute('plan', ['pro']),
]);

function ContextAwareFeature() {
  const { value: showAdvancedAnalytics } = useFlag('advanced-analytics', false);

  return showAdvancedAnalytics ? <p>Advanced analytics enabled</p> : <p>Standard analytics</p>;
}

export function ContextBasedFlagsExample() {
  return (
    <FlagsProvider
      environmentToken={process.env.ZENMANAGE_ENVIRONMENT_TOKEN || 'cli_placeholder'}
      context={userContext}
    >
      <ContextAwareFeature />
    </FlagsProvider>
  );
}
