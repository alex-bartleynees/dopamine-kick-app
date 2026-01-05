export const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Get today's date in YYYY-MM-DD format using the user's timezone
 */
export function getTodayDate(): string {
	return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(
		new Date(),
	);
}

/**
 * Check if a date string matches today's date in the user's timezone
 */
export function isToday(dateString: string | null | undefined): boolean {
	if (!dateString) return false;
	return dateString === getTodayDate();
}
