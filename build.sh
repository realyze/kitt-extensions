#!/bin/sh

path=$(pwd);

export PATH="$PATH:$path/node_modules/.bin"

export KITT_EXT_DIST_PATH="$path/dist"
export KITT_EXT_BUILD_PATH="$path/build/{NAME}"

files=$(ls */manifest.json 2> /dev/null | wc -l)

if [ "$files" != "0" ]
then
  for f in */manifest.json
  do
    path=$(dirname $f);
    grunt "--path=$path"
  done
fi
