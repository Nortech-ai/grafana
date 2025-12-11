if [ ! -d "$GF_PATHS_PLUGINS" ]; then
    mkdir "$GF_PATHS_PLUGINS"
fi

if [ ! -z "${GF_INSTALL_PLUGINS}" ]; then
  >&2 echo "\033[0;33mWARN\033[0m: GF_INSTALL_PLUGINS is deprecated. Use GF_PLUGINS_PREINSTALL or GF_PLUGINS_PREINSTALL_SYNC instead. Checkout the documentation for more info."
  OLDIFS=$IFS
  IFS=','
  for plugin in ${GF_INSTALL_PLUGINS}; do
      IFS=$OLDIFS
      if [[ $plugin =~ .*\;.* ]]; then
          pluginUrl=$(echo "$plugin" | cut -d';' -f 1)
          pluginInstallFolder=$(echo "$plugin" | cut -d';' -f 2)
          grafana cli --pluginUrl ${pluginUrl} --pluginsDir "${GF_PATHS_PLUGINS}" plugins install "${pluginInstallFolder}"
      else
          grafana cli --pluginsDir "${GF_PATHS_PLUGINS}" plugins install ${plugin}
      fi
  done
fi

REPO_OWNER="Nortech-ai"

if [ -n "${NORTECH_PLUGINS}" ] && [ -n "${NORTECH_GITHUB_TOKEN}" ]; then
  OLDIFS=$IFS
  IFS=','
  for plugin in ${NORTECH_PLUGINS}; do
    IFS=$OLDIFS
    echo "Downloading ${plugin} from Github"
    
    response=$(curl -sH "Authorization: Bearer ${NORTECH_GITHUB_TOKEN}" https://api.github.com/repos/${REPO_OWNER}/${plugin}/releases/latest)
    asset_id=$(echo "$response" | jq -r '.assets[0].id')

    if [ "$asset_id" == "null" ] || [ -z "$asset_id" ]; then
      url=$(echo "$response" | jq -r '.url')
      if [ "$url" != "null" ] && [ -n "$url" ]; then
        response=$(curl -sH "Authorization: Bearer ${NORTECH_GITHUB_TOKEN}" "$url")
        asset_id=$(echo "$response" | jq -r '.assets[0].id')
        if [ "$asset_id" == "null" ] || [ -z "$asset_id" ]; then
          echo "Could not retrieve asset_id for $plugin release. Exiting..."
          exit 1
        fi
      else
        echo "Could not retrieve asset URL for $plugin release. Exiting..."
        exit 1
      fi
    fi

    echo "Asset ID: $asset_id"
    if ! curl -L \
        -H "Accept: application/octet-stream" \
        -H "Authorization: Bearer ${NORTECH_GITHUB_TOKEN}" \
        "https://api.github.com/repos/${REPO_OWNER}/${plugin}/releases/assets/${asset_id}" -o "${GF_PATHS_PLUGINS}/plugin.zip"; then
      echo "Failed to download ${plugin}. Exiting..."
      exit 1
    fi
    echo "Downloaded ${plugin} successfully"

    if [ -d "${GF_PATHS_PLUGINS}/${plugin}" ]; then
      rm -rf "${GF_PATHS_PLUGINS}/${plugin}"
      echo "Removed existing ${plugin} plugin"
    fi
    
    if ! unzip -o "${GF_PATHS_PLUGINS}/plugin.zip" -d "${GF_PATHS_PLUGINS}"; then
      echo "Failed to unzip ${plugin}. Exiting..."
      exit 1
    fi
    rm "${GF_PATHS_PLUGINS}/plugin.zip"
  done
else
  echo "NORTECH_PLUGINS or NORTECH_GITHUB_TOKEN is not set. Skipping plugin installation."
fi