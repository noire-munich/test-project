#!/usr/bin/bash

cd /Workspace/Code/TH90/catalog/rw-cloudformation && yarn build;
cd /Workspace/Code/Redwood/test-project && yarn add noire-munich@portal:/Workspace/Code/TH90/catalog/rw-cloudformation && clear && yarn cloudformation init
