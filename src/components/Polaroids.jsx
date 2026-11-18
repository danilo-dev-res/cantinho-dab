import { useState } from 'react'
import Modal from './Modal'
import Polaroid from './Polaroid'
import { compressImage, randomTilt } from '../lib/image'
import { todayISO } from '../lib/dates'

export default function Polaroids({ photos }) {
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(null)

  async function upload(files) {
    setBusy(true)
    for (const file of files) {
      const src = await compressImage(file)
      await photos.save({ src, caption: '', date: todayISO(), tilt: randomTilt(), createdAt: Date.now() })
    }
    setBusy(false)
  }

  const list = [...photos.items].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))

  return (
    <section>
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <h2 className="font-display text-4xl font-bold text-violet-900">Nosso mural</h2>
        <p className="max-w-md text-violet-600">
          Cada foto vira uma polaroid. Toque nela para escrever uma legenda e a data.
        </p>
        <label className="btn cursor-pointer">
          {busy ? 'Revelando fotos… 📸' : '📸 Adicionar fotos'}
          <input type="file" accept="image/*" multiple hidden disabled={busy} onChange={(e) => upload([...e.target.files])} />
        </label>
      </div>

      {list.length === 0 ? (
        <div className="card mx-auto max-w-md p-10 text-center text-violet-500">
          <p className="text-5xl">🖼️</p>
          <p className="mt-3">O mural está esperando a primeira foto de vocês.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 px-1 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => (
            <Polaroid key={p.id} photo={p} onClick={() => setOpen(p)} />
          ))}
        </div>
      )}

      <PhotoModal
        photo={open}
        onClose={() => setOpen(null)}
        onSave={async (p) => {
          await photos.save(p)
          setOpen(null)
        }}
        onDelete={async (id) => {
          if (confirm('Apagar esta foto?')) {
            await photos.remove(id)
            setOpen(null)
          }
        }}
      />
    </section>
  )
}

function PhotoModal({ photo, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(photo)
  const [last, setLast] = useState(photo)
  if (photo !== last) {
    setLast(photo)
    setForm(photo)
  }
  if (!form) return null
  return (
    <Modal open onClose={onClose} title="Nossa foto">
      <div className="flex justify-center py-2">
        <Polaroid photo={form} size="lg" straight />
      </div>
      <div className="mt-4 space-y-3">
        <input
          className="input font-hand text-2xl"
          value={form.caption}
          onChange={(e) => setForm({ ...form, caption: e.target.value })}
          placeholder="Escreva uma legenda…"
        />
        <input
          type="date"
          className="input"
          value={form.date ?? ''}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <div className="flex gap-2">
          <button className="btn-ghost text-red-600 hover:bg-red-50" onClick={() => onDelete(form.id)}>Apagar</button>
          <button className="btn flex-1" onClick={() => onSave(form)}>Salvar</button>
        </div>
      </div>
    </Modal>
  )
}
