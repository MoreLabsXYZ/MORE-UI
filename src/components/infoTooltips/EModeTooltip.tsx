import { FormattedNumber } from '../primitives/FormattedNumber';
import { Link } from '../primitives/Link';
import { TextWithTooltip, TextWithTooltipProps } from '../TextWithTooltip';

export const EModeTooltip = ({
  eModeLtv,
  ...rest
}: TextWithTooltipProps & { eModeLtv: number }) => {
  return (
    <TextWithTooltip {...rest}>
      <>
        {'E-Mode increases your LTV for a selected category of assets up to '}
        <FormattedNumber
          value={Number(eModeLtv) / 10000}
          percent
          variant="secondary12"
          color="text.secondary"
        />
        .{' '}
        <Link
          href="https://docs.more.markets/faq/more-markets-features#high-efficiency-mode-e-mode"
          sx={{ textDecoration: 'underline' }}
          variant="caption"
          color="text.secondary"
        >
          Learn more
        </Link>
      </>
    </TextWithTooltip>
  );
};
