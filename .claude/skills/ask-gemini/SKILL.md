---
name: ask-gemini
description: |
  Bash 툴로 Gemini CLI를 실행해 Gemini AI에게 질문하거나 작업을 위임하는 스킬.
  사용자가 "제미나이한테 물어봐줘", "젬마이로 분석해줘", "Gemini CLI로 실행해줘",
  "심층 분석해줘", "웹 조사해줘", "Gemini Pro로 추론해줘", "멀티턴 대화해줘",
  "세션 이어서 해줘", "Gemini한테 시켜봐" 같은 말을 할 때 반드시 이 스킬을 사용할 것.
  깊은 추론·심층 분석·대용량 컨텍스트가 필요할 때, 또는 웹 조사가 필요할 때 적극 활용할 것.
---

# Gemini CLI 위임 스킬

Claude Code가 Bash 툴로 Gemini CLI를 호출해 질문/작업을 Gemini에게 위임하는 스킬.
단일 질문(1회성)과 멀티턴 대화(세션 이어가기) 모두 지원한다.

---

## 기본 실행 명령어 패턴

```bash
echo y | GOOGLE_GENAI_USE_GCA=true gemini --skip-trust -y -m <모델ID> -p '<프롬프트>' 2>&1
```

| 플래그 | 의미 |
|--------|------|
| `echo y \|` | 브라우저 열기 확인 프롬프트 자동 응답 |
| `GOOGLE_GENAI_USE_GCA=true` | Google 계정 인증 사용 (무료 티어) |
| `--skip-trust` | 현재 디렉토리 신뢰 확인 건너뜀 (비대화형 실행 필수) |
| `-y` / `--yolo` | 도구 실행 자동 승인 |
| `-m` / `--model` | 사용할 모델 지정 |
| `-p` / `--prompt` | 비대화형(headless) 모드로 프롬프트 실행 |
| `--resume <ID\|latest>` | 이전 세션 이어서 멀티턴 대화 |

---

## 모델 선택 가이드

작업 성격에 따라 아래 기준으로 모델을 선택한다.

### 깊은 추론 / 심층 분석 / 복잡한 문제 해결
```
모델: gemini-2.5-pro
```
- 복잡한 논리 추론, 수학/코드 분석, 전략 기획
- 긴 문서 요약 및 다각도 분석
- 여러 관점을 통합한 심층 결론 도출

```bash
echo y | GOOGLE_GENAI_USE_GCA=true gemini --skip-trust -y -m gemini-2.5-pro -p '<분석 프롬프트>' 2>&1
```

### 최신 모델 / 최고 성능 필요 시
```
모델: gemini-3.1-pro-preview  (현재 최신 Pro)
```
- 가장 최신 Gemini Pro 모델
- 최고 수준의 추론·창작·코딩 능력

```bash
echo y | GOOGLE_GENAI_USE_GCA=true gemini --skip-trust -y -m gemini-3.1-pro-preview -p '<프롬프트>' 2>&1
```

### 웹 조사 / 최신 정보 검색 / 정보 수집
```
모델: gemini-2.5-flash  (Google Search 도구 내장 활용)
```
- 실시간 웹 검색이 필요한 경우
- 최신 뉴스, 동향, 가격, 경쟁사 조사
- 속도와 정확도 균형이 좋음

```bash
echo y | GOOGLE_GENAI_USE_GCA=true gemini --skip-trust -y -m gemini-2.5-flash -p '<조사 프롬프트>' 2>&1
```

### 빠른 질문 / 간단한 작업 / 기본값
```
모델: 생략 시 gemini-3-flash-preview 자동 사용
```
- 간단한 질문, 번역, 요약, 가벼운 코드 작성
- 응답 속도 최우선

```bash
echo y | GOOGLE_GENAI_USE_GCA=true gemini --skip-trust -y -p '<프롬프트>' 2>&1
```

### 전체 모델 목록 (2025년 기준)
| 모델 ID | 특성 |
|---------|------|
| `gemini-3.1-pro-preview` | 최신 Pro, 최고 성능 |
| `gemini-3.1-flash-lite-preview` | 최신 경량, 초고속 |
| `gemini-3-pro-preview` | Pro급 추론 |
| `gemini-3-flash-preview` | 기본값, 균형 |
| `gemini-2.5-pro` | 안정적 Pro, 심층 추론 |
| `gemini-2.5-flash` | 균형형, 웹조사 적합 |
| `gemini-2.5-flash-lite` | 경량, 단순 작업 |

