# demo-design

RE:SPEC 화면의 기준 시안입니다. 빌드 없이 여는 정적 HTML이고, 앱 코드가 아니어서 ESLint·Prettier 검사에서 빠져 있습니다.

## 실행

```bash
node demo-design/serve.js 5182
```

`http://localhost:5182/workspace.html`을 엽니다. 작업 화면은 시연 사이트(morrow-a `5174`, morrow-b `5173`)를 iframe으로 띄웁니다. 다른 주소는 `?a=…&b=…`로 바꿉니다.

| 화면 | 파일 |
| --- | --- |
| 로그인·회원가입 | `login.html` |
| 내 프로젝트 | `projects.html` |
| 초대 수락 | `invite.html` |
| AI 초안 생성 | `draft.html` |
| 작업 화면 | `workspace.html`, `workspace.js` |
| 요청 관리 | `requests.html` |

예외 화면 확인: `workspace.html?deploy=none`(배포 전), `workspace.html?review=1`(개발자 검수 요청 만들기), `draft.html?fail=1`(초안 생성 실패).

## 주의

- 상단의 **고객/개발자 전환은 시연용**입니다. 실제 앱에는 만들지 않습니다. 역할은 `project.my_role`로 정해집니다.
- 데이터는 `common.js`의 예시 데이터이고 브라우저 세션에만 저장됩니다.

## 문서

- [FRONTEND-REQUESTS.md](FRONTEND-REQUESTS.md): 이 시안 기준으로 앱에서 고칠 것, 색·강조 규칙
- [BACKEND-REQUESTS.md](BACKEND-REQUESTS.md): 백엔드에 요청한 API
