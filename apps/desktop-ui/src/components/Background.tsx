import { palette } from '../utils/palette'

const patternContent = Array.from({ length: 100 })
  .map((_) => 'I')
  .join('')

export const Background = () => {
  return (
    <>
      <div
        data-slot="background-container"
        style={{ backgroundColor: palette.backgroundMain }}
      ></div>
      <div
        data-slot="background-container"
        className="ai-font left-12 mx-[-8rem] text-center break-words"
        style={{
          width: 'calc(100% + 16rem)',
          fontSize: '32rem',
          letterSpacing: '-3rem',
          lineHeight: '24.5rem',
          color: 'transparent',
          background: `linear-gradient(160deg, ${palette.gradientColorPrimary}, ${palette.gradientColorSecondary}) text`,
          opacity: 0.1,
        }}
      >
        {patternContent}
      </div>
    </>
  )
}
