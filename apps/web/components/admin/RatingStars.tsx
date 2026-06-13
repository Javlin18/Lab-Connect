import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  className?: string;
}

export function RatingStars({ rating, size = "md", showNumber = false, className }: RatingStarsProps) {
  const iconSize = size === "sm" ? 12 : size === "lg" ? 20 : 16;
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-xl" : "text-sm";

  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={iconSize}
          className={cn(star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-300 text-gray-300")}
        />
      ))}
      {showNumber && (
        <span className={cn("ml-1 font-bold tabular-nums", textSize,
          rating >= 4 ? "text-green-600" : rating >= 3 ? "text-orange-500" : "text-red-500"
        )}>
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
}
