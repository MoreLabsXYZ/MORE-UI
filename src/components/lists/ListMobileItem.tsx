import { Box, Divider, Skeleton, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { IsolatedEnabledBadge } from 'src/components/isolationMode/IsolatedBadge';
import { useAssetCaps } from 'src/hooks/useAssetCaps';
import { ExtendedMarket } from 'src/store/protocolDataSlice';

import { Link, ROUTES } from '../primitives/Link';
import { TokenIcon } from '../primitives/TokenIcon';

interface ListMobileItemProps {
  warningComponent?: ReactNode;
  children: ReactNode;
  symbol?: string;
  iconSymbol?: string;
  name?: string;
  underlyingAsset?: string;
  loading?: boolean;
  currentMarket?: ExtendedMarket;
  showSupplyCapTooltips?: boolean;
  showBorrowCapTooltips?: boolean;
  showDebtCeilingTooltips?: boolean;
  isIsolated: boolean;
}

export const ListMobileItem = ({
  children,
  warningComponent,
  symbol,
  iconSymbol,
  name,
  underlyingAsset,
  loading,
  currentMarket,
  showSupplyCapTooltips = false,
  showBorrowCapTooltips = false,
  showDebtCeilingTooltips = false,
  isIsolated,
}: ListMobileItemProps) => {
  const { supplyCap, borrowCap, debtCeiling } = useAssetCaps();
  return (
    <Box>
      <Divider />
      <Box sx={{ px: 4, pt: 4, pb: 6 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          {loading ? (
            <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ ml: 2 }}>
                <Skeleton width={100} height={24} />
              </Box>
            </Box>
          ) : (
            symbol &&
            underlyingAsset &&
            name &&
            currentMarket &&
            iconSymbol && (
              <Link
                href={ROUTES.reserveOverview(underlyingAsset, currentMarket)}
                sx={{ display: 'inline-flex', alignItems: 'center' }}
              >
                <TokenIcon symbol={iconSymbol} sx={{ fontSize: '40px' }} />
                <Box sx={{ ml: 2 }}>
                  <Typography variant="h4">{name}</Typography>
                  <Box display="flex" alignItems="center">
                    <Typography variant="subheader2" color="text.muted">
                      {symbol}
                    </Typography>
                    {isIsolated && (
                      <span style={{ marginLeft: '8px' }}>
                        <IsolatedEnabledBadge />
                      </span>
                    )}
                  </Box>
                </Box>
                {showSupplyCapTooltips && supplyCap.displayMaxedTooltip({ supplyCap })}
                {showBorrowCapTooltips && borrowCap.displayMaxedTooltip({ borrowCap })}
                {showDebtCeilingTooltips && debtCeiling.displayMaxedTooltip({ debtCeiling })}
              </Link>
            )
          )}
          {warningComponent}
        </Box>
        {children}
      </Box>
    </Box>
  );
};
