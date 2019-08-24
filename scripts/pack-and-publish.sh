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

node ./scripts/invalidate-cf.js
