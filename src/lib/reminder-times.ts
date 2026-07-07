export const TIME_OPTIONS = [
	"Morning",
	"Afternoon",
	"Evening",
	"Night",
] as const;

export type TimePreference = (typeof TIME_OPTIONS)[number];

export const DEFAULT_REMINDER_TIMES: Record<TimePreference, string> = {
	Morning: "08:00",
	Afternoon: "12:00",
	Evening: "17:00",
	Night: "21:00",
};

export const REMINDER_TIME_OPTIONS = [
	{ value: "06:00", label: "6:00 AM" },
	{ value: "07:00", label: "7:00 AM" },
	{ value: "08:00", label: "8:00 AM" },
	{ value: "09:00", label: "9:00 AM" },
	{ value: "10:00", label: "10:00 AM" },
	{ value: "11:00", label: "11:00 AM" },
	{ value: "12:00", label: "12:00 PM" },
	{ value: "13:00", label: "1:00 PM" },
	{ value: "14:00", label: "2:00 PM" },
	{ value: "15:00", label: "3:00 PM" },
	{ value: "16:00", label: "4:00 PM" },
	{ value: "17:00", label: "5:00 PM" },
	{ value: "18:00", label: "6:00 PM" },
	{ value: "19:00", label: "7:00 PM" },
	{ value: "20:00", label: "8:00 PM" },
	{ value: "21:00", label: "9:00 PM" },
];

/**
 * Convert an `<input type="time">` value ("HH:mm") to the API's TimeOnly
 * format ("HH:mm:ss"). Already-seconded values pass through unchanged.
 */
export function toApiTime(value: string): string {
	const parts = value.split(":");
	if (parts.length >= 3) return value;
	const [hours = "00", minutes = "00"] = parts;
	return `${hours}:${minutes}:00`;
}

/**
 * Convert the API's TimeOnly format ("HH:mm:ss") to an `<input type="time">`
 * value ("HH:mm").
 */
export function fromApiTime(value: string): string {
	const [hours = "00", minutes = "00"] = value.split(":");
	return `${hours}:${minutes}`;
}
