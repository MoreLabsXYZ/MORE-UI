import { USD_DECIMALS, valueToBigNumber } from '@aave/math-utils';
import { ArrowRightIcon, XIcon } from '@heroicons/react/outline';
import {
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  SvgIcon,
  Typography,
} from '@mui/material';
// import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { FormattedNumber } from 'src/components/primitives/FormattedNumber';
import { TokenIcon } from 'src/components/primitives/TokenIcon';
import { UserAuthenticated } from 'src/components/UserAuthenticated';
import { useAppDataContext } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { BatchTransaction } from 'src/store/batchTransactionsSlice';
import { useRootStore } from 'src/store/root';

import { ModalEmpty } from './ModalEmpty';
import { ModalFooter } from './ModalFooter';

interface BatchTransactionsModalProps {
  open: boolean;
  setOpen: (value: boolean) => void;
}

export const BatchTransactionsModal = ({ open, setOpen }: BatchTransactionsModalProps) => {
  const router = useRouter();
  const [txCallResult, setTxCallResult] = useState<{ isError: boolean; message?: string } | null>(
    null
  );
  const [isBatchTransactionsLoading, setIsBatchTransactionsLoading] = useState<boolean>(false);
  const { currentNetworkConfig } = useProtocolDataContext();

  const {
    batchTransactionGroups,
    removeBatchItem,
    getBatchTx,
    getGasLimit,
    clearBatch,
    updateBatchItemStatus,
  } = useRootStore((state) => ({
    batchTransactionGroups: state.batchTransactionGroups,
    getBatchTx: state.getBatchTx,
    getGasLimit: state.getGasLimit,
    removeBatchItem: state.removeBatchItem,
    clearBatch: state.clearBatch,
    updateBatchItemStatus: state.updateBatchItemStatus,
  }));
  const { sendTx } = useWeb3Context();
  const { reserves, marketReferencePriceInUsd } = useAppDataContext();

  // Calculate USD values for each transaction
  const transactionsWithUsdValues = useMemo(() => {
    return batchTransactionGroups
      .map((group, index) => {
        return group
          .filter((transaction) =>
            ['supply', 'borrow', 'repay', 'withdraw'].includes(transaction.action)
          )
          .map((transaction) => {
            // Find the reserve that matches this transaction's asset
            const matchingReserve = reserves.find(
              (reserve) =>
                reserve.underlyingAsset.toLowerCase() === transaction.poolAddress.toLowerCase()
            );
            let amountUSD = '0';
            if (matchingReserve) {
              // Calculate USD value using the reserve's price data
              const amountInTokens = valueToBigNumber(transaction.amount);
              amountUSD = amountInTokens
                .multipliedBy(matchingReserve.formattedPriceInMarketReferenceCurrency)
                .multipliedBy(marketReferencePriceInUsd)
                .shiftedBy(-USD_DECIMALS)
                .toString();
            }

            return {
              ...transaction,
              amountUSD,
              groupIndex: index,
            };
          })
          .filter((transaction) => !transaction.isHidden);
      })
      .flat();
  }, [batchTransactionGroups, reserves, marketReferencePriceInUsd]);

  // Reset txCallResult when batchTransactionGroups evolves
  useEffect(() => {
    setTxCallResult(null);
  }, [batchTransactionGroups]);

  const handleClose = () => {
    if (txCallResult) {
      clearBatch();
    }
    setOpen(false);
  };

  const handleApproveOrDelegate = async (
    approval: BatchTransaction,
    groupIndex: number,
    approvalIndex: number
  ) => {
    console.log('Approving:', approval);
    updateBatchItemStatus(groupIndex, approvalIndex, 'pending');
    const approvalResult = await sendTx(approval.tx);
    console.log('Approval transaction result:', approvalResult);
    updateBatchItemStatus(groupIndex, approvalIndex, 'approved');
  };

  const handleExecuteBatch = async () => {
    if (txCallResult) {
      const explorerLink = currentNetworkConfig.explorerLinkBuilder({
        tx: txCallResult.message,
      });
      window.open(explorerLink, '_blank');
      return;
    }
    try {
      setIsBatchTransactionsLoading(true);
      console.log('batchTransactionGroups', batchTransactionGroups);
      if (batchTransactionGroups.length === 0) {
        throw new Error('No transactions in batch');
      }

      const batchTx = await getBatchTx();
      console.log('batchTx', batchTx);
      const response = await sendTx(batchTx);
      console.log('Batch transaction completed:', response);
      setTxCallResult({ isError: false, message: response });
      setTimeout(() => {
        clearBatch();
      }, 30000);
    } catch (error) {
      console.error('Error executing batch transactions:', error);
      setTxCallResult({ isError: true });
    } finally {
      setIsBatchTransactionsLoading(false);
    }
  };

  // Generate dynamic button text based on batch transactions
  const getButtonText = () => {
    if (txCallResult && !txCallResult.isError) return 'See transaction on Flowscan';

    if (batchTransactionGroups.length === 0) return 'Execute Batch';

    // const hasApprovals = getApprovals().length > 0;
    const actionTypes = new Set(batchTransactionGroups.flat().map((tx) => tx.action));

    const actionTexts = [];
    if (actionTypes.has('supply')) actionTexts.push('Supply');
    if (actionTypes.has('borrow')) actionTexts.push('Borrow');
    if (actionTypes.has('repay')) actionTexts.push('Repay');
    if (actionTypes.has('withdraw')) actionTexts.push('Withdraw');

    // Format with commas and "and" for the last item
    if (actionTexts.length === 1) {
      return actionTexts[0];
    } else if (actionTexts.length === 2) {
      return `${actionTexts[0]} and ${actionTexts[1]}`;
    } else {
      const lastItem = actionTexts.pop();
      return `${actionTexts.join(', ')} and ${lastItem}`;
    }
  };

  // Calculate total gas cost
  const totalGasCost = getGasLimit();
  const nativeTokenPriceInUSD = useMemo(
    () =>
      reserves.find(
        (reserve) => reserve.symbol.toLowerCase() === 'wflow' // TODO: make it dynamic to chain
      )?.priceInUSD,
    [reserves]
  );
  const totalGasCostUSD = Number(totalGasCost) * Number(nativeTokenPriceInUSD);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          paddingX: 3,
          paddingY: 2,
          width: { xs: '100%', sm: 400 },
          maxWidth: '100%',
          bgcolor: 'background.paper',
          overflow: 'auto',
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      ModalProps={{
        keepMounted: true,
      }}
    >
      <UserAuthenticated>
        {(user) => (
          <>
            <Box
              sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Typography variant="h2" component="div">
                Batched Transactions
              </Typography>
              <IconButton onClick={handleClose} sx={{ p: 1 }}>
                <SvgIcon>{txCallResult ? <XIcon /> : <ArrowRightIcon />}</SvgIcon>
              </IconButton>
            </Box>

            <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
              {batchTransactionGroups
                .flat()
                .filter((tx) => ['approve', 'delegate'].includes(tx.action)).length > 0 && (
                <Box sx={{ mb: 5 }}>
                  <Typography variant="h4" color="text.secondary" sx={{ mb: 1 }}>
                    Approvals and delegations
                  </Typography>
                  {batchTransactionGroups.map((group, groupIndex) => {
                    return group
                      .filter((tx) => ['approve', 'delegate'].includes(tx.action))
                      .map((approval, approvalIndex) => {
                        return (
                          <Box
                            key={`approval-${groupIndex}-${approvalIndex}`}
                            sx={{
                              mb: 1,
                              p: 2,
                              borderRadius: '4px',
                              bgcolor:
                                approval.status === 'pending'
                                  ? 'warning.200'
                                  : approval.status === 'approved'
                                  ? 'success.200'
                                  : approval.status === 'failed'
                                  ? 'error.200'
                                  : 'background.surface',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Box display="flex" flexDirection="row" alignItems="center" gap={2}>
                              <TokenIcon
                                symbol={approval.symbol || 'TOKEN'}
                                sx={{ fontSize: '24px' }}
                              />
                              <Typography variant="h3" color="text">
                                {approval.action === 'approve' ? 'Approve' : 'Delegate'}
                              </Typography>
                              <Typography variant="h3" color="text.secondary">
                                {approval.symbol || ''}
                              </Typography>
                            </Box>
                            {approval.status !== 'approved' && (
                              <Button
                                variant="contained"
                                onClick={() => {
                                  handleApproveOrDelegate(approval, groupIndex, approvalIndex);
                                }}
                              >
                                {approval.action === 'approve' ? 'Approve' : 'Delegate'}
                                {approval.status === 'pending' && (
                                  <CircularProgress color="inherit" size="16px" sx={{ ml: 2 }} />
                                )}
                              </Button>
                            )}
                          </Box>
                        );
                      });
                  })}
                </Box>
              )}
              {transactionsWithUsdValues.length > 0 && (
                <Box sx={{ mb: 5 }}>
                  <Typography variant="h4" color="text.secondary" sx={{ mb: 1 }}>
                    Transactions
                  </Typography>
                  {transactionsWithUsdValues.map((transaction, index) => (
                    <Box
                      key={index}
                      sx={{
                        mb: 4,
                        p: 3,
                        borderRadius: '4px',
                        bgcolor:
                          transaction.status === 'pending'
                            ? 'warning.200'
                            : transaction.status === 'approved'
                            ? 'success.200'
                            : transaction.status === 'failed'
                            ? 'error.200'
                            : 'background.surface',
                        position: 'relative',
                      }}
                    >
                      <IconButton
                        onClick={() => removeBatchItem(index)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          p: 0.5,
                          bgcolor: 'background.paper',
                          '&:hover': {
                            bgcolor: 'error.main',
                            color: 'error.contrastText',
                          },
                        }}
                        size="small"
                        aria-label="remove transaction"
                      >
                        <SvgIcon fontSize="small">
                          <XIcon />
                        </SvgIcon>
                      </IconButton>

                      <Typography variant="h3" sx={{ mb: 2 }}>
                        {transaction.action === 'supply'
                          ? 'Supply'
                          : transaction.action === 'borrow'
                          ? 'Borrow'
                          : transaction.action === 'repay'
                          ? 'Repay'
                          : transaction.action === 'withdraw'
                          ? 'Withdraw'
                          : transaction.action === 'transfer'
                          ? 'Transfer'
                          : 'Unknown Action'}
                      </Typography>
                      <Typography variant="description" color="text.secondary" sx={{ mb: 1 }}>
                        Amount
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box display="flex" flexDirection="column" alignItems="flex-start">
                          <FormattedNumber
                            value={parseFloat(transaction.amount)}
                            symbol={transaction.symbol}
                            variant="h3"
                          />
                          <FormattedNumber
                            value={parseFloat(transaction.amountUSD)}
                            variant="description"
                            color="text.secondary"
                            symbol="USD"
                            prefix="$"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TokenIcon symbol={transaction.symbol} sx={{ fontSize: '32px', mr: 1 }} />
                          {/* <Typography variant="h3">{transaction.symbol}</Typography> */}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {batchTransactionGroups.length === 0 && <ModalEmpty />}

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  my: 2,
                }}
              >
                <Button
                  variant="outlined"
                  sx={{ borderRadius: '4px', px: 4 }}
                  onClick={() => {
                    router.push('/markets');
                    setOpen(false);
                  }}
                >
                  Explore markets
                </Button>
              </Box>
            </Box>

            <Box
              sx={{
                p: 2,
                mt: 'auto',
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <ModalFooter
                transactionsWithUsdValues={transactionsWithUsdValues}
                user={user}
                totalGasCost={totalGasCost}
                totalGasCostUSD={totalGasCostUSD.toString()}
              />

              {txCallResult?.isError && (
                <Box sx={{ mt: 1, p: 2 }}>
                  <Typography variant="h4" color="error" textAlign="center">
                    Error executing batch transactions
                  </Typography>
                </Box>
              )}

              <Box>
                <Button
                  variant={
                    batchTransactionGroups.length === 0 || (txCallResult && !txCallResult.isError)
                      ? 'contained'
                      : 'gradient'
                  }
                  fullWidth
                  size="large"
                  onClick={handleExecuteBatch}
                  disabled={batchTransactionGroups.length === 0}
                  sx={{ borderRadius: '6px', py: 2 }}
                >
                  {isBatchTransactionsLoading ? (
                    <CircularProgress color="inherit" size="24px" sx={{ mr: 2 }} />
                  ) : (
                    getButtonText()
                  )}
                </Button>
              </Box>
            </Box>
          </>
        )}
      </UserAuthenticated>
    </Drawer>
  );
};
