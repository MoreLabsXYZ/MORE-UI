import { AlertColor, Typography } from '@mui/material';

import { Link } from '../../primitives/Link';
import { Warning } from '../../primitives/Warning';

interface IsolationModeWarningProps {
  asset?: string;
  severity?: AlertColor;
}

export const IsolationModeWarning = ({ asset, severity }: IsolationModeWarningProps) => {
  return (
    <Warning severity={severity || 'info'} sx={{ mb: 3 }}>
      <Typography variant="subheader1" mb={0.5}>
        You are entering Isolation mode
      </Typography>
      <Typography>
        In Isolation mode, you cannot supply other assets as collateral. A global debt ceiling
        limits the borrowing power of the isolated asset. To exit isolation mode disable{' '}
        {asset ? asset : ''} as collateral before borrowing another asset. Read more in our{' '}
        <Link href="https://docs.more.markets/faq/more-markets-features#isolation-mode">FAQ</Link>
      </Typography>
    </Warning>
  );
};
