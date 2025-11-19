# Mitra Deploy
# This one is for planning to export the system away from this development folder to the
# Real environment one
# 
# Though we suggest you run the setup first then deploy this
# to get a working system

# Note: If you dont want to re-install, then this tool is fine

#!/bin/bash

DIRTARGET="runtime"
DBTARGET="database.sqlite"

# NODE
NODE_LIB=("node_modules" "package.json" "package_lock.js")


# USE ZIP AS PACKAGING
# REMOVE THE OLD ONE IF PRESENT
rm -rf mitra_deployment.zip
zip -rq mitra_deployout.zip "$DIRTARGET" "$DBTARGET" "${NODE_LIB[@]}"