// Global type declarations for KefinTweaks

interface KefinTweaksConfig {
  scripts?: Record<string, boolean>;
  homeScreen?: any;
  kefinTweaksRoot?: string;
  [key: string]: any; // Allow additional properties
}

interface Window {
  KefinTweaksConfig?: KefinTweaksConfig;
  KefinTweaks?: any;
  KefinTweaksUtils?: any;
  IndexedDBCache?: any;
  apiHelper?: any;
  Emby?: any;
  LocalStorageCache?: any;
  ModalSystem?: any;
  JellyfinEnhanced?: any;
  ApiClient: any;
}