import { Box, Menu, MenuItem, Typography } from '@mui/material';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { CircleIcon } from 'src/components/CircleIcon';
import { WalletIcon } from 'src/components/icons/WalletIcon';
import { Base64Token, TokenIcon } from 'src/components/primitives/TokenIcon';
import { ComputedReserveData } from 'src/hooks/app-data-provider/useAppDataProvider';
import { ERC20TokenType } from 'src/libs/web3-data-provider/Web3Provider';
import { useRootStore } from 'src/store/root';
import { RESERVE_DETAILS } from 'src/utils/mixPanelEvents';

interface AddTokenDropdownProps {
  poolReserve: ComputedReserveData;
  downToSM: boolean;
  switchNetwork: (chainId: number) => Promise<void>;
  addERC20Token: (args: ERC20TokenType) => Promise<boolean>;
  currentChainId: number;
  connectedChainId: number;
  hideMToken?: boolean;
}

export const AddTokenDropdown = ({
  poolReserve,
  downToSM,
  switchNetwork,
  addERC20Token,
  currentChainId,
  connectedChainId,
  hideMToken,
}: AddTokenDropdownProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [changingNetwork, setChangingNetwork] = useState(false);
  const [underlyingBase64, setUnderlyingBase64] = useState('');
  const [mTokenBase64, setmTokenBase64] = useState('');
  const open = Boolean(anchorEl);
  const trackEvent = useRootStore((store) => store.trackEvent);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // The switchNetwork function has no return type, so to detect if a user successfully switched networks before adding token to wallet, check the selected vs connected chain id
  useEffect(() => {
    if (changingNetwork && currentChainId === connectedChainId) {
      addERC20Token({
        address: poolReserve.underlyingAsset,
        decimals: poolReserve.decimals,
        symbol: poolReserve.symbol,
        image: !/_/.test(poolReserve.iconSymbol) ? underlyingBase64 : undefined,
      });
      setChangingNetwork(false);
    }
  }, [
    currentChainId,
    connectedChainId,
    changingNetwork,
    addERC20Token,
    poolReserve?.underlyingAsset,
    poolReserve?.decimals,
    poolReserve?.symbol,
    poolReserve?.iconSymbol,
    underlyingBase64,
  ]);

  if (!poolReserve) {
    return null;
  }

  return (
    <>
      {/* Load base64 token symbol for adding underlying and mTokens to wallet */}
      {poolReserve?.symbol && !/_/.test(poolReserve.symbol) && (
        <>
          <Base64Token
            symbol={poolReserve.iconSymbol}
            onImageGenerated={setUnderlyingBase64}
            mToken={false}
          />
          {!hideMToken && (
            <Base64Token
              symbol={poolReserve.iconSymbol}
              onImageGenerated={setmTokenBase64}
              mToken={true}
            />
          )}
        </>
      )}
      <Box onClick={handleClick}>
        <CircleIcon tooltipText="Add token to wallet" downToSM={downToSM}>
          <Box
            onClick={() => {
              trackEvent(RESERVE_DETAILS.ADD_TOKEN_TO_WALLET_DROPDOWN, {
                asset: poolReserve.underlyingAsset,
                assetName: poolReserve.name,
              });
            }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              '&:hover': {
                '.Wallet__icon': { opacity: '0 !important' },
                '.Wallet__iconHover': { opacity: '1 !important' },
              },
              cursor: 'pointer',
            }}
          >
            <WalletIcon sx={{ width: '14px', height: '14px', '&:hover': { stroke: '#F1F1F3' } }} />
          </Box>
        </CircleIcon>
      </Box >
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        keepMounted={true}
        data-cy="addToWaletSelector"
      >
        <Box sx={{ px: 4, pt: 3, pb: 2 }}>
          <Typography variant="secondary12" color="text.secondary">
            Underlying token
          </Typography>
        </Box>

        <MenuItem
          key="underlying"
          value="underlying"
          divider
          onClick={() => {
            if (currentChainId !== connectedChainId) {
              switchNetwork(currentChainId).then(() => {
                setChangingNetwork(true);
              });
            } else {
              trackEvent(RESERVE_DETAILS.ADD_TO_WALLET, {
                type: 'Underlying token',
                asset: poolReserve.underlyingAsset,
                assetName: poolReserve.name,
              });

              addERC20Token({
                address: poolReserve.underlyingAsset,
                decimals: poolReserve.decimals,
                symbol: poolReserve.symbol,
                image: !/_/.test(poolReserve.symbol) ? underlyingBase64 : undefined,
              });
            }
            handleClose();
          }}
        >
          <TokenIcon symbol={poolReserve.iconSymbol} sx={{ fontSize: '20px' }} />
          <Typography variant="subheader1" sx={{ ml: 3 }} noWrap data-cy={`assetName`}>
            {poolReserve.symbol}
          </Typography>
        </MenuItem>
        {!hideMToken && (
          <Box>
            <Box sx={{ px: 4, pt: 3, pb: 2 }}>
              <Typography variant="secondary12" color="text.secondary">
                More mToken
              </Typography>
            </Box>
            <MenuItem
              key="mtoken"
              value="mtoken"
              onClick={() => {
                if (currentChainId !== connectedChainId) {
                  switchNetwork(currentChainId).then(() => {
                    setChangingNetwork(true);
                  });
                } else {
                  trackEvent(RESERVE_DETAILS.ADD_TO_WALLET, {
                    asset: poolReserve.underlyingAsset,
                    assetName: poolReserve.name,
                  });

                  addERC20Token({
                    address: poolReserve.aTokenAddress,
                    decimals: poolReserve.decimals,
                    symbol: '',
                    image: !/_/.test(poolReserve.symbol) ? mTokenBase64 : undefined,
                  });
                }
                handleClose();
              }}
            >
              <TokenIcon symbol={poolReserve.iconSymbol} sx={{ fontSize: '20px' }} mToken={true} />
              <Typography variant="subheader1" sx={{ ml: 3 }} noWrap data-cy={`assetName`}>
                {`m${poolReserve.symbol}`}
              </Typography>
            </MenuItem>
          </Box>
        )}
      </Menu>
    </>
  );
};
