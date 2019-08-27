#!/usr/bin/env bash

if [[ -z "${PACKAGE_NAME}" ]]; then source ".build/00-setup.sh"; fi

echo "*** Testing..."
if [[ -f package.json ]]; then

  if [[ ! -z $(jq -r .scripts.test < package.json) ]]; then
    npm test
    if [ $? -ne 0 ]; then
      echo "test failed!"
      exit 1
    fi
  else
    echo "no test defined!"
  fi
else
  echo "skipping npm test -- no package.json"
fi
