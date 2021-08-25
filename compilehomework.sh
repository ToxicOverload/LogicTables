#!/bin/bash

FULL=""
for file in $(find ./arguments/Logic -iname $1'.*.arg'); do
  FULL+=$(npm start -- -f "$file")
  echo $file
done

echo $FULL