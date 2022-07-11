/*
 * Credit to BitGo/BitGoJS:
 * https://github.com/BitGo/BitGoJS/blob/bitcoinjs_lib_6_sync/modules/utxo-lib/src/noble_ecc.ts
 */

import { crypto as bcrypto } from 'bitcoinjs-lib';
import createHmac from 'create-hmac';
import { ECPairFactory } from 'ecpair';
import * as necc from '@noble/secp256k1';

import { BIP32Factory } from 'bip32';
necc.utils.sha256Sync = (...messages) => {
  return bcrypto.sha256(Buffer.concat(messages));
};
necc.utils.hmacSha256Sync = (key, ...messages) => {
  const hash = createHmac('sha256', Buffer.from(key));
  messages.forEach(m => hash.update(m));
  return Uint8Array.from(hash.digest());
};
const defaultTrue = param => param !== false;
function throwToNull(fn) {
  try {
    return fn();
  } catch (e) {
    return null;
  }
}
function isPoint(p, xOnly) {
  if ((p.length === 32) !== xOnly) return false;
  try {
    return !!necc.Point.fromHex(p);
  } catch (e) {
    return false;
  }
}
const ecc = {
  isPoint: p => isPoint(p, false),
  isPrivate: d => necc.utils.isValidPrivateKey(d),
  isXOnlyPoint: p => isPoint(p, true),
  xOnlyPointAddTweak: (p, tweak) =>
    throwToNull(() => {
      const P = necc.utils.pointAddScalar(p, tweak, true);
      const parity = P[0] % 2 === 1 ? 1 : 0;
      return { parity, xOnlyPubkey: P.slice(1) };
    }),
  pointFromScalar: (sk, compressed) =>
    throwToNull(() => necc.getPublicKey(sk, defaultTrue(compressed))),
  pointCompress: (p, compressed) => {
    return necc.Point.fromHex(p).toRawBytes(defaultTrue(compressed));
  },
  pointMultiply: (a, tweak, compressed) =>
    throwToNull(() =>
      necc.utils.pointMultiply(a, tweak, defaultTrue(compressed))
    ),
  pointAdd: (a, b, compressed) =>
    throwToNull(() => {
      const A = necc.Point.fromHex(a);
      const B = necc.Point.fromHex(b);
      return A.add(B).toRawBytes(defaultTrue(compressed));
    }),
  pointAddScalar: (p, tweak, compressed) =>
    throwToNull(() =>
      necc.utils.pointAddScalar(p, tweak, defaultTrue(compressed))
    ),
  privateAdd: (d, tweak) => throwToNull(() => necc.utils.privateAdd(d, tweak)),
  privateNegate: d => necc.utils.privateNegate(d),
  sign: (h, d, e) => {
    return necc.signSync(h, d, { der: false, extraEntropy: e });
  },
  signSchnorr: (h, d, e = Buffer.alloc(32, 0x00)) => {
    return necc.schnorr.signSync(h, d, e);
  },
  verify: (h, Q, signature, strict) => {
    return necc.verify(signature, h, Q, { strict });
  },
  verifySchnorr: (h, Q, signature) => {
    return necc.schnorr.verifySync(signature, h, Q);
  }
};
const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);
export { ecc, ECPair, bip32 };