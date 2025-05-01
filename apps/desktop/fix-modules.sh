#!/bin/bash

find ./node_modules -type l | while IFS= read -r link; do
  target=$(readlink "$link")
  abs_target=$(realpath -m "$(dirname "$link")/$target")
  if [ -d "$abs_target" ]; then
    echo "Replacing symlink $link with copy of $abs_target"
    rm "$link"
    cp -rL "$abs_target" "$link"
  fi
done

