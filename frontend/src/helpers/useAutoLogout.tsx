import { useEffect, useRef } from "react";

export const useAutoLogout = (
  logout: () => void,
  inactivity_time: number
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    const startTimer = () => {
   
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        const now = Date.now();
        const inactiveFor = now - lastActivityRef.current;

        console.log(
          `⏱️ Inactive for ${inactiveFor} ms (limit ${inactivity_time})`
        );
console.log(inactiveFor+"/"+inactiveFor)
        if (inactiveFor >= inactiveFor) {
          console.log(inactiveFor)
          console.log(inactivity_time)
          console.log("🔴 Inactivity limit reached → Auto logout");
          logout();
        }
      }, inactivity_time);
    };

    const resetTimer = (event?: Event) => {

   
      lastActivityRef.current = Date.now();

      if (event?.type === "mousemove") {
        console.log("🖱️ Mouse moved → Activity detected");
      } else if (event) {
        console.log(`⌨️ ${event.type} detected → Activity detected`);
      } else {
        console.log("🟢 Screen opened → Timer started");
      }

      startTimer();
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    events.forEach(event =>
      window.addEventListener(event, resetTimer)
    );

    // start timer on screen load
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      events.forEach(event =>
        window.removeEventListener(event, resetTimer)
      );

      console.log("⚪ Auto logout listener removed");
    };
  }, [logout, inactivity_time]);
};
