#!/bin/bash -e

# Copyright 2017 Google Inc. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

if [[ -e /customize_for_vm_type.sh ]]; then
  /customize_for_vm_type.sh
fi

# Start the Colab proxy to the Jupyter kernel manager.
( while true; do
  GCE_METADATA_HOST="${VM_GCE_METADATA_HOST}" \
  /usr/colab/bin/kernel_manager_proxy \
    --listen_port="${KMP_LISTEN_PORT}" \
    --target_port="${KMP_TARGET_PORT}" \
    ${KMP_EXTRA_ARGS} || true
  sleep 1
done & )

# Start fresh to isolate user-initiated actions from VM build & startup events.
for f in /var/log/apt/history.log /var/log/pip.log; do
  mv "$f" "${f}.bak-run.sh" || true  # Ignore missing files.
done

# Warm disk buffers for modules we need for kernel startup. (cf: b/116536906)
python3 -c "import google.colab._kernel"
python3 -c "import matplotlib"
python3 -c "import tensorflow" &

# Start the server to handle /files and /api/contents requests.
/usr/local/bin/colab-fileshim.py &

# Link NVidia tools from a read-only volume mount.
for f in $(ls /opt/bin/.nvidia 2>/dev/null); do
  ln -st /opt/bin ".nvidia/${f}"
done

cd /

# Start the node server.
exec /tools/node/bin/node /datalab/web/app.js
