import dayjs from 'dayjs';
import * as fs from 'fs';
import * as path from 'path';
import * as jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import { Pems } from './@types/types';

const token = createToken();
const pems = convertJwksToPem();

verify(token, pems)
  .then((result) => {
    console.log(`検証結果: ${result}`);
  })
  .catch((error) => {
    console.error(error);
    console.log(`検証結果: false`);
  });

/**
 * ペイロードを指定して JWT を作る。
 */
function createToken(): string {
  const now = dayjs().unix();
  const exp = dayjs().add(60, 'minute').unix(); // JWT の有効期間: 60分

  // ペイロード
  const payload = {
    sub: 'aaaaaaaa-bbbb-cccc-dddd-example',
    token_use: 'access', // アクセストークン
    scope: 'aws.cognito.siginin.user.admin',
    auth_time: now,
    iss: 'https://cognito-idp.ap-northeast-1.amazonaws.com/ap-nourtheast-1_example',
    exp,
    iat: now,
    jti: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    client_id: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
    username: 'aaaaaaaa-bbbb-cccc-dddd-example',
  };

  // 秘密鍵を取得する。
  const secretKey = fs.readFileSync(
    path.resolve('./keys/private-key-1.pem'),
    'ascii',
  );

  // ペイロードを秘密鍵で署名する。
  const token = jwt.sign(payload, secretKey, {
    algorithm: 'RS256',
    header: {
      kid: 'dummy-keys-1', // 公開鍵の中に存在するキー ID であること
    },
  });

  return token;
}

/**
 * JWKS を PEM 形式へ変換する。
 */
function convertJwksToPem(): Pems {
  const jwksJson = fs.readFileSync(path.resolve('./keys/jwks.json'), 'ascii');
  const jwks = JSON.parse(jwksJson);

  const pems: Pems = {};
  const keys = jwks.keys;

  for (let i = 0; i < keys.length; i++) {
    const keyId = keys[i]!.kid;
    const modules = keys[i]!.n;
    const exponent = keys[i]!.e;
    const keyType = keys[i]!.kty;
    const jwk = { kty: keyType, n: modules, e: exponent };

    pems[keyId] = jwkToPem(jwk);
  }

  return pems;
}

/**
 * JWT を検証する。
 *
 * @param token
 * @param pems
 */
async function verify(token: string, pems: Pems): Promise<boolean> {
  // デコード
  const decodedJwt = jwt.decode(token, { complete: true });
  if (!decodedJwt) {
    return false;
  }

  // 発行者が一致するか
  const iss =
    'https://cognito-idp.ap-northeast-1.amazonaws.com/ap-nourtheast-1_example';
  if (decodedJwt.payload.iss !== iss) {
    return false;
  }

  // アクセストークンか
  if (decodedJwt.payload.token_use !== 'access') {
    return false;
  }

  // 公開鍵に存在するキー ID か
  const kid = decodedJwt.header.kid;
  const pem = pems[kid];

  if (!pem) {
    return false;
  }

  return new Promise((resolve, reject) => {
    jwt.verify(token, pem, { issuer: iss }, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
}
