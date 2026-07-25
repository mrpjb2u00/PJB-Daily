import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getLocalTodayDateString } from '@/utils/date';

interface CalendarContextValue {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<string>(
    getLocalTodayDateString()
  );
  return (
    <CalendarContext.Provider value={{ selectedDate, setSelectedDate }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendarContext() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendarContext must be used within CalendarProvider');
  return ctx;
}
