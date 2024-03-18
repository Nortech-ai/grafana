export declare global {
  interface Window {
    __grafanaSceneContext: SceneObject;
    __grafana_app_bundle_loaded: boolean;
    __grafana_public_path__: string;
    __grafana_load_failed: () => void;
    public_cdn_path: string;
    nonce: string | undefined;
    System: typeof System;
    nortechCustomization?: {
      name: string;
      logoUrl: string;
      logoUrlDark: string;
      iconUrl: string;
      iconUrlDark: string;
      primaryColor: string;
      primaryColorDark: string;
      warnColor: string;
      warnColorDark: string;
      backgroundColor: string;
      backgroundColorDark: string;
      fontUrl: string;
      fontColor: string;
      fontColorDark: string;
    };
  }

  // Augment DOMParser to accept TrustedType sanitised content
  interface DOMParser {
    parseFromString(string: string | TrustedType, type: DOMParserSupportedType): Document;
  }
}
