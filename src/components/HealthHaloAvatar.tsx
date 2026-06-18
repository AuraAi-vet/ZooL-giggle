import { useEffect, useState } from 'react';

interface HealthHaloAvatarProps {
  imageUrl: string;
  petName: string;
  healthScore: number;
  className?: string;
}

export default function HealthHaloAvatar({ imageUrl, petName, healthScore, className = "" }: HealthHaloAvatarProps) {
  const [offset, setOffset] = useState(0);

  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    const progressOffset = circumference - (healthScore / 100) * circumference;
    setTimeout(() => setOffset(progressOffset), 100);
  }, [healthScore, circumference]);

  const ringColor = healthScore > 80 ? '#3B82F6' : healthScore > 50 ? '#6366f1' : '#64748b';

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg className="absolute -rotate-90" width={size} height={size}>
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      {/* Pet Avatar */}
      <img src={imageUrl} alt={petName} className="w-[90px] h-[90px] rounded-full object-cover" />
    </div>
  );
}
