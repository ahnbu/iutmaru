import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function Intro({ signedIn }) {
  return (
    <>
      <header>
        <div className="brand">
          <img src="/icons/icon-192.png" alt="이웃마루 아이콘" />
          <h1>이웃마루</h1>
        </div>
        <div className="bar"></div>
        <p className="lead">동네의 불편을 모아 전하고, 이웃을 잇습니다</p>
      </header>

      <section className="greeting">
        <h2>인사말</h2>
        <p>
          길이 파였는데 어디에 말해야 할지 몰라 그냥 지나친 적, 있으시죠. 이웃마루는 그런 이야기를
          모아 구청과 주민센터에 전합니다.
        </p>
        <p>
          혼자 말하면 넘어가지만, 모여서 말하면 달라집니다. 그래서 우리는 한 사람의 이야기를
          모두의 이야기로 만듭니다.
        </p>
      </section>

      <section>
        <h2>하는 일</h2>
        <div className="works">
          <div className="work">
            <div className="n">1</div>
            <div>
              <strong>생활 불편 모으기</strong>
              <span>동네에서 겪은 불편을 주민에게서 직접 받습니다.</span>
            </div>
          </div>
          <div className="work">
            <div className="n">2</div>
            <div>
              <strong>기관에 전달하기</strong>
              <span>모인 이야기를 정리해 구청·주민센터에 전달하고, 결과를 다시 알려드립니다.</span>
            </div>
          </div>
          <div className="work">
            <div className="n">3</div>
            <div>
              <strong>주민 모임 잇기</strong>
              <span>같은 문제를 겪는 이웃끼리 만나는 자리를 만듭니다.</span>
            </div>
          </div>
        </div>
      </section>

      <div className="cta">
        <a href="#voicebox">제보하기</a>
        <p className="note">
          {signedIn ? '아래 칸에 남겨주세요' : '남기시려면 로그인이 필요합니다'}
        </p>
      </div>
    </>
  )
}

const ADMIN_EMAIL = 'byungwook.an@gmail.com'

function AdminCategories({ categories, reload }) {
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')

  async function add(e) {
    e.preventDefault()
    if (!name.trim()) return
    const { error } = await supabase.from('categories').insert({ name: name.trim() })
    setMsg(error ? error.message : '')
    setName('')
    reload()
  }

  async function remove(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    setMsg(error ? error.message : '')
    reload()
  }

  return (
    <div className="admin-box">
      <h3>카테고리 관리 (관리자)</h3>
      <form className="admin-add" onSubmit={add}>
        <input
          type="text"
          placeholder="새 카테고리"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">추가</button>
      </form>
      <ul className="admin-cats">
        {categories.map((c) => (
          <li key={c.id}>
            {c.name}
            <button type="button" onClick={() => remove(c.id)}>
              삭제
            </button>
          </li>
        ))}
      </ul>
      {msg && <p className="error">{msg}</p>}
    </div>
  )
}

function VoiceBox({ session }) {
  const [opinions, setOpinions] = useState([])
  const [categories, setCategories] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [photo, setPhoto] = useState(null)
  const [saving, setSaving] = useState(false)
  const [refining, setRefining] = useState(false)
  const [error, setError] = useState('')

  const user = session?.user ?? null
  const myName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || ''
  const isAdmin = user?.email === ADMIN_EMAIL

  async function load() {
    const { data, error } = await supabase
      .from('opinions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setOpinions(data ?? [])
  }

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('created_at')
    setCategories(data ?? [])
  }

  async function changeStatus(id, status) {
    const { error } = await supabase.from('opinions').update({ status }).eq('id', id)
    if (error) setError(error.message)
    else load()
  }

  useEffect(() => {
    load()
    loadCategories()
  }, [])

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  async function handleRefine() {
    const seed = content.trim() || title.trim()
    if (!seed) {
      setError('먼저 하고 싶은 말을 한 줄이라도 적어주세요.')
      return
    }
    setRefining(true)
    setError('')
    try {
      const r = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: seed, categories: categories.map((c) => c.name) }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || 'AI 다듬기에 실패했습니다.')
      } else {
        if (data.title) setTitle(data.title)
        if (data.content) setContent(data.content)
        if (data.category && categories.some((c) => c.name === data.category)) {
          setCategory(data.category)
        }
      }
    } catch (e) {
      setError(e.message)
    }
    setRefining(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    setError('')

    let photoUrl = null
    if (photo) {
      const ext = photo.name.split('.').pop()
      const path = `${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from('photos').upload(path, photo)
      if (upErr) {
        setSaving(false)
        setError(upErr.message)
        return
      }
      photoUrl = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
    }

    const { error } = await supabase.from('opinions').insert({
      title: title.trim(),
      content: content.trim(),
      author: myName || null,
      category: category || null,
      photo_url: photoUrl,
      user_id: user.id,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setTitle('')
    setContent('')
    setCategory('')
    setPhoto(null)
    load()
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('opinions').delete().eq('id', id)
    if (error) setError(error.message)
    else load()
  }

  return (
    <section id="voicebox">
      <h2>목소리함</h2>

      {user ? (
        <form className="vb-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            rows="4"
            placeholder="어떤 일이 있었나요?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">카테고리를 고르세요</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
          <button type="button" className="refine" onClick={handleRefine} disabled={refining}>
            {refining ? 'AI가 다듬는 중…' : '✨ AI로 다듬기'}
          </button>
          <button type="submit" disabled={saving}>
            {saving ? '남기는 중…' : '남기기'}
          </button>
        </form>
      ) : (
        <div className="signin-box">
          <p>글을 남기려면 로그인이 필요합니다.</p>
          <button type="button" onClick={signIn}>
            구글로 로그인
          </button>
          <p className="note">읽는 것은 로그인 없이도 됩니다.</p>
        </div>
      )}

      {isAdmin && <AdminCategories categories={categories} reload={loadCategories} />}

      {error && <p className="error">{error}</p>}

      <div className="vb-list">
        {opinions.length === 0 ? (
          <p className="empty">아직 남겨진 목소리가 없습니다.</p>
        ) : (
          opinions.map((o) => (
            <article className="vb-item" key={o.id}>
              <h3>{o.title}</h3>
              <p className="body">{o.content}</p>
              {o.photo_url && <img src={o.photo_url} alt="" />}
              <div className="meta">
                {isAdmin ? (
                  <select
                    className="status-sel"
                    value={o.status}
                    onChange={(e) => changeStatus(o.id, e.target.value)}
                  >
                    <option value="접수">접수</option>
                    <option value="처리중">처리중</option>
                    <option value="완료">완료</option>
                  </select>
                ) : (
                  <span className={`badge ${o.status}`}>{o.status}</span>
                )}
                {o.category && <span>{o.category}</span>}
                <span>{o.author || '익명'}</span>
                <span>{new Date(o.created_at).toLocaleString('ko-KR')}</span>
                {user && (o.user_id === user.id || isAdmin) && (
                  <button type="button" className="del" onClick={() => handleDelete(o.id)}>
                    삭제
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

export default function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const user = session?.user ?? null
  const myName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || ''

  return (
    <div className="wrap">
      {user && (
        <div className="userbar">
          <span>{myName} 님</span>
          <button type="button" onClick={() => supabase.auth.signOut()}>
            로그아웃
          </button>
        </div>
      )}
      <Intro signedIn={!!user} />
      <VoiceBox session={session} />
      <footer>
        <dl>
          <dt>연락처</dt>
          <dd>준비 중</dd>
          <dt>찾아오는 길</dt>
          <dd>준비 중</dd>
        </dl>
      </footer>
    </div>
  )
}
