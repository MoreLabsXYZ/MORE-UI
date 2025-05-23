import { InterestRate } from '@aave/contract-helpers';
import { valueToBigNumber } from '@aave/math-utils';
import { ArrowDownIcon } from '@heroicons/react/outline';
import { Box, Stack, SvgIcon, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import { useRef, useState } from 'react';
import { PriceImpactTooltip } from 'src/components/infoTooltips/PriceImpactTooltip';
import { FormattedNumber } from 'src/components/primitives/FormattedNumber';
import { TokenIcon } from 'src/components/primitives/TokenIcon';
import {
  ComputedReserveData,
  ExtendedFormattedUser,
  useAppDataContext,
} from 'src/hooks/app-data-provider/useAppDataProvider';
import {
  maxInputAmountWithSlippage,
  minimumReceivedAfterSlippage,
  SwapVariant,
} from 'src/hooks/paraswap/common';
import { useCollateralRepaySwap } from 'src/hooks/paraswap/useCollateralRepaySwap';
import { useModalContext } from 'src/hooks/useModal';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { ListSlippageButton } from 'src/modules/dashboard/lists/SlippageList';
import { calculateHFAfterRepay } from 'src/utils/hfUtils';

import { Asset, AssetInput } from '../AssetInput';
import { ModalWrapperProps } from '../FlowCommons/ModalWrapper';
import { TxSuccessView } from '../FlowCommons/Success';
import {
  DetailsHFLine,
  DetailsNumberLineWithSub,
  TxModalDetails,
} from '../FlowCommons/TxModalDetails';
import { ErrorType, useFlashloan, zeroLTVBlockingWithdraw } from '../utils';
import { ParaswapErrorDisplay } from '../Warnings/ParaswapErrorDisplay';
import { CollateralRepayActions } from './CollateralRepayActions';

export function CollateralRepayModalContent({
  poolReserve,
  symbol,
  debtType,
  userReserve,
  isWrongNetwork,
  user,
}: ModalWrapperProps & { debtType: InterestRate; user: ExtendedFormattedUser }) {
  const { reserves, userReserves } = useAppDataContext();
  const { gasLimit, txError, mainTxState } = useModalContext();
  const { currentChainId, currentNetworkConfig } = useProtocolDataContext();
  const { currentAccount } = useWeb3Context();

  // List of tokens eligble to repay with, ordered by USD value
  const repayTokens = user.userReservesData
    .filter(
      (userReserve) =>
        userReserve.underlyingBalance !== '0' &&
        userReserve.underlyingAsset !== poolReserve.underlyingAsset &&
        userReserve.reserve.symbol !== 'stETH'
    )
    .map((userReserve) => ({
      address: userReserve.underlyingAsset,
      balance: userReserve.underlyingBalance,
      balanceUSD: userReserve.underlyingBalanceUSD,
      symbol: userReserve.reserve.symbol,
      iconSymbol: userReserve.reserve.iconSymbol,
      decimals: userReserve.reserve.decimals,
    }))
    .sort((a, b) => Number(b.balanceUSD) - Number(a.balanceUSD));
  const [tokenToRepayWith, setTokenToRepayWith] = useState<Asset>(repayTokens[0]);
  const tokenToRepayWithBalance = tokenToRepayWith.balance || '0';

  const [swapVariant, setSwapVariant] = useState<SwapVariant>('exactOut');
  const [amount, setAmount] = useState('');
  const [maxSlippage, setMaxSlippage] = useState('0.5');

  const amountRef = useRef<string>('');

  const collateralReserveData = reserves.find(
    (reserve) => reserve.underlyingAsset === tokenToRepayWith.address
  ) as ComputedReserveData;

  const debt =
    debtType === InterestRate.Stable
      ? userReserve?.stableBorrows || '0'
      : userReserve?.variableBorrows || '0';

  let safeAmountToRepayAll = valueToBigNumber(debt);
  // Add in the approximate interest accrued over the next 30 minutes
  safeAmountToRepayAll = safeAmountToRepayAll.plus(
    safeAmountToRepayAll.multipliedBy(poolReserve.variableBorrowAPY).dividedBy(360 * 24 * 2)
  );

  const isMaxSelected = amount === '-1';
  const repayAmount = isMaxSelected ? safeAmountToRepayAll.toString() : amount;
  const repayAmountUsdValue = valueToBigNumber(repayAmount)
    .multipliedBy(poolReserve.priceInUSD)
    .toString();

  // The slippage is factored into the collateral amount because when we swap for 'exactOut', positive slippage is applied on the collateral amount.
  const collateralAmountRequiredToCoverDebt = safeAmountToRepayAll
    .multipliedBy(poolReserve.priceInUSD)
    .multipliedBy(100 + Number(maxSlippage))
    .dividedBy(100)
    .dividedBy(collateralReserveData.priceInUSD);

  const swapIn = { ...collateralReserveData, amount: tokenToRepayWithBalance };
  const swapOut = { ...poolReserve, amount: amountRef.current };
  if (swapVariant === 'exactIn') {
    swapIn.amount = tokenToRepayWithBalance;
    swapOut.amount = '0';
  }

  const repayAllDebt =
    isMaxSelected &&
    valueToBigNumber(tokenToRepayWithBalance).gte(collateralAmountRequiredToCoverDebt);

  const {
    inputAmountUSD,
    inputAmount,
    outputAmount,
    outputAmountUSD,
    loading: routeLoading,
    error,
    buildTxFn,
  } = useCollateralRepaySwap({
    chainId: currentNetworkConfig.underlyingChainId || currentChainId,
    userAddress: currentAccount,
    swapVariant: swapVariant,
    swapIn,
    swapOut,
    max: repayAllDebt,
    skip: mainTxState.loading || false,
    maxSlippage: Number(maxSlippage),
  });

  const loadingSkeleton = routeLoading && inputAmountUSD === '0';

  const handleRepayAmountChange = (value: string) => {
    const maxSelected = value === '-1';

    if (
      maxSelected &&
      valueToBigNumber(tokenToRepayWithBalance).lt(collateralAmountRequiredToCoverDebt)
    ) {
      // The selected collateral amount is not enough to pay the full debt. We'll try to do a swap using the exact amount of collateral.
      // The amount won't be known until we fetch the swap data, so we'll clear it out. Once the swap data is fetched, we'll set the amount.
      amountRef.current = '';
      setAmount('');
      setSwapVariant('exactIn');
    } else {
      amountRef.current = maxSelected ? safeAmountToRepayAll.toString(10) : value;
      setAmount(value);
      setSwapVariant('exactOut');
    }
  };

  // for v3 we need hf after withdraw collateral, because when removing collateral to repay
  // debt, hf could go under 1 then it would fail. If that is the case then we need
  // to use flashloan path
  const repayWithUserReserve = userReserves.find(
    (userReserve) => userReserve.underlyingAsset === tokenToRepayWith.address
  );
  const { hfAfterSwap, hfEffectOfFromAmount } = calculateHFAfterRepay({
    amountToReceiveAfterSwap: outputAmount,
    amountToSwap: inputAmount,
    fromAssetData: collateralReserveData,
    user,
    toAssetData: poolReserve,
    repayWithUserReserve,
    debt,
  });

  // If the selected collateral asset is frozen, a flashloan must be used. When a flashloan isn't used,
  // the remaining amount after the swap is deposited into the pool, which will fail for frozen assets.
  const shouldUseFlashloan =
    useFlashloan(user.healthFactor, hfEffectOfFromAmount.toString()) ||
    collateralReserveData?.isFrozen;

  // we need to get the min as minimumReceived can be greater than debt as we are swapping
  // a safe amount to repay all. When this happens amountAfterRepay would be < 0 and
  // this would show as certain amount left to repay when we are actually repaying all debt
  const amountAfterRepay = valueToBigNumber(debt).minus(BigNumber.min(outputAmount, debt));
  const displayAmountAfterRepayInUsd = amountAfterRepay.multipliedBy(poolReserve.priceInUSD);
  const collateralAmountAfterRepay = tokenToRepayWithBalance
    ? valueToBigNumber(tokenToRepayWithBalance).minus(inputAmount)
    : valueToBigNumber('0');
  const collateralAmountAfterRepayUSD = collateralAmountAfterRepay.multipliedBy(
    collateralReserveData.priceInUSD
  );

  const exactOutputAmount = swapVariant === 'exactIn' ? outputAmount : repayAmount;
  const exactOutputUsd = swapVariant === 'exactIn' ? outputAmountUSD : repayAmountUsdValue;

  const assetsBlockingWithdraw: string[] = zeroLTVBlockingWithdraw(user);

  let blockingError: ErrorType | undefined = undefined;

  if (
    assetsBlockingWithdraw.length > 0 &&
    !assetsBlockingWithdraw.includes(tokenToRepayWith.symbol)
  ) {
    blockingError = ErrorType.ZERO_LTV_WITHDRAW_BLOCKED;
  } else if (valueToBigNumber(tokenToRepayWithBalance).lt(inputAmount)) {
    blockingError = ErrorType.NOT_ENOUGH_COLLATERAL_TO_REPAY_WITH;
  } else if (shouldUseFlashloan && !collateralReserveData.flashLoanEnabled) {
    blockingError = ErrorType.FLASH_LOAN_NOT_AVAILABLE;
  }

  const BlockingError: React.FC = () => {
    switch (blockingError) {
      case ErrorType.NOT_ENOUGH_COLLATERAL_TO_REPAY_WITH:
        return 'Not enough collateral to repay this amount of debt with';
      case ErrorType.ZERO_LTV_WITHDRAW_BLOCKED:
        return (
          <>
            Assets with zero LTV ({assetsBlockingWithdraw}) must be withdrawn or disabled as
            collateral to perform this action
          </>
        );
      case ErrorType.FLASH_LOAN_NOT_AVAILABLE:
        return (
          <>
            Due to health factor impact, a flashloan is required to perform this transaction, but
            More Governance has disabled flashloan availability for this asset. Try lowering the
            amount or supplying additional collateral.
          </>
        );
      default:
        return null;
    }
  };

  const inputAmountWithSlippage = maxInputAmountWithSlippage(
    inputAmount,
    maxSlippage,
    tokenToRepayWith.decimals || 18
  );

  const outputAmountWithSlippage = minimumReceivedAfterSlippage(
    outputAmount,
    maxSlippage,
    poolReserve.decimals
  );

  if (mainTxState.success)
    return (
      <TxSuccessView
        action={'Repaid'}
        amount={swapVariant === 'exactOut' ? outputAmount : outputAmountWithSlippage}
        symbol={poolReserve.symbol}
      />
    );

  return (
    <>
      <AssetInput
        value={exactOutputAmount}
        onChange={handleRepayAmountChange}
        usdValue={exactOutputUsd}
        symbol={poolReserve.symbol}
        assets={[
          {
            address: poolReserve.underlyingAsset,
            symbol: poolReserve.symbol,
            iconSymbol: poolReserve.iconSymbol,
            balance: debt,
          },
        ]}
        isMaxSelected={isMaxSelected}
        maxValue={debt}
        inputTitle={'Expected amount to repay'}
        balanceText={'Borrow balance'}
      />
      <Box sx={{ padding: '18px', pt: '14px', display: 'flex', justifyContent: 'space-between' }}>
        <SvgIcon sx={{ fontSize: '18px !important' }}>
          <ArrowDownIcon />
        </SvgIcon>

        <PriceImpactTooltip
          loading={loadingSkeleton}
          outputAmountUSD={outputAmountUSD}
          inputAmountUSD={inputAmountUSD}
        />
      </Box>
      <AssetInput
        value={swapVariant === 'exactOut' ? inputAmount : tokenToRepayWithBalance}
        usdValue={inputAmountUSD}
        symbol={tokenToRepayWith.symbol}
        assets={repayTokens}
        onSelect={setTokenToRepayWith}
        onChange={handleRepayAmountChange}
        inputTitle={'Collateral to repay with'}
        balanceText={'Borrow balance'}
        maxValue={tokenToRepayWithBalance}
        loading={loadingSkeleton}
        disableInput
      />
      {error && !loadingSkeleton && (
        <Typography variant="helperText" color="error.main">
          {error}
        </Typography>
      )}
      {blockingError !== undefined && (
        <Typography variant="helperText" color="error.main">
          <BlockingError />
        </Typography>
      )}

      <TxModalDetails
        gasLimit={gasLimit}
        slippageSelector={
          <ListSlippageButton
            selectedSlippage={maxSlippage}
            setSlippage={setMaxSlippage}
            slippageTooltipHeader={
              <Stack direction="row" alignItems="center">
                {swapVariant === 'exactIn' ? (
                  <>
                    Minimum amount of debt to be repaid
                    <Stack alignItems="end">
                      <Stack direction="row">
                        <TokenIcon
                          symbol={poolReserve.iconSymbol}
                          sx={{ mr: 1, fontSize: '14px' }}
                        />
                        <FormattedNumber value={outputAmountWithSlippage} variant="secondary12" />
                      </Stack>
                    </Stack>
                  </>
                ) : (
                  <>
                    Maximum collateral amount to use
                    <Stack alignItems="end">
                      <Stack direction="row">
                        <TokenIcon
                          symbol={tokenToRepayWith.iconSymbol || ''}
                          sx={{ mr: 1, fontSize: '14px' }}
                        />
                        <FormattedNumber value={inputAmountWithSlippage} variant="secondary12" />
                      </Stack>
                    </Stack>
                  </>
                )}
              </Stack>
            }
          />
        }
      >
        <DetailsHFLine
          visibleHfChange={swapVariant === 'exactOut' ? !!amount : !!inputAmount}
          healthFactor={user?.healthFactor}
          futureHealthFactor={hfAfterSwap.toString(10)}
          loading={loadingSkeleton}
        />
        <DetailsNumberLineWithSub
          description={'Borrow balance after repay'}
          futureValue={amountAfterRepay.toString()}
          futureValueUSD={displayAmountAfterRepayInUsd.toString()}
          symbol={symbol}
          tokenIcon={poolReserve.iconSymbol}
          loading={loadingSkeleton}
          hideSymbolSuffix
        />
        <DetailsNumberLineWithSub
          description={'Collateral balance after repay'}
          futureValue={collateralAmountAfterRepay.toString()}
          futureValueUSD={collateralAmountAfterRepayUSD.toString()}
          symbol={tokenToRepayWith.symbol}
          tokenIcon={tokenToRepayWith.iconSymbol}
          loading={loadingSkeleton}
          hideSymbolSuffix
        />
      </TxModalDetails>

      {txError && <ParaswapErrorDisplay txError={txError} />}

      <CollateralRepayActions
        poolReserve={poolReserve}
        fromAssetData={collateralReserveData}
        repayAmount={swapVariant === 'exactIn' ? outputAmountWithSlippage : outputAmount}
        repayWithAmount={swapVariant === 'exactOut' ? inputAmountWithSlippage : inputAmount}
        repayAllDebt={repayAllDebt}
        useFlashLoan={shouldUseFlashloan}
        isWrongNetwork={isWrongNetwork}
        symbol={symbol}
        rateMode={debtType}
        blocked={blockingError !== undefined || error !== ''}
        loading={routeLoading}
        buildTxFn={buildTxFn}
      />
    </>
  );
}
