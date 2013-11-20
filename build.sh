#!/bin/sh

path=$(pwd);

export KITT_EXT_DIST_PATH="$path/dist"
export KITT_EXT_BUILD_PATH="$path/build/{NAME}"

for f in */manifest.json
do
  path=$(dirname $f);
  grunt "--path=$path"
done
