import { Trans } from '@lingui/react/macro';
import { GENERAL } from 'src/utils/mixPanelEvents';

import { Link } from '../primitives/Link';
import { TextWithTooltip, TextWithTooltipProps } from '../TextWithTooltip';

type FixedToolTipProps = TextWithTooltipProps;

export const FixedAPYTooltipText = (
  <Trans>
    Interest rate that is determined by More Governance. This rate may be changed over time
    depending on the need for the GHO supply to contract/expand.{' '}
    <Link
      href="https://docs.more.markets/concepts/how-gho-works/interest-rate-discount-model#interest-rate-model"
      underline="always"
    >
      <Trans>Learn more</Trans>
    </Link>
  </Trans>
);

export const FixedAPYTooltip = (props: FixedToolTipProps) => {
  return (
    <TextWithTooltip
      event={{
        eventName: GENERAL.TOOL_TIP,
        eventParams: { tooltip: 'GHO APY' },
      }}
      {...props}
    >
      {FixedAPYTooltipText}
    </TextWithTooltip>
  );
};
