#!/bin/bash

echo Recreating node_modules directory
rm -rf ./node_modules 2> /dev/null
mkdir ./node_modules

echo Moving to root node_modules
cd ../../node_modules
pwd
echo Copying modules
cp -rL $(ls | grep -v '^aktyn-assistant-desktop') ../apps/desktop/node_modules/

cd ..