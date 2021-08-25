#!/bin/bash

for file in $(find ./arguments -name '*.arg'); do
  npm start -- -f "$file" -o "${file%.arg}.tex"
done