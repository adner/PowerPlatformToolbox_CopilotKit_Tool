import { useState, useEffect } from "react";

function getTimeInTimezone(date: Date, timezone: string) {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";

    return {
        hours: parseInt(getPart("hour"), 10),
        minutes: parseInt(getPart("minute"), 10),
        seconds: parseInt(getPart("second"), 10),
        period: getPart("dayPeriod").toUpperCase(),
    };
}

export function TimeCard({
    result,
    status,
    timezone = "Europe/Stockholm",
}: {
    result?: string;
    status: "inProgress" | "executing" | "complete";
    timezone?: string;
}) {
    const isLoading = status !== "complete" || !result;
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        if (!result) return;
        setCurrentTime(new Date());
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, [result]);

    let timeDisplay = "";
    let dateDisplay = "";
    let period = "";
    let timeParts = { hours: 0, minutes: 0, seconds: 0, period: "" };

    if (currentTime) {
        timeParts = getTimeInTimezone(currentTime, timezone);
        period = timeParts.period;
        timeDisplay = `${timeParts.hours}:${timeParts.minutes.toString().padStart(2, "0")}:${timeParts.seconds.toString().padStart(2, "0")}`;
        dateDisplay = currentTime.toLocaleDateString("en-US", {
            timeZone: timezone,
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    return (
        <div className="time-card">
            <div className="time-card-inner">
                {/* Decorative blurs */}
                <div className="time-card-deco time-card-deco-top" />
                <div className="time-card-deco time-card-deco-bottom" />

                {/* Header */}
                <div className="time-card-header">
                    {isLoading ? (
                        <span className="time-card-fetching">
                            <span className="time-card-ping" />
                            Fetching time...
                        </span>
                    ) : (
                        <div />
                    )}
                    <ClockIcon isLoading={isLoading} timeParts={timeParts} />
                </div>

                {/* Time */}
                <div className="time-card-time-row">
                    {isLoading ? (
                        <div className="time-card-shimmer time-card-shimmer-lg" />
                    ) : (
                        <div className="time-card-time-display">
                            <span className="time-card-time">{timeDisplay}</span>
                            {period && <span className="time-card-period">{period}</span>}
                        </div>
                    )}
                </div>

                {/* Date */}
                <div className="time-card-date-row">
                    {isLoading ? (
                        <div className="time-card-shimmer time-card-shimmer-md" />
                    ) : (
                        <div className="time-card-date-pill">
                            <CalendarIcon />
                            <span>{dateDisplay}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="time-card-footer">
                    <div className="time-card-tz">
                        <GlobeIcon />
                        <span>{isLoading ? "..." : timezone}</span>
                    </div>
                    {!isLoading && (
                        <div className="time-card-live">
                            <span className="time-card-ping green" />
                            <span>Live</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ClockIcon({
    isLoading,
    timeParts,
}: {
    isLoading: boolean;
    timeParts: { hours: number; minutes: number; seconds: number; period: string };
}) {
    const hours12 = timeParts.hours === 12 ? 0 : timeParts.hours;
    const hourRotation = hours12 * 30 + timeParts.minutes * 0.5;
    const minuteRotation = timeParts.minutes * 6 + timeParts.seconds * 0.1;
    const secondRotation = timeParts.seconds * 6;

    return (
        <div className={`time-clock-icon${isLoading ? " pulse" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
                <defs>
                    <linearGradient id="clock-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e94560" />
                        <stop offset="100%" stopColor="#0f3460" />
                    </linearGradient>
                </defs>
                <circle cx="12" cy="12" r="10" fill="none" stroke="url(#clock-gradient)" strokeWidth="2" />
                <circle cx="12" cy="12" r="8" fill="rgba(255,255,255,0.05)" />
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
                    <line
                        key={i}
                        x1="12" y1="4" x2="12" y2={i % 3 === 0 ? "5.5" : "5"}
                        stroke={i % 3 === 0 ? "#e94560" : "rgba(255,255,255,0.3)"}
                        strokeWidth={i % 3 === 0 ? "1.5" : "1"}
                        strokeLinecap="round"
                        transform={`rotate(${angle} 12 12)`}
                    />
                ))}
                <circle cx="12" cy="12" r="1.5" fill="#e94560" />
                <line x1="12" y1="12" x2="12" y2="7" stroke="white" strokeWidth="2" strokeLinecap="round"
                    style={{ transformOrigin: "12px 12px", transform: `rotate(${hourRotation}deg)`, transition: "transform 0.3s ease-out" }} />
                <line x1="12" y1="12" x2="12" y2="5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round"
                    style={{ transformOrigin: "12px 12px", transform: `rotate(${minuteRotation}deg)`, transition: "transform 0.3s ease-out" }} />
                {!isLoading && (
                    <line x1="12" y1="12" x2="12" y2="4" stroke="#e94560" strokeWidth="1" strokeLinecap="round"
                        style={{ transformOrigin: "12px 12px", transform: `rotate(${secondRotation}deg)`, transition: "transform 0.1s linear" }} />
                )}
            </svg>
        </div>
    );
}

function CalendarIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

function GlobeIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    );
}
