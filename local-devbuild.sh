#!/bin/sh

./build.sh

# if there is a directory called localdevbuild, delete it
if [ -d localdevbuild ]; then
  echo  "Deleting localdevbuild directory"
  rm -rf localdevbuild
fi
mkdir -p localdevbuild;

echo "Copying files from dist ..."
cp -r ./dist ./localdevbuild

echo "Copying files from to localdevbuild ..."
cp -r ./package.json ./localdevbuild
