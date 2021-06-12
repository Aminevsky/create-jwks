# JWKS 作成

AWS Cognito の JWT を検証する際に必要な JWKS （ `jwks.json` ）を擬似的に作ります。

# 動作環境

以下の環境で動作確認しています。

- macOS 10.15.7
- OpenSSL 1.1.1k
- Node.js 14.17.0
- yarn 1.22.10

# 使い方
## ビルド

```shell
$ yarn
$ yarn build
```

## JWKS 作成

```shell
$ yarn run:create
```

`keys` ディレクトリの下に、以下のファイルを生成する。

- `jwks.json`
- `private-key-*.pem` （秘密鍵）
- `public-key-*.pem` （公開鍵）

AWS Cognito が提供する `jwks.json` にあわせて、秘密鍵と公開鍵は 2 組生成される。

## サンプル

```shell
$ yarn run:example
```

上記で作成した鍵を使って、JWT の作成および検証を行う。

任意のペイロードを指定して、秘密鍵で署名して JWT を作成する。

`jwks.json` から取得した公開鍵で、JWT を検証する。
