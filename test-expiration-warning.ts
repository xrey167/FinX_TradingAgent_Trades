/**
 * Test script to verify date expiration warning functionality
 * This tests the checkDateExpiration() method in EventCalendar
 */

import { EventCalendar } from './src/tools/seasonal-patterns/event-calendar.ts';

console.log('Testing EventCalendar date expiration warning...\n');

// Create an instance of EventCalendar
// This should trigger the checkDateExpiration() method in the constructor
const calendar = new EventCalendar();

console.log('\n✓ EventCalendar initialized successfully');
console.log('If dates expire within 6 months, a warning should have been logged above.');
