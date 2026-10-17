# Habit Challenge Tracker

선택한 3번 시안을 구현한 모바일 우선 반응형 웹앱입니다. 왼쪽 날짜 목록, 오른쪽 숙어 입력과 세 상태 버튼, 상단 7일 진행 상황을 유지합니다.

- 기간: 2026-10-17 ~ 2026-10-23, 7일 고정
- 완료: 숙어 2개를 사용해 ChatGPT와 영어 대화 한 차례
- 최소 수행: 숙어 1개로 대화 한 차례. 진행률과 연속 수행에서 하루로 인정
- 오늘만 기록·수정, 과거는 열람만, 미래와 챌린지 기간 밖 기록 차단
- 숙어와 상태를 localStorage에 자동 저장. 다른 기기·다른 브라우저와 동기화되지 않음
- 입력한 숙어가 기준보다 적어지면 기존 완료 상태를 해제하고 새 상태 선택을 기다림
- Streak: 오늘이 아직 미기록이면 어제까지 이어진 일수, 오늘을 미완료로 기록하면 0일. 종료 후에는 마지막 챌린지 날짜까지의 연속 수행 일수
- 초기화는 확인창에서 승인해야 실행. 챌린지 설정은 그대로 유지

## 실행

Node.js 22.18 이상 (검증 환경: Node.js 24)을 권장합니다.

```sh
npm ci
npm run dev -- --host 0.0.0.0 --port 4173
```

## 검증 및 빌드

```sh
node --test tests/habit-model.test.ts
npm run check:runtime
npm run build
npm run test:sites
```

`dist/client`가 정적 사이트 출력입니다. Vercel 설정은 `vercel.json`에 포함되어 있습니다. GitHub main 브랜치를 Vercel과 연결해 공개 배포합니다.

- GitHub: https://github.com/hajink-1004/english-idiom-tracker
- 공개 앱: https://english-idiom-tracker.vercel.app/

## 검사용 코드

개발 환경에서만 `qa-width`와 `qa-time` 쿼리로 화면 폭과 시각을 재현합니다. 검사용 시계도 경과 시간에 따라 흐릅니다. 프로덕션 빌드에서는 해당 쿼리가 무시되며 실제 기기 날짜를 사용합니다. 기본 실행 주소에는 QA 쿼리가 없습니다.

## 런타임

사용자의 명시적 요청에 따라 템플릿의 가상 휴대폰·OS 장식을 제거하고 브라우저의 실제 입력창과 키보드를 사용합니다. 기존 템플릿의 사용하지 않는 런타임 소스·자산은 향후 유지보수를 위해 보존했으며 화면에는 표시하지 않습니다.
