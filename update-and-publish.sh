#!/bin/sh
npm version patch
sh ./build.sh
npm publish