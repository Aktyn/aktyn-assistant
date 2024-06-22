#!/bin/bash

type=$1 # major, minor, patch

if [ -z "$type" ]; then
    echo "No type specified"
    echo "Usage: ./release.sh [major|minor|patch]"
    exit 1
fi

if [ "$type" != "major" ] && [ "$type" != "minor" ] && [ "$type" != "patch" ]; then
    echo "Invalid type specified"
    exit 1
fi

yarn workspaces foreach -A version $type

# Get version from package.json
VERSION=$(jq -r '.version' package.json)

git add .
git commit -m "Release $VERSION"
git tag v$VERSION
git push --tags
git push

yarn publish:desktop