import "dotenv/config";

export default ({ config }) => ({
  ...config,
  plugins: [
    [
      "@rnmapbox/maps",
      {
        RNMapboxMapsImpl: "mapbox",
        RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN,
      },
    ],
  ],
});
