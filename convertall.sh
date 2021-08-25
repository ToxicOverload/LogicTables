#!/bin/bash

for file in $(find ./arguments -iname '*.arg'); do
  npm start -- -f "$file" -o "${file%.arg}.tex"
done