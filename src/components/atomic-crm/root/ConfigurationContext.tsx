import { useMemo } from "react";
import { useStore } from "ra-core";

import type { DealStage, LabeledValue, NoteStatus } from "../types";
import { defaultConfiguration } from "./defaultConfiguration";

export const CONFIGURATION_STORE_KEY = "app.configuration";

export interface ConfigurationContextValue {
  companySectors: LabeledValue[];
  currency: string;
  dealCategories: LabeledValue[];
  dealPipelineStatuses: string[];
  dealStages: DealStage[];
  noteStatuses: NoteStatus[];
  taskTypes: LabeledValue[];
  title: string;
  darkModeLogo: string;
  lightModeLogo: string;
  favicon: string;
}

/** Recursively extract a plain string from a value that may be stored as a
 * raw {src,...} ImageEditorField object (old save format). */
const normSrc = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (v != null && typeof v === "object" && "src" in v)
    return normSrc((v as { src: unknown }).src);
  return "";
};

export const useConfigurationContext = () => {
  const [config] = useStore<ConfigurationContextValue>(
    CONFIGURATION_STORE_KEY,
    defaultConfiguration,
  );
  // Merge with defaults so that missing fields in stored config
  // fall back to default values (e.g. when new settings are added).
  // Also normalise logo/favicon fields that may be stored as {src,...} objects
  // from an older save format.
  return useMemo(() => {
    const merged = { ...defaultConfiguration, ...config };
    merged.lightModeLogo = normSrc(merged.lightModeLogo) || defaultConfiguration.lightModeLogo;
    merged.darkModeLogo  = normSrc(merged.darkModeLogo)  || defaultConfiguration.darkModeLogo;
    merged.favicon       = normSrc(merged.favicon);
    return merged;
  }, [config]);
};

export const useConfigurationUpdater = () => {
  const [, setConfig] = useStore<ConfigurationContextValue>(
    CONFIGURATION_STORE_KEY,
  );
  return setConfig;
};
