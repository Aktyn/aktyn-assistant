#!/bin/bash

echo Recreating node_modules directory
rm -rf ./node_modules 2> /dev/null
mkdir ./node_modules

echo Moving to root node_modules
cd ../../node_modules
pwd
echo Copying modules
cp -rL $(ls | grep -v '^aktyn-assistant-desktop' | grep -v '^aktyn-assistant-terminal') ../apps/desktop/node_modules/
# find -type l -exec sh -c 'PREV=$(realpath -- "$1") && rm -- "$1" && cp -ar -- "$PREV" "$1"' resolver {} \;

cd ..