#!/bin/sh
cd ..
yarn local-devbuild
cd test-frontend

rm -rf ./node_modules/@jhseong7
mkdir -p ./node_modules/@jhseong7/wallet-connector

echo "Copying files from localdevbuild ..."
cp -r ../localdevbuild/* ./node_modules/@jhseong7/wallet-connector
