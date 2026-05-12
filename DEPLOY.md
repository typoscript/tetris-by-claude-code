# DEPLOY.md — GitHub Pages 배포 가이드

이 문서는 Tetris 프로젝트를 GitHub Pages로 배포하는 방법을 설명합니다.

---

## 현재 저장소 구조

이 프로젝트는 모노레포 안에 있습니다.

```
kosa-vibecoding-2026-1st/          ← GitHub 저장소 루트
└── src/exercise/typoscript/day02/
    └── tetris/
        ├── index.html             ← 소개 페이지 (랜딩)
        ├── game.html              ← 게임 본체
        ├── bgm.wav                ← 배경음악
        ├── CLAUDE.md
        └── DEPLOY.md
```

GitHub Pages는 저장소 루트 또는 `/docs` 폴더, 혹은 별도 브랜치를 기준으로 서빙합니다.  
서브디렉토리가 깊기 때문에 **방법 A (gh-pages 브랜치)** 를 권장합니다.

---

## 방법 A: gh-pages 브랜치로 배포 (권장)

tetris 폴더만 루트로 올려서 `https://<계정>.github.io/<저장소명>/` 에 배포합니다.

### 1단계 — gh-pages 브랜치 생성 및 파일 올리기

```bash
# 저장소 루트로 이동
cd /path/to/kosa-vibecoding-2026-1st

# orphan 브랜치 생성 (히스토리 없는 독립 브랜치)
git checkout --orphan gh-pages

# 기존 스테이징 초기화
git rm -rf .

# tetris 파일만 루트로 복사
cp -r src/exercise/typoscript/day02/tetris/* .

# bgm.wav는 용량이 크므로 .gitattributes로 LFS 설정하거나 제외 가능
# 제외하려면: echo "bgm.wav" >> .gitignore

# 커밋 & 푸시
git add index.html game.html bgm.wav CLAUDE.md DEPLOY.md
git commit -m "deploy: tetris to gh-pages"
git push origin gh-pages

# 다시 main으로 복귀
git checkout main
```

### 2단계 — GitHub 저장소 설정

1. GitHub에서 저장소(`kosa-vibecoding-2026-1st`) → **Settings** → **Pages**
2. **Source**: `Deploy from a branch`
3. **Branch**: `gh-pages` / `/ (root)` 선택
4. **Save** 클릭

### 3단계 — 배포 URL 확인

```
https://weable-kosa.github.io/kosa-vibecoding-2026-1st/
```

> Settings → Pages 상단에 URL이 표시됩니다. 첫 배포 후 1~3분 소요됩니다.

---

## 방법 B: GitHub Actions로 자동 배포

push할 때마다 자동으로 최신 상태를 배포합니다.

### `.github/workflows/deploy-tetris.yml` 생성

저장소 루트에 아래 파일을 만듭니다.

```yaml
name: Deploy Tetris to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'src/exercise/typoscript/day02/tetris/**'

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to gh-pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./src/exercise/typoscript/day02/tetris
          publish_branch: gh-pages
```

`main` 브랜치의 `tetris/` 경로에 변경이 생길 때만 배포가 트리거됩니다.

---

## 방법 C: /docs 폴더 사용 (가장 간단)

저장소 루트에 `docs/` 폴더를 만들고 파일을 복사한 뒤, GitHub Pages 소스를 `main` 브랜치의 `/docs`로 설정합니다.

```bash
mkdir -p docs
cp src/exercise/typoscript/day02/tetris/{index.html,game.html,bgm.wav} docs/
git add docs/
git commit -m "deploy: copy tetris to docs/"
git push origin main
```

GitHub → Settings → Pages → Branch: `main` / Folder: `/docs` → Save

배포 URL:
```
https://weable-kosa.github.io/kosa-vibecoding-2026-1st/
```

---

## bgm.wav 용량 주의

`bgm.wav`는 약 **2.9 MB**입니다. GitHub Pages는 파일당 100 MB까지 허용하므로 문제없지만,  
저장소 전체 용량을 줄이려면 배포 시 제외하고 Web Audio API로 대체할 수 있습니다.

```bash
# gh-pages 브랜치에서 wav 제외하고 배포하는 경우
echo "bgm.wav" > .gitignore
```

`game.html`에서 `<audio>` 태그를 제거하고 Web Audio API 합성 음악으로 교체하면  
외부 파일 없이 완전히 자립적인 배포가 가능합니다.

---

## 배포 후 동작 확인 체크리스트

- [ ] `index.html` 소개 페이지 로드
- [ ] "지금 플레이" 버튼 → `game.html` 이동
- [ ] START 버튼 클릭 시 블록 생성
- [ ] 키보드 조작 (← → ↑ ↓ Space)
- [ ] 🔊 버튼 → BGM 재생 (브라우저 자동재생 정책상 첫 클릭 필요)
- [ ] 🌙/☀️ 버튼 → 다크/라이트 모드 전환
- [ ] 게임 오버 및 RESTART
