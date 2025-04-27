import { palette } from '../utils/palette'
import './Background.css'

const patternContent = Array.from({ length: 100 })
  .map((_) => 'I')
  .join('')

export const Background = () => {
  return (
    <>
      <div
        className="background-container"
        style={{ backgroundColor: palette.backgroundMain }}
      ></div>
      <div
        className="ai-font left-12 background-container mx-[-8rem] text-center break-words"
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
