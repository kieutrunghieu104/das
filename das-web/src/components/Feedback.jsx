import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function Feedback({ error, message, durationMs = 6000, onClear }) {
  const contentKey = useMemo(() => `${error || ""}|${message || ""}`, [error, message]);
  const [visible, setVisible] = useState(Boolean(error || message));
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!error && !message) {
      setVisible(false);
      return undefined;
    }

    setVisible(true);
    setAnimationKey((current) => current + 1);

    const timer = window.setTimeout(() => {
      setVisible(false);
      onClear?.();
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [contentKey, durationMs]);

  if ((!error && !message) || !visible) return null;

  function closeFeedback() {
    setVisible(false);
    onClear?.();
  }

  return (
    <div className="feedback-stack" aria-live="polite" aria-atomic="true" style={{ "--feedback-duration": `${durationMs}ms` }}>
      {error && (
        <div className="alert error feedback-alert" role="alert" key={`error-${animationKey}`}>
          <span>{error}</span>
          <button className="feedback-close" type="button" onClick={closeFeedback} title="Đóng thông báo">
            <X size={16} />
          </button>
          <span className="feedback-progress" aria-hidden="true" />
        </div>
      )}
      {message && (
        <div className="alert success feedback-alert" role="status" key={`message-${animationKey}`}>
          <span>{message}</span>
          <button className="feedback-close" type="button" onClick={closeFeedback} title="Đóng thông báo">
            <X size={16} />
          </button>
          <span className="feedback-progress" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
