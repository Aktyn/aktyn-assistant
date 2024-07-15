const { FusesPlugin } = require('@electron-forge/plugin-fuses')
const { FuseV1Options, FuseVersion } = require('@electron/fuses')
const {
  utils: { fromBuildIdentifier },
} = require('@electron-forge/core')
require('dotenv').config()

module.exports = {
  buildIdentifier: 'beta',
  packagerConfig: {
    appBundleId: fromBuildIdentifier({
      beta: 'com.beta.aktyn-assistant',
      prod: 'com.aktyn-assistant',
    }),
    asar: true,
    name: 'Aktyn Assistant',
    executableName: 'aktyn-assistant-desktop',
    appCopyright: 'Copyright © 2024 Radosław Krajewski (Aktyn)',
    extraResource: ['node_modules/@aktyn-assistant/core/assets'],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux', 'win32'],
    },
    {
      name: '@electron-forge/maker-deb',
      executableName: 'aktyn-assistant-desktop',
      config: {
        options: {
          icon: './img/icon.png',
          name: 'Aktyn Assistant',
          productName: 'Aktyn Assistant',
        },
      },
    },
    // {
    //   name: '@electron-forge/maker-flatpak',
    //   config: {
    //     options: {},
    //   },
    // },
    // {
    //   name: '@electron-forge/maker-rpm',
    //   config: {},
    // },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        authToken: process.env.GITHUB_TOKEN,
        repository: {
          owner: 'Aktyn',
          name: 'aktyn-assistant',
        },
        force: true,
        draft: false,
        prerelease: true,
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
}
