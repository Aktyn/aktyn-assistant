const patternContent = Array.from({ length: 100 })
  .map((_) => 'I')
  .join('')

export const Background = () => {
  return (
    <>
      <div data-slot="background-container" className="bg-background" />
      <div
        data-slot="background-container"
        className="bg-linear-160 from-gradient-secondary via-transparent to-gradient-primary opacity-5"
      />
      <div
        data-slot="background-container"
        className="ai-font left-12 mx-[-8rem] text-center break-words animate-in fade-in duration-view ease-out"
        style={{
          width: 'calc(100% + 16rem)',
          fontSize: '32rem',
          letterSpacing: '-3rem',
          lineHeight: '24.5rem',
          opacity: 0.5,
          color: '#fff',
          maskImage: 'linear-gradient(to bottom, #0007 0%, #000 100%)',
          mixBlendMode: 'overlay',
        }}
      >
        {patternContent}
      </div>
    </>
  )
}
