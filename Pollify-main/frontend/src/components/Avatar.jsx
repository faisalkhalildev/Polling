import { useEffect, useState } from "react";

const initialsFor = (name) =>
  (name || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const Avatar = ({ src, name, className = "" }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return <img src={src} alt={name || "Profile"} className={className} onError={() => setFailed(true)} />;
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-primary-100 font-display font-semibold text-primary-700 ${className}`}
      aria-label={`${name || "User"} profile image`}
    >
      {initialsFor(name)}
    </span>
  );
};

export default Avatar;
