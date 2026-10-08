const Loader = ({
  text = "Loading...",
  fullPage = false,
  small = false,
}) => {
  const className = [
    "loader",
    fullPage
      ? "loader-full-page"
      : "",
    small
      ? "loader-small"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div className="loader-spinner" />

      {text && (
        <p className="loader-text">
          {text}
        </p>
      )}
    </div>
  );
};

export default Loader;