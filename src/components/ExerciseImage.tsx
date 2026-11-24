import type { Exercise } from '../db'
import { Icon } from './Icon'

const BASE = import.meta.env.BASE_URL

interface Props {
  ex?: Exercise | null
  size?: 'full' | 'thumb'
}

/** Exercise picture. Two photos (start/end position) cross-fade to show the movement. */
export function ExerciseImage({ ex, size = 'full' }: Props) {
  const imgs = ex?.images ?? []
  if (!imgs.length)
    return (
      <div className={`ex-img ${size} placeholder`}>
        <Icon name="dumbbell" size={size === 'thumb' ? 22 : 48} />
      </div>
    )
  const animate = size === 'full' && imgs.length > 1
  return (
    <div className={`ex-img ${size} ${animate ? 'anim' : ''}`}>
      <img src={BASE + imgs[0]} alt={ex?.name ?? ''} decoding="async" />
      {animate && <img className="frame2" src={BASE + imgs[1]} alt="" decoding="async" />}
    </div>
  )
}
