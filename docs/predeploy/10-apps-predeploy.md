# 앱 10개 배포 전 작업 결과

코드와 배포용 파일을 준비해 GitHub의 `codex/predeploy-2026-11-06` 브랜치에 올렸습니다. 실제 Cloudflare 배포는 실행하지 않았으며 `main` 병합도 하지 않았습니다.

검증: 단위 테스트 **637개**, 언어·화면·테마·시간대 조합과 주요 기능 **1,757건**, Cloudflare 로컬 런타임 **10개 앱**, 최신 커밋의 GitHub Actions **10개 모두 통과**.

| 앱 / 코드 | 단위 테스트 | 브라우저 검사 | 원격 검증 | 커밋 |
|---|---:|---:|---|---|
| [quickbill](https://github.com/sangsangbaksa-dev/quickbill/tree/codex/predeploy-2026-11-06) | 196 | 240 | [통과](https://github.com/sangsangbaksa-dev/quickbill/actions/runs/42157601530) | `4ddc95b` |
| [stampbook](https://github.com/sangsangbaksa-dev/stampbook/tree/codex/predeploy-2026-11-06) | 94 | 240 | [통과](https://github.com/sangsangbaksa-dev/stampbook/actions/runs/42157602077) | `083ab55` |
| [stayline](https://github.com/sangsangbaksa-dev/stayline/tree/codex/predeploy-2026-11-06) | 78 | 240 | [통과](https://github.com/sangsangbaksa-dev/stayline/actions/runs/42157607335) | `829accb` |
| [marginlog](https://github.com/sangsangbaksa-dev/marginlog/tree/codex/predeploy-2026-11-06) | 33 | 240 | [통과](https://github.com/sangsangbaksa-dev/marginlog/actions/runs/42157605348) | `4b04463` |
| [lendnest](https://github.com/sangsangbaksa-dev/lendnest/tree/codex/predeploy-2026-11-06) | 57 | 240 | [통과](https://github.com/sangsangbaksa-dev/lendnest/actions/runs/42157605022) | `0f930cb` |
| [quotanest](https://github.com/sangsangbaksa-dev/quotanest/tree/codex/predeploy-2026-11-06) | 24 | 241 | [통과](https://github.com/sangsangbaksa-dev/quotanest/actions/runs/42157608882) | `d60423f` |
| [shadepad](https://github.com/sangsangbaksa-dev/shadepad/tree/codex/predeploy-2026-11-06) | 30 | 241 | [통과](https://github.com/sangsangbaksa-dev/shadepad/actions/runs/42157601611) | `42f05e2` |
| [App8](https://github.com/sangsangbaksa-dev/App8/tree/codex/predeploy-2026-11-06) | 43 | 25 | [통과](https://github.com/sangsangbaksa-dev/App8/actions/runs/42157604364) | `78d1a1f` |
| [App9](https://github.com/sangsangbaksa-dev/App9/tree/codex/predeploy-2026-11-06) | 52 | 25 | [통과](https://github.com/sangsangbaksa-dev/App9/actions/runs/42157607241) | `99fa1fd` |
| [App10](https://github.com/sangsangbaksa-dev/App10/tree/codex/predeploy-2026-11-06) | 30 | 25 | [통과](https://github.com/sangsangbaksa-dev/App10/actions/runs/42157608167) | `5635389` |

## 주요 변경

- **quickbill**: 배포 폴더에 문서·GitHub 설정 등이 들어가던 문제를 공개 파일 허용 목록으로 수정했습니다. 작은 화면의 상단 메뉴 넘침을 고쳤고, 결제·로컬 계정 테스트를 현재 설정과 분리했습니다.
- **stampbook**: 모바일에서 로고 글자가 숨겨질 때 링크 이름이 사라지던 접근성 문제를 수정했습니다. 주간 일정 테스트가 다른 일정 섹션까지 선택하던 문제를 바로잡았습니다.
- **stayline**: 테마 검사를 HTTP에서 실행하도록 정리하고, 라이선스가 있는 테스트 데이터를 명시했습니다. 배포 폴더·함수·브라우저 검사와 404 처리를 준비했습니다.
- **marginlog**: 사이트 주소를 app/config.js에서 읽도록 바꿨습니다. 사진 테스트가 실행 시각에 따라 미래 날짜를 입력하던 문제와 오래된 CTA 개수 가정을 고쳤습니다.
- **lendnest**: 실행 날짜가 바뀌면 실패하던 단위 테스트와 중복 선택자를 수정했습니다. 클립보드 완료 알림은 비동기 처리를 기다린 뒤 검사합니다. 오프라인 상태에서 서비스워커의 백그라운드 갱신 실패가 처리되지 않던 문제를 고쳤습니다.
- **quotanest**: 언어를 바꾸면 JSON 가져오기 입력창이 사라지던 문제를 수정했습니다. 인라인 스타일을 CSS로 옮겨 CSP 차단을 없앴고, 입력 레이블을 연결했습니다. 실제 JSON 가져오기 회귀 검사를 추가했습니다.
- **shadepad**: 운영 CSP를 적용한 브라우저 검사, 민감정보 숨김·복원 및 암호화 백업 왕복 검사를 추가했습니다. Cloudflare 함수가 포함된 독립 배포 파일을 만들 수 있게 했습니다.
- **App8**: 명시적인 공개 파일 목록으로 dist를 생성하는 빌드, 보안 헤더, 404 페이지와 아이콘을 추가했습니다. 프로젝트 생성·복제·백업·복원 흐름을 검증합니다.
- **App9**: 월말·윤년 갱신일이 저장과 재실행을 거치면서 밀리던 문제를 원래 기준일 보존으로 수정했습니다. 예산이 0인 백업도 예산 해제를 복원하며, 구독이 없는 예산 백업도 가져옵니다. 삭제 버튼·오류 안내·다크 모드 추정 배지의 대비를 높이고, 다크 모드 삭제 버튼의 호버 글자색도 보완했습니다. 배포 구성을 추가했습니다.
- **App10**: 배포 폴더, 보안 헤더, 404 페이지와 아이콘을 추가했습니다. 테마 초기화 코드를 외부 파일로 옮겨 인라인 스크립트 허용 없이 동작하게 했습니다. 프롬프트 생성·변수 채우기·복사·이력·복제를 검증합니다.

## 검증 범위

- 브라우저: 지원 언어(기존 7개 앱은 en/ko/ja/zh/es, App8·9·10은 ko), 360/390/768/1280px, light/dark, 서울·뉴욕·오클랜드 시간대. 운영 CSP를 적용해 콘솔 오류, 가로 넘침과 WCAG A/AA 자동 검사를 확인했습니다.
- 주요 기능: Quotanest JSON 가져오기와 언어 변경, Shadepad 숨김·복원 및 암호화 백업 왕복, App8 생성·복제·백업·복원, App9 월말·윤년 갱신과 예산 0 복원, App10 생성·변수 채우기·복사·이력·복제.
- 추가 기존 브라우저 회귀 검사: QuickBill 7종, Stampbook 8종, Stayline 주요 흐름·테마, Marginlog 및 Lendnest 주요 흐름. QuickBill·Lendnest는 네트워크를 끊고 다시 열어도 작동하며 데이터가 유지되는지 확인했습니다.
- Cloudflare Wrangler 로컬 런타임에서 페이지 200, 없는 경로 404, 보안 헤더, 7개 라이선스 API의 비활성 모드 POST 200·DELETE 405·no-store를 확인했습니다. 실제 상품 키·구매·환불·Supabase 계정·원격 사용자 데이터는 테스트하지 않았습니다.
- 자동 접근성 검사는 수동 접근성 검토 전체를 대체하지 않습니다. 각 기능을 모든 조합에서 시험한 것은 아니며, 화면 조합 검사와 주요 기능 회귀 검사는 별개입니다.

## 다른 컴퓨터에서 보기

위 표의 앱 이름을 클릭하면 준비 브랜치 코드가 열립니다. 각 저장소의 `PREDEPLOY.md`에 설치, 검증과 최종 파일 생성 명령이 있습니다.

예시:

```sh
git clone --branch codex/predeploy-2026-11-06 https://github.com/sangsangbaksa-dev/quickbill.git
cd quickbill
npm ci
npm run check
npx playwright install chromium
npm run test:browser
npm run bundle
```

## 다운로드 묶음

`apps-predeploy-2026-11-06.zip`에는 앱마다 `<앱>/source/`와 `<앱>/dist/`가 있습니다. `source/`는 표의 Git 커밋과 일치하며 `dist/`에는 필요한 경우 컴파일한 Pages Worker와 라우팅 파일까지 포함됩니다. 의존성 폴더·Git 내부 정보·인증 토큰·사용자 데이터는 포함하지 않습니다.

각 앱의 정적 빌드를 다시 실행하면 컴파일된 Worker가 지워집니다. API가 있는 7개 앱의 최종 배포 파일은 `npm run bundle`, App8·9·10은 `npm run build`로 다시 생성하세요.

## 실제 배포 전에 남은 항목

- Cloudflare 계정, 실제 Pages 프로젝트와 도메인 확인 및 배포 권한 설정.
- Stampbook: 공개 주소는 `stampbook-5kf.pages.dev`, 기존 수동 워크플로 대상은 `stampbook`으로 다릅니다. Lendnest도 공개 주소 `lendnest-90u.pages.dev`와 워크플로 대상 `lendnest`가 다릅니다. 콘솔에서 실제 대상을 확정한 뒤 맞춰야 합니다. 공개 주소 조회는 403 응답으로 확인하지 못했습니다.
- 판매 앱별 Lemon Squeezy 상품 ID, 구매 링크·가격·지원 연락처 확인. 라이선스 비활성화 설정은 로컬 검사에만 사용했습니다.
- QuickBill·Stampbook·Stayline의 선택적 Supabase 인증과 RLS는 소유자 계정에서 운영 환경을 확인해야 합니다.
- 기존 사용자 데이터를 다른 도메인으로 옮길 경우 기존 주소에서 JSON 백업 후 새 주소에서 복원해야 합니다.
