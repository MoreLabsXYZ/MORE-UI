import { ExternalLinkIcon } from '@heroicons/react/solid';
import { Box, Button, Divider, SvgIcon } from '@mui/material';
import { getFrozenProposalLink } from 'src/components/infoTooltips/FrozenTooltip';
import { PausedTooltipText } from 'src/components/infoTooltips/PausedTooltip';
import { FormattedNumber } from 'src/components/primitives/FormattedNumber';
import { Link } from 'src/components/primitives/Link';
import { Warning } from 'src/components/primitives/Warning';
import { AMPLWarning } from 'src/components/Warnings/AMPLWarning';
import { BorrowDisabledWarning } from 'src/components/Warnings/BorrowDisabledWarning';
import {
  AssetsBeingOffboarded,
  OffboardingWarning,
} from 'src/components/Warnings/OffboardingWarning';
import { ComputedReserveData } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useAssetCaps } from 'src/hooks/useAssetCaps';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { BROKEN_ASSETS } from 'src/hooks/useReservesHistory';
import { useRootStore } from 'src/store/root';
import { GENERAL } from 'src/utils/mixPanelEvents';

import { BorrowInfo } from './BorrowInfo';
import { InterestRateModelGraphContainer } from './graphs/InterestRateModelGraphContainer';
import { ReserveEModePanel } from './ReserveEModePanel';
import { PanelItem, PanelRow, PanelTitle } from './ReservePanels';
import { SupplyInfo } from './SupplyInfo';

type ReserveConfigurationProps = {
  reserve: ComputedReserveData;
};

export const ReserveConfiguration: React.FC<ReserveConfigurationProps> = ({ reserve }) => {
  const { currentNetworkConfig, currentMarketData, currentMarket } = useProtocolDataContext();
  const reserveId =
    reserve.underlyingAsset + currentMarketData.addresses.LENDING_POOL_ADDRESS_PROVIDER;
  const renderCharts =
    !!currentNetworkConfig.ratesHistoryApiUrl &&
    !currentMarketData.disableCharts &&
    !BROKEN_ASSETS.includes(reserveId);
  const { supplyCap, borrowCap, debtCeiling } = useAssetCaps();
  const showSupplyCapStatus: boolean = reserve.supplyCap !== '0';
  const showBorrowCapStatus: boolean = reserve.borrowCap !== '0';
  const trackEvent = useRootStore((store) => store.trackEvent);

  const offboardingDiscussion = AssetsBeingOffboarded[currentMarket]?.[reserve.symbol];

  return (
    <>
      <Box>
        {reserve.isFrozen && !offboardingDiscussion ? (
          <Warning sx={{ mt: '16px', mb: '40px' }} severity="error">
            This asset is frozen due to an More community decision.{' '}
            <Link
              href={getFrozenProposalLink()}
              sx={{ textDecoration: 'underline' }}
            >
              More details
            </Link>
          </Warning>
        ) : offboardingDiscussion ? (
          <Warning sx={{ mt: '16px', mb: '40px' }} severity="error">
            <OffboardingWarning discussionLink={offboardingDiscussion} />
          </Warning>
        ) : (
          reserve.symbol == 'AMPL' && (
            <Warning sx={{ mt: '16px', mb: '40px' }} severity="warning">
              <AMPLWarning />
            </Warning>
          )
        )}

        {reserve.isPaused ? (
          reserve.symbol === 'MAI' ? (
            <Warning sx={{ mt: '16px', mb: '40px' }} severity="error">
              MAI has been paused due to a community decision.Supply, borrows and repays are
              impacted.{' '}
              <Link
                href={
                  'https://governance.more.markets/t/arfc-add-mai-to-arbitrum-more-market/12759/8'
                }
                sx={{ textDecoration: 'underline' }}
              >
                More details
              </Link>
            </Warning >
          ) : (
            <Warning sx={{ mt: '16px', mb: '40px' }} severity="error">
              <PausedTooltipText />
            </Warning>
          )
        ) : null}
      </Box >

      <PanelRow>
        <PanelTitle>Supply Info</PanelTitle>
        <SupplyInfo
          reserve={reserve}
          currentMarketData={currentMarketData}
          renderCharts={renderCharts}
          showSupplyCapStatus={showSupplyCapStatus}
          supplyCap={supplyCap}
          debtCeiling={debtCeiling}
        />
      </PanelRow>

      {
        (reserve.borrowingEnabled || Number(reserve.totalDebt) > 0) && (
          <>
            <Divider sx={{ my: { xs: 6, sm: 10 } }} />
            <PanelRow>
              <PanelTitle>Borrow info</PanelTitle>
              <Box sx={{ flexGrow: 1, minWidth: 0, maxWidth: '100%', width: '100%' }}>
                {!reserve.borrowingEnabled && (
                  <Warning sx={{ mb: '40px' }} severity="error">
                    <BorrowDisabledWarning />
                  </Warning>
                )}
                <BorrowInfo
                  reserve={reserve}
                  currentMarketData={currentMarketData}
                  currentNetworkConfig={currentNetworkConfig}
                  renderCharts={renderCharts}
                  showBorrowCapStatus={showBorrowCapStatus}
                  borrowCap={borrowCap}
                />
              </Box>
            </PanelRow>
          </>
        )
      }

      {
        reserve.eModeCategoryId !== 0 && (
          <>
            <Divider sx={{ my: { xs: 6, sm: 10 } }} />
            <ReserveEModePanel reserve={reserve} />
          </>
        )
      }

      {
        (reserve.borrowingEnabled || Number(reserve.totalDebt) > 0) && (
          <>
            <Divider sx={{ my: { xs: 6, sm: 10 } }} />

            <PanelRow>
              <PanelTitle>Interest rate model</PanelTitle>
              <Box sx={{ flexGrow: 1, minWidth: 0, maxWidth: '100%', width: '100%' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                  }}
                >
                  <PanelItem title={'Utilization Rate'} className="borderless">
                    <FormattedNumber
                      value={reserve.borrowUsageRatio}
                      percent
                      variant="main16"
                      compact
                    />
                  </PanelItem>
                  <Button
                    onClick={() => {
                      trackEvent(GENERAL.EXTERNAL_LINK, {
                        asset: reserve.underlyingAsset,
                        Link: 'Interest Rate Strategy',
                        assetName: reserve.name,
                      });
                    }}
                    href={currentNetworkConfig.explorerLinkBuilder({
                      address: reserve.interestRateStrategyAddress,
                    })}
                    endIcon={
                      <SvgIcon sx={{ width: 14, height: 14 }}>
                        <ExternalLinkIcon />
                      </SvgIcon>
                    }
                    component={Link}
                    size="small"
                    variant="outlined"
                    sx={{ verticalAlign: 'top' }}
                  >
                    Interest rate strategy
                  </Button>
                </Box>
                <InterestRateModelGraphContainer reserve={reserve} />
              </Box>
            </PanelRow>
          </>
        )
      }
    </>
  );
};
