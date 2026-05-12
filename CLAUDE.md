# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 로컬 서버 실행

빌드 도구 없음. 정적 파일이므로 Python으로 바로 서빙한다.

```bash
cd tetris
python3 -m http.server 8765
# → http://localhost:8765
```

로직 검증은 Node.js로 직접 실행 가능하다 (Canvas API 미사용 함수만):

```bash
node --input-type=module << 'EOF'
# newBoard / valid / rotate / clearLines 등 순수 함수 테스트
EOF
```

BGM 재생성 (bgm.wav 덮어쓰기):

```bash
python3 << 'EOF'
import wave, math, array
# ... 신호 생성 코드
EOF
```

## 아키텍처

### 페이지 구조

| 파일 | 역할 |
|---|---|
| `index.html` | Material Design 3 소개/랜딩 페이지. 라이브 미니 프리뷰 캔버스 포함. |
| `game.html` | 실제 테트리스 게임. `index.html`의 "플레이" 버튼이 이 파일로 연결됨. |
| `bgm.wav` | Python `wave` 표준 라이브러리로 생성한 칩튠 BGM (Tetris A 테마, 3회 반복). |

### game.html 내부 구조

게임 루프가 두 개의 독립 타이머로 분리되어 있다.

- **`requestAnimationFrame(draw)`** — 렌더링 전용. 게임 상태를 바꾸지 않고 `board`, `piece`, `nextPiece`를 읽어 그리기만 한다.
- **`setInterval(drop, dropInterval)`** — 게임 로직 전용. 낙하·배치·라인 클리어·레벨업을 처리한다.

레벨업 시 `dropInterval`이 변경되면 기존 interval을 `clearInterval`로 교체한다 (`drop()` 내부).

### 핵심 데이터 모델

```
board: (string | null)[][]   // ROWS×COLS, null = 빈 칸, string = 색상 hex
piece: { shape: number[][], color: string, x: number, y: number }
```

`shape`는 `0/1` 2D 배열. `rotate(shape)`는 clockwise 90도 변환을 반환한다 (transpose → reverse each row).

`valid(b, p, ox, oy, shape)` — 오프셋과 대체 shape를 넘길 수 있어 이동 검증, 회전 검증, 고스트 블록 계산을 모두 처리한다.

### 테마 시스템

`game.html`은 `<html data-theme="dark|light">`로 전환. CSS 변수(`--bg`, `--panel-bg` 등)로 색상 토큰화. 그리드 색상만 캔버스에서 `getComputedStyle`로 읽어 적용한다.

`index.html`은 별도 CSS 변수 네임스페이스(MD3: `--md-primary` 등)를 사용하며 다크/라이트 전환 기능 없음.

### 점수 계산

```
LINE_SCORES = [0, 100, 300, 500, 800]   // 동시 클리어 줄 수 기준
score += LINE_SCORES[n] * level
level = floor(lines / 10) + 1
dropInterval = max(100, 1000 - (level-1) * 100)  // ms, 최소 100ms
```

### index.html 미니 프리뷰

랜딩 페이지 Hero의 캔버스는 실제 게임과 독립된 자체 루프(`requestAnimationFrame`)로 동작한다. 블록 크기 18px, 보드 상태를 직접 조작해 30프레임마다 자동 낙하 시뮬레이션을 보여준다.
