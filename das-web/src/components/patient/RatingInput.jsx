export default function RatingInput({ value, onChange }) {
  return (
    <input
      type="number"
      min="1"
      max="5"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
