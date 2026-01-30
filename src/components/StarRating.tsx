interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
}

export function StarRating({ rating, onChange, readonly = false }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          className={`text-2xl transition-transform ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          }`}
        >
          {star <= rating ? (
            <span className="text-amber-500">★</span>
          ) : (
            <span className="text-stone-300">☆</span>
          )}
        </button>
      ))}
    </div>
  );
}
