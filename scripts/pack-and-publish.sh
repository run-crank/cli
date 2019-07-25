#!/bin/bash

npm pack
rm crank-*.tgz

./node_modules/.bin/oclif-dev pack
./node_modules/.bin/oclif-dev pack:macos

# There appears to be a bug in the pack:win command that prevents successful
# packing if a previous pack is still in tmp/cache. We should fix upstream...
# @see https://github.com/oclif/dev-cli/issues/32
rm -rf ./tmp/windows-x64-installer && rm -rf ./tmp/windows-x86-installer
./node_modules/.bin/oclif-dev pack:win

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
