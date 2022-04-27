import { mnemonicToSeed } from 'bip39';
import { networks } from 'bitcoinjs-lib';
export async function init(
  mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
) {
  return await mnemonicToSeed(mnemonic);
}
import { checkNetwork, checkPurpose, checkExtPub } from '../check';

import {
  setExtPubPrefix,
  getNetworkCoinType,
  fromSeed,
  serializeDerivationPath
} from '../bip32';

export async function getExtPub(
  seed,
  { purpose, accountNumber, network = networks.testnet }
) {
  checkPurpose(purpose);
  checkNetwork(network);
  if (!Number.isInteger(accountNumber) || accountNumber < 0)
    throw new Error('Invalid accountNumber');

  const root = await fromSeed(seed, network);
  const extPub = setExtPubPrefix({
    extPub: root
      .derivePath(
        serializeDerivationPath({
          purpose,
          coinType: getNetworkCoinType(network),
          accountNumber
        })
      )
      .neutered()
      .toBase58(),
    purpose,
    network
  });
  checkExtPub({ extPub, accountNumber, network });
  return extPub;
}

export async function createSigners(seed, { psbt, utxos, network }) {
  const root = await fromSeed(seed, network);
  return utxos.map(utxo => $hash => {
    const signature = root.derivePath(utxo.derivationPath).sign($hash);
    return signature;
  });
}
