import { ExclamationIcon } from '@heroicons/react/outline';
import { Box } from '@mui/material';
import { AssetCapData } from 'src/hooks/useAssetCaps';

import { Link } from '../primitives/Link';
import { TextWithTooltip, TextWithTooltipProps } from '../TextWithTooltip';

type DebtCeilingMaxedTooltipProps = TextWithTooltipProps & {
  debtCeiling: AssetCapData;
};

export const DebtCeilingMaxedTooltip = ({ debtCeiling, ...rest }: DebtCeilingMaxedTooltipProps) => {
  if (!debtCeiling || !debtCeiling.isMaxed) return null;

  return (
    <Box sx={{ ml: 2 }}>
      <TextWithTooltip {...rest} icon={<ExclamationIcon />} iconColor="error.main" iconSize={18}>
        <>
          {
            ' Protocol debt ceiling is at 100% for this asset. Futher borrowing against this asset is unavailable.'
          }
          <Link
            href="https://docs.more.markets/faq/more-markets-features#how-does-isolation-mode-affect-my-borrowing-power"
            underline="always"
          >
            Learn more
          </Link>
        </>
      </TextWithTooltip>
    </Box>
  );
};
