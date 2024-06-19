#!/bin/bash

yarn workspaces foreach -A version minor

# Get version from package.json
VERSION=$(jq -r '.version' package.json)
git tag v$VERSION

git add .
git commit -m "Release $VERSION"
git push
git push --tags

yarn publish:desktop