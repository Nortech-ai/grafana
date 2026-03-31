# NORTECH Grafana fork

This repository is our custom Grafana fork. It keeps the upstream Grafana codebase, but adds a small set of
NORTECH-specific changes for plugin distribution, frontend branding, and proxy behavior.

Before you begin, ensure you have the following:

- A local development environment that can build and run Grafana.
- Access to the NORTECH plugin repositories if you need to build Docker images with bundled NORTECH plugins.
- A browser extension such as [ModHeader](https://modheader.com/) so you can send the auth proxy headers required for
  local development.

## What is customized

This fork currently includes three main changes:

- **Plugin installation:** The Docker build and runtime plugin installation flow supports both standard Grafana
  marketplace plugins and NORTECH-owned plugins.
- **Frontend customization:** The frontend reads custom NORTECH environment variables for branding and UI customization.
- **Datasource proxy fix:** The datasource proxy layer includes a small NORTECH-specific fix.

## Plugin installation behavior

The image build supports two plugin sources:

- **Grafana marketplace plugins:** Set `GF_INSTALL_PLUGINS` with a comma-separated list of plugins that should be
  installed by default in our instances.
- **NORTECH plugins:** Set `NORTECH_PLUGINS` with a comma-separated list of NORTECH plugins such as
  `nortech-cloud-datasource` or `nortech-edge-datasource`.

When `NORTECH_PLUGINS` is set, the custom install script downloads the latest release asset for each plugin from GitHub.
To do that, it also requires `NORTECH_GITHUB_TOKEN`, which must have permission to fetch release assets.

## Frontend customization

The frontend supports NORTECH-specific environment variables for branding. Local examples live in `dev.env.sh`.

These variables include values such as:

- **Colors:** `NORTECH_BACKGROUND_COLOR`, `NORTECH_PRIMARY_COLOR`, and their dark-mode variants.
- **Brand assets:** `NORTECH_FONT_URL`, `NORTECH_ICON_URL`, and `NORTECH_LOGO_URL`.
- **Product name:** `NORTECH_NAME`.

## Run locally

To run the fork locally, use the following command:

```sh
source dev.env.sh && make run
```

Local auth is expected to come from auth proxy headers. Use a browser extension such as
[ModHeader](https://modheader.com/) to add the required headers to your requests, for example:

- **Email:** `X-Email`
- **Name:** `X-Name`
- **Role:** `X-Grafana-Role`

## Build the Docker image

To build the Docker image, use the following command:

```sh
make build-docker-full
```

Set these environment variables before you run the build:

- **`GF_INSTALL_PLUGINS`:** Grafana marketplace plugins that we want installed by default in our instances.
- **`NORTECH_PLUGINS`:** NORTECH plugins such as `nortech-cloud-datasource` or `nortech-edge-datasource` that we also
  want installed by default.
- **`NORTECH_GITHUB_TOKEN`:** GitHub token with permission to fetch release assets for the NORTECH plugins.

{{< admonition type="warning" >}} `depot` builds currently fail because of an issue on the Depot side. Use the standard
`make build-docker-full` flow until that issue is resolved. {{< /admonition >}}

## Useful references

If you need more background on Grafana datasource plugins and proxy auth, refer to these resources:

- [Build a data source plugin](https://grafana.com/developers/plugin-tools/tutorials/build-a-data-source-plugin)
- [Authenticate using the data source proxy](https://grafana.com/developers/plugin-tools/how-to-guides/data-source-plugins/add-authentication-for-data-source-plugins#authenticate-using-the-data-source-proxy)
