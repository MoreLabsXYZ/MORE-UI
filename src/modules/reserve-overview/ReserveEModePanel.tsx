import { Box, SvgIcon, Typography } from '@mui/material';
import { LiquidationPenaltyTooltip } from 'src/components/infoTooltips/LiquidationPenaltyTooltip';
import { LiquidationThresholdTooltip } from 'src/components/infoTooltips/LiquidationThresholdTooltip';
import { MaxLTVTooltip } from 'src/components/infoTooltips/MaxLTVTooltip';
import { FormattedNumber } from 'src/components/primitives/FormattedNumber';
import { Link, ROUTES } from 'src/components/primitives/Link';
import { ReserveOverviewBox } from 'src/components/ReserveOverviewBox';
import { getEmodeMessage } from 'src/components/transactions/Emode/EmodeNaming';
import { ComputedReserveData } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useRootStore } from 'src/store/root';
import { GENERAL, RESERVE_DETAILS } from 'src/utils/mixPanelEvents';

import LightningBoltGradient from '/public/lightningBoltGradient.svg';

import { PanelRow, PanelTitle } from './ReservePanels';

type ReserverEModePanelProps = {
  reserve: ComputedReserveData;
};

export const ReserveEModePanel: React.FC<ReserverEModePanelProps> = ({ reserve }) => {
  const trackEvent = useRootStore((store) => store.trackEvent);

  return (
    <PanelRow>
      <PanelTitle>E-Mode info</PanelTitle>
      <Box sx={{ flexGrow: 1, minWidth: 0, maxWidth: '100%', width: '100%' }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
          <Typography variant="secondary14" color="text.secondary">
            E-Mode Category
          </Typography>
          <SvgIcon sx={{ fontSize: '14px', mr: 0.5, ml: 2 }}>
            <LightningBoltGradient />
          </SvgIcon>
          <Typography variant="subheader1">{getEmodeMessage(reserve.eModeLabel)}</Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            pt: '12px',
          }}
        >
          <ReserveOverviewBox title={<MaxLTVTooltip variant="description" text={'Max LTV'} />}>
            <FormattedNumber
              value={reserve.formattedEModeLtv}
              percent
              variant="secondary14"
              visibleDecimals={2}
            />
          </ReserveOverviewBox>
          <ReserveOverviewBox
            title={
              <LiquidationThresholdTooltip variant="description" text={'Liquidation threshold'} />
            }
          >
            <FormattedNumber
              value={reserve.formattedEModeLiquidationThreshold}
              percent
              variant="secondary14"
              visibleDecimals={2}
            />
          </ReserveOverviewBox>
          <ReserveOverviewBox
            title={<LiquidationPenaltyTooltip variant="description" text={'Liquidation penalty'} />}
          >
            <FormattedNumber
              value={reserve.formattedEModeLiquidationBonus}
              percent
              variant="secondary14"
              visibleDecimals={2}
            />
          </ReserveOverviewBox>
        </Box>
        <Typography variant="caption" color="text.secondary" paddingTop="24px">
          E-Mode increases your LTV for a selected category of assets, meaning that when E-mode is
          enabled, you will have higher borrowing power over assets of the same E-mode category
          which are defined by More Governance. You can enter E-Mode from your{' '}
          <Link
            href={ROUTES.dashboard}
            sx={{ textDecoration: 'underline' }}
            variant="caption"
            color="text.secondary"
            onClick={() => {
              trackEvent(RESERVE_DETAILS.GO_DASHBOARD_EMODE);
            }}
          >
            Dashboard
          </Link>
          . To learn more about E-Mode and applied restrictions in{' '}
          <Link
            href="https://docs.more.markets/faq/more-v3-features#high-efficiency-mode-e-mode"
            sx={{ textDecoration: 'underline' }}
            variant="caption"
            color="text.secondary"
            onClick={() => {
              trackEvent(GENERAL.EXTERNAL_LINK, { Link: 'E-mode FAQ' });
            }}
          >
            FAQ
          </Link>{' '}
          or{' '}
          <Link
            href="https://github.com/more-markets/more-v3-core/blob/master/techpaper/More_V3_Technical_Paper.pdf"
            sx={{ textDecoration: 'underline' }}
            variant="caption"
            color="text.secondary"
            onClick={() => {
              trackEvent(GENERAL.EXTERNAL_LINK, { Link: 'V3 Tech Paper' });
            }}
          >
            More V3 Technical Paper
          </Link>
          .
        </Typography>
      </Box>
    </PanelRow>
  );
};
