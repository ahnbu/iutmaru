## 디자인 규칙

- 단체명: 이웃마루
- 한 줄 소개: 동네의 불편을 모아 전하고, 주민 모임을 잇습니다
- 아이콘: icons/icon-192.png
- 주색: #E8623A
- 보조색: #8C8079
- 배경색: #FFF7F2
- 글자색: #2A2320
- 느낌: 따뜻하고 편안한, 어르신도 읽기 쉬운 큰 글씨

## 테이블 구조

### opinions (의견)
- id (uuid, PK), title, content, author, photo_url
- status (접수/처리중/완료, 기본 접수), category, created_at
- user_id (uuid → auth.users) — 로그인한 사람이 쓴 글의 주인

### categories (카테고리)
- id (uuid, PK), name (unique), created_at

### 저장소
- photos 버킷 (공개) — 제보 사진

## 권한 (RLS)
- 읽기: 누구나
- 쓰기: 로그인한 사람만
- 삭제: 내 글이거나 관리자
- 상태 변경 / 카테고리 추가·삭제: 관리자만
- 관리자 판정: is_admin() — 이메일 하드코딩

## 키 위치
- .env — VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- 버셀 Environment Variables에 같은 이름으로 등록 (Production)
- .env는 .gitignore에 있어 깃허브에 안 올라간다
