import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { pem2jwk } from 'pem-jwk';
import { Jwks } from './@types/types';

const outDir = 'keys';
if (!fs.existsSync(outDir)) {
  try {
    fs.mkdirSync(outDir);
  } catch (error) {
    console.error(`ディレクトリ作成失敗: ${error}`);
    process.exit(1);
  }
}

const jwks: Jwks = { keys: [] };

// Cognito に合わせて複数の鍵を作る。
for (let i = 1; i <= 2; i++) {
  // 秘密鍵
  const privatePemPath = path.join(outDir, `private-key-${i}.pem`);
  try {
    execSync(`openssl genrsa 2048 > ${privatePemPath}`);
    console.log(`秘密鍵作成成功: ${privatePemPath}`);
  } catch (error) {
    console.error(`秘密鍵作成失敗: ${error}`);
    process.exit(1);
  }

  // 公開鍵
  const publicPemPath = path.join(outDir, `public-key-${i}.pem`);
  try {
    execSync(`openssl rsa -pubout < ${privatePemPath} > ${publicPemPath}`);
    console.log(`公開鍵作成成功: ${publicPemPath}`);
  } catch (error) {
    console.error(`公開鍵作成失敗: ${error}`);
    process.exit(1);
  }

  // 公開鍵を PEM から JWK へ変換する。
  try {
    // @ts-ignore 第2引数が型定義に存在しないので無視する。
    const jwk = pem2jwk(fs.readFileSync(publicPemPath, 'ascii'), {
      alg: 'RS256',
      kid: `dummy-keys-${i}`,
      use: 'sig',
    });

    jwks.keys.push(jwk);
  } catch (error) {
    console.error(`PEM -> JWKS 変換失敗: ${error}`);
    process.exit(1);
  }
}

try {
  const jwksPath = path.join(outDir, 'jwks.json');
  fs.writeFileSync(jwksPath, JSON.stringify(jwks, null, '\t'));
  console.log(`JWKS 作成成功: ${jwksPath}`);
} catch (error) {
  console.error(`JWKS 作成失敗: ${error}`);
  process.exit(1);
}
