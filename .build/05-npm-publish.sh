#!/usr/bin/env bash

if [[ -z "${PACKAGE_NAME}" ]]; then source ".build/00-setup.sh"; fi

if [[ -f package.json ]]; then
  echo "*** Publishing to NPM registry..."

  if [[ $(jq -r .name < package.json) =~ "@creativelive" ]]; then
    if [[ "$(branch_name)" == "release" ]]; then
      npm publish
    else
      npm publish --tag "$(prerelease_tag)" # I think this is ignored: --registry ${NPM_REGISTRY}
    fi
  else
    echo "${pkg} package.json name does not have @creativelive"
    exit 1
  fi

  if [ $? -ne 0 ]; then
    echo "npm publish failed!"
    exit 1
  fi
else
  echo "(not publishing to NPM -- no package.json)"
fi
