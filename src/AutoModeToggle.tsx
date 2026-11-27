export function AutoModeToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <label
      className={`cc-auto-mode ${enabled ? 'is-on' : ''}`}
      title="Applies to new runs. Aria chooses an approach, approves its plan, and executes automatically."
    >
      <input
        type="checkbox"
        role="switch"
        checked={enabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="cc-auto-track" aria-hidden="true">
        <i />
      </span>
      <span>Auto mode</span>
    </label>
  );
}
