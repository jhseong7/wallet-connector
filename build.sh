#!/bin/sh

# if there is a directory called dist, delete it
if [ -d dist ]; then
  echo  "Deleting dist directory"
  rm -rf dist
fi

# build the typescript compiler
echo "Building"
tsc

# move the libraries (usually js) that does not get copied with the tsc command
echo "Copying library"
mkdir -p dist/lib
cp -r src/lib/* dist/lib

echo "done"