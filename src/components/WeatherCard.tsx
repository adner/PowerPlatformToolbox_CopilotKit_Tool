import React from "react";

export interface WeatherToolResult {
    temperature: string;
    conditions: string;
    humidity: string;
    windSpeed: string;
    feelsLike: string;
}

const stripUnits = (value: string): string => value.replace(/[^0-9.-]/g, "");

const getGradient = (conditions: string): string => {
    const c = conditions.toLowerCase();
    if (c.includes("clear") || c.includes("sunny")) return "linear-gradient(135deg, #facc15, #fb923c, #f87171)";
    if (c.includes("rain") || c.includes("storm")) return "linear-gradient(135deg, #60a5fa, #3b82f6, #7c3aed)";
    if (c.includes("snow")) return "linear-gradient(135deg, #bfdbfe, #ffffff, #93c5fd)";
    if (c.includes("cloud")) return "linear-gradient(135deg, #9ca3af, #6b7280, #60a5fa)";
    return "linear-gradient(135deg, #60a5fa, #3b82f6, #7c3aed)";
};

const SunIcon = () => (
    <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="20" fill="#FCD34D" />
        <g stroke="#FCD34D" strokeWidth="3" strokeLinecap="round">
            <line x1="50" y1="5" x2="50" y2="15" />
            <line x1="50" y1="85" x2="50" y2="95" />
            <line x1="5" y1="50" x2="15" y2="50" />
            <line x1="85" y1="50" x2="95" y2="50" />
            <line x1="20" y1="20" x2="27" y2="27" />
            <line x1="73" y1="73" x2="80" y2="80" />
            <line x1="80" y1="20" x2="73" y2="27" />
            <line x1="27" y1="73" x2="20" y2="80" />
        </g>
    </svg>
);

const RainIcon = () => (
    <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
        <path d="M30 40Q20 40 20 30 20 15 35 15 45 5 60 5 80 5 80 25 95 25 95 35 95 50 80 50L30 50" fill="#94A3B8" />
        <g stroke="#3B82F6" strokeWidth="2" strokeLinecap="round">
            <line x1="35" y1="55" x2="30" y2="70" className="weather-rain-drop" style={{ animationDelay: "0s" }} />
            <line x1="50" y1="55" x2="45" y2="70" className="weather-rain-drop" style={{ animationDelay: "0.2s" }} />
            <line x1="65" y1="55" x2="60" y2="70" className="weather-rain-drop" style={{ animationDelay: "0.4s" }} />
        </g>
    </svg>
);

const CloudIcon = () => (
    <svg width="100" height="100" viewBox="0 0 100 80" fill="none">
        <circle cx="38" cy="38" r="22" fill="#CBD5E1" />
        <circle cx="60" cy="32" r="26" fill="#CBD5E1" />
        <circle cx="78" cy="44" r="18" fill="#CBD5E1" />
        <circle cx="22" cy="48" r="16" fill="#CBD5E1" />
        <rect x="10" y="44" width="82" height="22" rx="11" fill="#CBD5E1" />
        <circle cx="38" cy="38" r="22" fill="url(#cloudShine)" opacity="0.45" />
        <circle cx="60" cy="32" r="26" fill="url(#cloudShine)" opacity="0.35" />
        <defs>
            <linearGradient id="cloudShine" x1="30" y1="10" x2="65" y2="60">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#94A3B8" stopOpacity="0" />
            </linearGradient>
        </defs>
    </svg>
);

const SnowIcon = () => (
    <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
        <path d="M25 35Q15 35 15 25 15 10 30 10 40-5 55-5 75-5 75 15 90 15 90 25 90 40 75 40L25 40" fill="#B0C4DE" />
        <circle cx="30" cy="60" r="3" fill="#E0F2FE" />
        <circle cx="50" cy="68" r="3" fill="#E0F2FE" />
        <circle cx="70" cy="60" r="3" fill="#E0F2FE" />
    </svg>
);

function getWeatherIcon(conditions: string) {
    const c = conditions.toLowerCase();
    if (c.includes("clear") || c.includes("sunny")) return <SunIcon />;
    if (c.includes("rain") || c.includes("storm")) return <RainIcon />;
    if (c.includes("snow")) return <SnowIcon />;
    return <CloudIcon />;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="weather-stat">
            <div className="weather-stat-icon">{icon}</div>
            <div className="weather-stat-label">{label}</div>
            <div className="weather-stat-value">{value}</div>
        </div>
    );
}

interface WeatherCardProps {
    result?: WeatherToolResult;
    isLoading?: boolean;
    location?: string;
}

export function WeatherCard({ result, isLoading, location }: WeatherCardProps) {
    const temperature = result ? stripUnits(result.temperature) : "--";
    const conditions = result?.conditions || "Loading...";
    const humidity = result?.humidity || "--";
    const windSpeed = result?.windSpeed || "--";
    const feelsLike = result?.feelsLike || "--";

    return (
        <div className="weather-card" style={{ background: getGradient(conditions) }}>
            <div className="weather-card-overlay" />
            <div className="weather-card-content">
                {isLoading ? (
                    <div className="weather-loading">
                        <div className="weather-loading-circle" />
                        <span>Loading weather...</span>
                    </div>
                ) : (
                    <>
                        <div className="weather-card-header">
                            {location && <div className="weather-card-location">{location}</div>}
                            <div className="weather-card-title">Current Weather</div>
                            <div className="weather-card-conditions">{conditions}</div>
                        </div>
                        <div className="weather-main">
                            <div className="weather-icon">{getWeatherIcon(conditions)}</div>
                            <div className="weather-temp-group">
                                <span className="weather-temp">{temperature}</span>
                                <span className="weather-temp-unit">&deg;C</span>
                            </div>
                        </div>
                        <div className="weather-stats">
                            <StatCard icon={<DropletIcon />} label="Humidity" value={stripUnits(humidity)} />
                            <StatCard icon={<WindIcon />} label="Wind" value={stripUnits(windSpeed)} />
                            <StatCard icon={<ThermIcon />} label="Feels Like" value={stripUnits(feelsLike)} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const DropletIcon = () => (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2c-1.1 0-2 .9-2 2v6h4V4c0-1.1-.9-2-2-2zm0 10c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z" />
    </svg>
);

const WindIcon = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const ThermIcon = () => (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2c-1.1 0-2 .9-2 2v9c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-2.2 1.8-4 4-4s4 1.8 4 4v9c0 1.1.9 2 2 2s2-.9 2-2V4c0-2.2-1.8-4-4-4z" />
    </svg>
);
