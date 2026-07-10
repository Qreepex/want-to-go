const countryDisplayNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

export function countryName(code: string): string {
  return countryDisplayNames?.of(code.toUpperCase()) ?? code;
}