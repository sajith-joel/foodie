const GlassCard = ({ children, className = '', blur = 'md', opacity = 20 }) => {
  const blurMap = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  const opacityMap = {
    10: 'bg-white/10',
    20: 'bg-white/20',
    30: 'bg-white/30',
    40: 'bg-white/40',
    50: 'bg-white/50',
  };

  return (
    <div
      className={`
        ${opacityMap[opacity] || 'bg-white/20'}
        ${blurMap[blur] || 'backdrop-blur-md'}
        border border-white/30
        shadow-xl
        rounded-xl
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;