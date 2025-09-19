/**
 * Clamp a number between a minimum and maximum value
 * @param value - The number to be clamped
 * @param min - The minimum number
 * @param max - The maximum number
 * @returns - A number clamped between the min and max values
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}
