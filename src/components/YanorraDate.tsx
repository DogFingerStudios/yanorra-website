export interface YanorranDate 
{
    year: number;   // AC year, starting at 1
    month: number;  // 1-12
    day: number;    // 1-based day within Yanorran month
}

const QAMAR_TABLE_ROW_NAMES =
[
    "Nandi",
    "Samari",
    "Kotlega",
    "Irosha",
    "Cassia",
    "Lynn",
    "Nedma",
    "Shirif",
    "Soleil",
];

// epoch of the Axial Count in Earth date is October 16, 1607.
const AXIAL_EPOCH = 
{
    year: 1607,
    month: 10,
    day: 16,
};

// Yanorran month lengths. You can rename these later in your UI.
// Month 1, Day 1 = Veyrath 1, AC 1.
const YANORRAN_MONTH_LENGTHS = 
[
    31, 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31,
];

const EARTH_MONTH_LENGTHS = 
[
    31, 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31,
];

function isEarthLeapYear(year: number): boolean 
{
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function validateEarthDate(year: number, month: number, day: number): void 
{
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) 
    {
        throw new Error("Earth date must use integer year, month, and day values.");
    }

    if (month < 1 || month > 12) 
    {
        throw new Error("Earth month must be between 1 and 12.");
    }

    let maxDay = EARTH_MONTH_LENGTHS[month - 1];

    if (month === 2 && isEarthLeapYear(year)) 
    {
        maxDay = 29;
    }

    if (day < 1 || day > maxDay) 
    {
        throw new Error(`Invalid Earth date: ${year}-${month}-${day}.`);
    }
}

// Day-of-year using a 365-day year.
// Feb 29 intentionally maps to the same day-of-year as Feb 28.
function earthDayOfYearIgnoringLeapDay(month: number, day: number): number 
{
    let dayOfYear = 0;

    for (let m = 1; m < month; m++) 
    {
        dayOfYear += EARTH_MONTH_LENGTHS[m - 1];
    }

    // Collapse Feb 29 onto Feb 28.
    if (month === 2 && day === 29) 
    {
        day = 28;
    }

    dayOfYear += day;

    return dayOfYear; // 1-365
}

function daysSinceAxialEpoch(year: number, month: number, day: number): number 
{
    const epochDayOfYear = earthDayOfYearIgnoringLeapDay(
        AXIAL_EPOCH.month,
        AXIAL_EPOCH.day
    );

    const targetDayOfYear = earthDayOfYearIgnoringLeapDay(month, day);

    const yearDifference = year - AXIAL_EPOCH.year;

    return (yearDifference * 365) + (targetDayOfYear - epochDayOfYear);
}

export function earthToYanorranDate(
    earthYear: number,
    earthMonth: number,
    earthDay: number
): YanorranDate 
{
    validateEarthDate(earthYear, earthMonth, earthDay);

    const totalDays = daysSinceAxialEpoch(earthYear, earthMonth, earthDay);

    if (totalDays < 0) 
    {
        throw new Error("Earth date is before the beginning of the Axial Count.");
    }

    const yanorranYear = Math.floor(totalDays / 365) + 1;
    let dayOfYanorranYear = (totalDays % 365) + 1; // 1-365

    let yanorranMonth = 1;

    for (const monthLength of YANORRAN_MONTH_LENGTHS) 
    {
        if (dayOfYanorranYear <= monthLength) 
        {
            break;
        }

        dayOfYanorranYear -= monthLength;
        yanorranMonth++;
    }

    return {
        year: yanorranYear,
        month: yanorranMonth,
        day: dayOfYanorranYear,
    };
}

export function yanorranDateToString(date: YanorranDate): string
{
    const monthName = QAMAR_TABLE_ROW_NAMES[(date.month - 1) % QAMAR_TABLE_ROW_NAMES.length];
    return `AC${date.year}/${monthName}/${date.day}`;
}

export function currentYanorraDate(): string
{
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const yanorranDate = earthToYanorranDate(year, month, day);
    return yanorranDateToString(yanorranDate);
}