import type { HomeAssistant } from "custom-card-helpers";

export interface FormatterContext {
  locale: string;
  timeZone?: string;
}

export const getFormatterContext = (hass?: HomeAssistant): FormatterContext => {
  const locale = hass?.locale?.language ?? "en-US";
  const localeInfo = hass?.locale as { time_zone?: string } | undefined;
  let timeZone = localeInfo?.time_zone;

  if (timeZone === "server") {
    timeZone = hass?.config?.time_zone;
  }
  if (!timeZone || timeZone === "local" || timeZone === "system") {
    timeZone = undefined;
  }

  return { locale, timeZone };
};

export const formatNumber = (
  value: number,
  hass?: HomeAssistant,
  options?: Intl.NumberFormatOptions
): string =>
  new Intl.NumberFormat(hass?.locale?.language ?? "en-US", {
    maximumFractionDigits: 2,
    ...options,
  }).format(value);

export const formatDatePart = (
  date: Date,
  options: Intl.DateTimeFormatOptions,
  hass?: HomeAssistant
): string => {
  const { locale, timeZone } = getFormatterContext(hass);
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
};
