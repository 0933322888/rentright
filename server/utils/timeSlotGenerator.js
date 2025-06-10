/**
 * Generates an array of 30-minute time slots between start and end times
 * @param {string} startTime - Start time in 24-hour format (HH:mm)
 * @param {string} endTime - End time in 24-hour format (HH:mm)
 * @returns {Array<{startTime: string, endTime: string, isBooked: boolean}>} Array of time slots
 */
export const generateTimeSlots = (startTime, endTime) => {
  // Convert times to minutes for easier calculation
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  const timeSlots = [];
  
  // Generate slots until we reach or exceed the end time
  while (startTotalMinutes < endTotalMinutes) {
    const slotEndMinutes = Math.min(startTotalMinutes + 30, endTotalMinutes);
    
    // Convert back to HH:mm format
    const slotStartHour = Math.floor(startTotalMinutes / 60);
    const slotStartMinute = startTotalMinutes % 60;
    const slotEndHour = Math.floor(slotEndMinutes / 60);
    const slotEndMinute = slotEndMinutes % 60;
    
    const startTimeStr = `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMinute).padStart(2, '0')}`;
    const endTimeStr = `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMinute).padStart(2, '0')}`;
    
    timeSlots.push({
      startTime: startTimeStr,
      endTime: endTimeStr,
      isBooked: false
    });
    
    startTotalMinutes = slotEndMinutes;
  }
  
  return timeSlots;
};

/**
 * Validates if a time string is in correct 24-hour format (HH:mm)
 * @param {string} time - Time string to validate
 * @returns {boolean} Whether the time string is valid
 */
export const isValidTimeFormat = (time) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Validates if end time is after start time
 * @param {string} startTime - Start time in 24-hour format (HH:mm)
 * @param {string} endTime - End time in 24-hour format (HH:mm)
 * @returns {boolean} Whether the time range is valid
 */
export const isValidTimeRange = (startTime, endTime) => {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return false;
  }
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  return endTotalMinutes > startTotalMinutes;
};

/**
 * Generates time slots for a viewing date
 * @param {string} startTime - Start time in 24-hour format (HH:mm)
 * @param {string} endTime - End time in 24-hour format (HH:mm)
 * @returns {Array<{startTime: string, endTime: string, isBooked: boolean}>} Array of time slots
 * @throws {Error} If time format is invalid or time range is invalid
 */
export const generateViewingTimeSlots = (startTime, endTime) => {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    throw new Error('Invalid time format. Please use 24-hour format (HH:mm)');
  }
  
  if (!isValidTimeRange(startTime, endTime)) {
    throw new Error('End time must be after start time');
  }
  
  return generateTimeSlots(startTime, endTime);
}; 