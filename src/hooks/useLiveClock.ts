import { useState, useEffect } from "react";
import { DateTime } from "luxon";

export function useLiveClock() {
  const [now, setNow] = useState(() => DateTime.now());

  useEffect(() => {
    // Update every second, always computing from real time
    const interval = setInterval(() => {
      setNow(DateTime.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return now;
}
