#!/bin/sh

# create a diagram directory if not exist
if [ ! -d diagram ]; then
    mkdir -p diagram
fi

npx tsuml2 --glob '' --config ./connector-uml.config.json --outFile ./diagrams/uml.svg