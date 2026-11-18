import { formatLong, formatShort } from '../lib/dates'
import { tapeColor } from '../lib/image'

const SIZES = {
  xs: 'w-20 p-1 pb-4',
  sm: 'w-28 p-1.5 pb-6',
  md: 'w-full p-2.5 pb-12 sm:p-3 sm:pb-14',
  lg: 'w-full max-w-md p-4 pb-20',
}

export default function Polaroid({ photo, onClick, size = 'md', straight = false, className = '' }) {
  const src = size === 'lg' ? photo.url ?? photo.thumbUrl : photo.thumbUrl ?? photo.url
  const showText = size === 'md' || size === 'lg'
  return (
    <figure
      onClick={onClick}
      style={{ '--tilt': straight ? '0deg' : `${photo.tilt ?? 0}deg` }}
      className={`relative rotate-[var(--tilt)] bg-white shadow-[0_14px_30px_-12px_rgba(76,29,149,0.35)] ring-1 ring-violet-100/80 transition duration-300 ${
        onClick ? 'cursor-pointer hover:z-10 hover:rotate-0 hover:scale-[1.04] hover:shadow-[0_24px_50px_-16px_rgba(76,29,149,0.45)]' : ''
      } ${SIZES[size]} ${className}`}
    >
      {showText && (
        <span className={`absolute -top-3 left-1/2 h-6 w-[38%] -translate-x-1/2 -rotate-2 shadow-sm ${tapeColor(photo.id)}`} />
      )}
      {src ? (
        <img
          src={src}
          alt={photo.caption || 'Nossa foto'}
          className="aspect-square w-full bg-violet-50 object-cover"
          loading="lazy"
          draggable={false}
        />
      ) : (
        <div className="shimmer aspect-square w-full" />
      )}
      {showText && (
        <figcaption className="absolute inset-x-3 bottom-1.5 text-center font-hand leading-none text-violet-900 sm:bottom-2">
          <span className={`block truncate ${size === 'lg' ? 'text-3xl' : 'text-xl sm:text-2xl'}`}>{photo.caption || ' '}</span>
          {photo.date && (
            <span className={`block text-violet-400 ${size === 'lg' ? 'text-lg' : 'text-sm sm:text-base'}`}>
              {size === 'lg' ? formatLong(photo.date) : formatShort(photo.date)}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  )
}
