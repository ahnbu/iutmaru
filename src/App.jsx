import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function Intro() {
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
        <p className="note">이름 없이도 남기실 수 있습니다</p>
      </div>
    </>
  )
}

function VoiceBox() {
  const [opinions, setOpinions] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const { data, error } = await supabase
      .from('opinions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setOpinions(data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    setError('')
    const { error } = await supabase.from('opinions').insert({
      title: title.trim(),
      content: content.trim(),
      author: author.trim() || null,
      category: category || null,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setTitle('')
    setContent('')
    setAuthor('')
    setCategory('')
    load()
  }

  return (
    <section id="voicebox">
      <h2>목소리함</h2>

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
        <input
          type="text"
          placeholder="이름 (선택)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">카테고리를 고르세요</option>
          <option value="도로·보행">도로·보행</option>
          <option value="쓰레기·환경">쓰레기·환경</option>
          <option value="소음">소음</option>
          <option value="공원·놀이터">공원·놀이터</option>
        </select>
        <button type="submit" disabled={saving}>
          {saving ? '남기는 중…' : '남기기'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="vb-list">
        {opinions.length === 0 ? (
          <p className="empty">아직 남겨진 목소리가 없습니다.</p>
        ) : (
          opinions.map((o) => (
            <article className="vb-item" key={o.id}>
              <h3>{o.title}</h3>
              <p className="body">{o.content}</p>
              <div className="meta">
                <span className={`badge ${o.status}`}>{o.status}</span>
                {o.category && <span>{o.category}</span>}
                <span>{o.author || '익명'}</span>
                <span>{new Date(o.created_at).toLocaleString('ko-KR')}</span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

export default function App() {
  return (
    <div className="wrap">
      <Intro />
      <VoiceBox />
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
