import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function LikeButton({ compositionId }: { compositionId: string }) {
  const { user } = useAuth()
  const [count, setCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      const { count: total } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('composition_id', compositionId)

      if (user) {
        const { data } = await supabase
          .from('likes')
          .select('id')
          .eq('composition_id', compositionId)
          .eq('user_id', user.id)
          .maybeSingle()
        if (active) setLiked(!!data)
      } else if (active) {
        setLiked(false)
      }

      if (active) setCount(total ?? 0)
    }

    void load()
    return () => {
      active = false
    }
  }, [compositionId, user])

  async function toggleLike() {
    if (!user) {
      window.location.href = '/login'
      return
    }
    setBusy(true)
    try {
      if (liked) {
        await supabase
          .from('likes')
          .delete()
          .eq('composition_id', compositionId)
          .eq('user_id', user.id)
        setLiked(false)
        setCount((c) => Math.max(0, c - 1))
      } else {
        await supabase.from('likes').insert({ composition_id: compositionId, user_id: user.id })
        setLiked(true)
        setCount((c) => c + 1)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={() => void toggleLike()}
      disabled={busy}
      className={`flex items-center gap-1.5 text-sm font-medium transition ${
        liked ? 'text-clay' : 'text-ink/50 hover:text-ink'
      }`}
    >
      <span>{liked ? '♥' : '♡'}</span>
      <span>{count}</span>
    </button>
  )
}