---

## Step 1: 단일 질문 (1회성)

모델 선택 → 프롬프트 작성 → Bash 툴로 실행 → 결과 사용자에게 전달.

**Timeout 설정:** 복잡한 질문은 `timeout: 60000` 이상 설정할 것.

### 예시: 심층 분석
```bash
echo y | GOOGLE_GENAI_USE_GCA=true gemini --skip-trust -y -m gemini-2.5-pro \
  -p '다음 마케팅 전략의 장단점을 깊이 분석해줘: [내용]' 2>&1
```

### 예시: 웹 조사
```bash
echo y | GOOGLE_GENAI_USE_GCA=true gemini --skip-trust -y -m gemini-2.5-flash \
  -p '2025년 인스타그램 알고리즘 최신 변화와 마케팅 대응 전략을 조사해줘' 2>&1
```

---

## Step 2: 멀티턴 대화 (세션 이어가기)

### 세션 목록 확인
```bash
echo y | GOOGLE_GENAI_USE_GCA=true gemini --skip-trust --list-sessions 2>&1
```
출력 예시:
```
Available sessions for this project (3):
  1. 안녕? 넌 누구야? ... (5 minutes ago) [abc123-세션ID]
  2. 클로드랑 비교하면 ... (3 minutes ago) [def456-세션ID]
```

### 최근 세션 이어가기
```bash
echo y | GOOGLE_GENAI_USE_GCA=true gemini --skip-trust -y -m <모델ID> \
  --resume latest -p '<이어서 할 프롬프트>' 2>&1
```

### 특정 세션 이어가기 (세션 ID 사용)
```bash
echo y | GOOGLE_GENAI_USE_GCA=true gemini --skip-trust -y -m <모델ID> \
  --resume <세션UUID> -p '<이어서 할 프롬프트>' 2>&1
```

### 멀티턴 대화 예시 (3턴)

**1턴:**
```bash
echo y | GOOGLE_GENAI_USE_GCA=true gemini --skip-trust -y -m gemini-2.5-pro \
  -p '요리학원 온라인 마케팅 전략을 세워줘. 현재 키워드광고 위주이고 바이럴이 약함.' 2>&1
```

**세션 ID 확인:**
```bash
echo y | GOOGLE_GENAI_USE_GCA=true gemini --skip-trust --list-sessions 2>&1
```

**2턴 (세션 이어가기):**
```bash
echo y | GOOGLE_GENAI_USE_GCA=true gemini --skip-trust -y -m gemini-2.5-pro \
  --resume latest -p '그 중에서 인스타그램 바이럴 전략을 더 구체적으로 설명해줘' 2>&1
```

**3턴:**
```bash
echo y | GOOGLE_GENAI_USE_GCA=true gemini --skip-trust -y -m gemini-2.5-pro \
  --resume latest -p '인스타 릴스 콘텐츠 아이디어 5개만 뽑아줘' 2>&1
```

---

## Step 3: 결과 전달

Gemini의 응답을 사용자에게 정리해서 전달한다.
- 어떤 모델을 사용했는지 명시
- 멀티턴인 경우 몇 번째 턴인지 표시
- 세션 ID가 필요한 경우 사용자에게 안내

---

## 주의사항

- `--skip-trust` 없이 실행하면 비대화형 모드에서 오류 발생
- `echo y |` 없이 실행하면 인증 확인에서 멈춤
- `-p` 플래그 없이 실행하면 대화형 모드로 진입해 Bash 툴이 블록됨
- `--resume` 은 같은 디렉토리에서 실행된 세션만 불러올 수 있음
- 프롬프트에 작은따옴표(`'`) 가 포함되면 큰따옴표(`"`)로 감싸거나 이스케이프 처리
- Timeout은 복잡한 작업일수록 넉넉하게 설정 (기본 30000ms, 심층 분석은 60000ms 이상)
- 무료 티어(GCA) 기준 일일 쿼터 제한 있음 — 과도한 반복 호출 자제
