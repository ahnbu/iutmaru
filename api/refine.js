const MODEL = 'gemini-3.5-flash-lite'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST만 됩니다' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY가 없습니다' })
    return
  }

  const { text, categories } = req.body ?? {}
  if (!text || !text.trim()) {
    res.status(400).json({ error: '내용이 비어 있습니다' })
    return
  }

  const list = Array.isArray(categories) && categories.length ? categories : ['기타']

  const prompt = `너는 동네 주민이 짧게 쓴 제보를 제대로 된 민원글로 다듬는 도우미다.

아래 내용을 바탕으로 JSON만 출력해라. 설명·코드블록 없이 JSON 하나만.

{"title":"20자 이내 제목","content":"3~5문장 본문","category":"아래 목록 중 하나"}

카테고리 목록: ${list.join(', ')}

규칙
- 사실을 지어내지 마라. 원문에 없는 날짜·수치·장소를 넣지 마라.
- 존댓말로 쓴다.
- 본문은 무엇이 · 어디서 · 왜 문제인지가 드러나게 한다.

원문: ${text.trim()}`

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    )

    if (!r.ok) {
      const detail = await r.text()
      res.status(502).json({ error: 'AI 호출 실패', detail: detail.slice(0, 500) })
      return
    }

    const data = await r.json()
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      res.status(502).json({ error: 'AI 응답을 읽지 못했습니다', raw: raw.slice(0, 300) })
      return
    }
    res.status(200).json(parsed)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
