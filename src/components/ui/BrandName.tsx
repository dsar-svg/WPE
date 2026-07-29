export function BrandName({ className = '', theme }: { className?: string; theme?: 'light' | 'dark' }) {
  const wallaceColor = theme === 'dark' ? 'text-white' : theme === 'light' ? 'text-dark' : '';
  return (
    <span className={`font-display tracking-wider ${className}`}>
      <span className={wallaceColor}>Wallace</span>{' '}
      <span className="text-primary-vibrant">Panda</span>{' '}
      <span className="text-secondary-vibrant">Express</span>
    </span>
  );
}
