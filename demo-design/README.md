# RE:SPEC 디자인 시안

이 폴더는 Next.js 앱과 분리된 HTML 시안입니다. HTML과 함께 필요한 CSS·JavaScript를 보관합니다.

```bash
node demo-design/serve.js 5180
```

브라우저에서 `http://localhost:5180/projects.html`을 열면 화면을 볼 수 있습니다. `workspace.html`의 사이트 미리보기는 기본적으로 `http://localhost:5174`(초안 A)와 `http://localhost:5173`(배포본 B)를 사용합니다. 다른 사이트 주소는 `?a=주소&b=주소`로 전달할 수 있습니다.

화면의 역할 전환과 저장은 시연용이며, 이 HTML 페이지는 실제 백엔드와 연결되지 않습니다.
