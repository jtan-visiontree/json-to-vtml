#!/usr/bin/env bash

for FILE in datasets/Forms/*.json
do
  printf "\nProcessing $FILE ..."

  NEW_DIRECTORY=${FILE%.*}
  NEW_DIRECTORY="$(cd "$(dirname "$NEW_DIRECTORY")"; pwd)/$(basename "$NEW_DIRECTORY")"
  FILE="$(cd "$(dirname "$FILE")"; pwd)/$(basename "$FILE")"
  #ESCAPED_NEW_DIRECTORY=$( echo "$NEW_DIRECTORY" | sed 's/ /\\ /g' )
  if [ ! -d "$NEW_DIRECTORY" ]
  then
    printf "\nCreating directory $NEW_DIRECTORY"
    mkdir "$NEW_DIRECTORY"
  fi
  printf "\n"
  cd src
  node "./promis-cat-converter.js" "$FILE"
  mv "$NEW_DIRECTORY.vtml" "$NEW_DIRECTORY/co-12-version.vtml"
  cd ..
done

printf "\n"
exit
