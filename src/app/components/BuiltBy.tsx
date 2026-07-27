export function BuiltBy() {
  return (
    <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>
      Built by{' '}
      <a
        href="https://harshitaverma.framer.website"
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-dotted underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2 rounded transition-colors"
      >
        Harshita Verma
      </a>
    </p>
  );
}
