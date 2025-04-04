import { Trans } from "@lingui/react/macro";

import { Link } from '../primitives/Link';
import { TextWithTooltip, TextWithTooltipProps } from '../TextWithTooltip';

interface ReserveFactorTooltipProps extends TextWithTooltipProps {
  collectorLink?: string;
}

export const ReserveFactorTooltip = ({ collectorLink, ...rest }: ReserveFactorTooltipProps) => {
  return (
    <TextWithTooltip {...rest}>
      <Trans>
        Reserve factor is a percentage of interest which goes to a{' '}
        {collectorLink ? (
          <Link href={collectorLink}>collector contract</Link>
        ) : (
          'collector contract'
        )}{' '}
        that is controlled by More governance to promote ecosystem growth.{' '}
      </Trans>
    </TextWithTooltip>
  );
};
