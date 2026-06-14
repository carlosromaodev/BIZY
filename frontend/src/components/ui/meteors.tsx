import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface MeteorsProps {
  number?: number;
  minDelay?: number;
  maxDelay?: number;
  minDuration?: number;
  maxDuration?: number;
  angle?: number;
  className?: string;
}

export function Meteors({
  number = 20,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 2,
  maxDuration = 10,
  angle = 215,
  className,
}: MeteorsProps) {
  const [styles, setStyles] = useState<CSSProperties[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: number }, () => ({
      top: "-5%",
      left: `${Math.floor(Math.random() * 100)}%`,
      animationDelay: `${Math.random() * (maxDelay - minDelay) + minDelay}s`,
      animationDuration: `${Math.floor(Math.random() * (maxDuration - minDuration) + minDuration)}s`,
    }));
    setStyles(generated);
  }, [number, minDelay, maxDelay, minDuration, maxDuration]);

  return (
    <>
      {styles.map((style, idx) => (
        <span
          key={idx}
          className={cn("bizy-meteor", className)}
          style={{ ...style, "--meteor-angle": `${-angle}deg` } as CSSProperties}
        >
          <span className="bizy-meteor-tail" />
        </span>
      ))}
    </>
  );
}
