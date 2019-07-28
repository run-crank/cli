#!/bin/bash
set -e

npm pack
rm crank-*.tgz

./node_modules/.bin/oclif-dev pack
./scripts/build-release.sh darwin
./scripts/build-release.sh win32

./node_modules/.bin/oclif-dev publish
./node_modules/.bin/oclif-dev publish:macos
./node_modules/.bin/oclif-dev publish:win

aws cloudfront create-invalidation --distribution-id E2QTABTD83AOC8 \
  --paths /crank-darwin-x64.tar.gz /crank-darwin-x64.tar.xz \
    /crank-linux-arm.tar.gz /crank-linux-arm.tar.xz \
   /crank-linux-x64.tar.gz /crank-linux-x64.tar.xz \
   /crank-win32-x64.tar.gz /crank-win32-x64.tar.xz \
   /crank-win32-x86.tar.gz /crank-win32-x86.tar.xz \
   /crank-x64.exe /crank-x86.exe \
   /crank.tar.gz /crank.tar.xz \
   /crank.pkg \
   /darwin-x64 /linux-arm /linux-x64 /version /win32-x64 /win32-x86
