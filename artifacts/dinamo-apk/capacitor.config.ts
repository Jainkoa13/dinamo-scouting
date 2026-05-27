import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.dinamoibaiondo.scouting",
  appName: "DI Scouting",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    allowMixedContent: true,
    backgroundColor: "#2d3139",
  },
};

export default config;
