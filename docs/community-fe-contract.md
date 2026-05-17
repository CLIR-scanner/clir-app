# 커뮤니티 FE Consumer 가이드 (G5 · G6 계약)

> BE 계약 SSOT: `clir-api/docs/tasks/community/06-cross-cutting.md` §X3 G5/G6.
> 이 문서는 FE가 커뮤니티 API를 소비할 때 반드시 지켜야 하는 처리 규약이다.

---

## G5 — 더블탭 / At-least-once 계약

### 배경

커뮤니티 쓰기 액션(좋아요 토글, 게시글·답변 삭제)은 네트워크 재시도, 더블탭 등으로
같은 요청이 두 번 도달할 수 있다.

### 계약

| 응답 코드 | 오류 코드 | FE 처리 |
|---|---|---|
| `409 ALREADY_LIKED` | `ALREADY_LIKED` | **성공 등가** — 이미 좋아요 상태. 에러 토스트 표시 금지 |
| `409 ALREADY_REVIEWED` | `ALREADY_REVIEWED` | **성공 등가** — 이미 리뷰 작성됨. 에러 토스트 금지 (단, UX상 "이미 작성됨" 안내는 가능) |
| `404 LIKE_NOT_FOUND` | `LIKE_NOT_FOUND` | **성공 등가** — 이미 취소됨. 에러 토스트 금지 |
| `404 REVIEW_NOT_FOUND` | `REVIEW_NOT_FOUND` | 삭제 재요청 시 이미 삭제된 것. 성공 등가 |
| `404 QNA_NOT_FOUND` | `QNA_NOT_FOUND` | 삭제 재요청 시 이미 삭제된 것. 성공 등가 |
| `404 ANSWER_NOT_FOUND` | `ANSWER_NOT_FOUND` | 삭제 재요청 시 이미 삭제된 것. 성공 등가 |

### 구현 지침

```typescript
// 좋아요 추가 예시
try {
  await api.post(`/products/${productId}/likes`);
  setIsLiked(true);
} catch (err) {
  if (err instanceof ApiError && err.code === 'ALREADY_LIKED') {
    // 성공 등가 — 이미 좋아요 상태이므로 UI 반영만
    setIsLiked(true);
    return; // 에러 토스트 금지
  }
  showErrorToast(err); // 진짜 에러만 토스트
}

// 좋아요 취소 예시
try {
  await api.delete(`/products/${productId}/likes`);
  setIsLiked(false);
} catch (err) {
  if (err instanceof ApiError && err.code === 'LIKE_NOT_FOUND') {
    // 성공 등가 — 이미 취소됨
    setIsLiked(false);
    return; // 에러 토스트 금지
  }
  showErrorToast(err);
}
```

---

## G6 — answerCount ↔ answers[] 스큐 (스냅샷 불일치)

### 배경

`QnaPostSummary.answerCount`는 `qna_posts.answer_count`(트리거 비정규화 값)이고,
`QnaPostDetail.answers[]`는 `qna_answers` 실제 행 집합이다.
두 값은 본질적으로 **스냅샷 시차**가 존재한다.

### 계약

| 필드 | 진실 여부 | FE 표시 용도 |
|---|---|---|
| `answers[]` | **진실(Truth)** — 실제 답변 목록. 이 배열로 렌더링 |
| `answerCount` | **근사 배지(Approximate Badge)** — 목록·피드에서 "N개" 배지용 |

### 구현 지침

```typescript
// Q1/피드 목록: answerCount를 배지로만 사용
<Badge>{post.answerCount}개 답변</Badge>

// Q3 상세: 실제 answers[] 로 렌더링
{detail.answers.map(answer => <AnswerItem key={answer.id} answer={answer} />)}

// answers.length 와 answerCount 가 다를 수 있음 — 정합 체크 금지
// 예: detail.answers.length !== detail.answerCount → 정상 (스큐 허용)
// ❌ 금지: if (detail.answers.length !== detail.answerCount) showError(...)
```

### 왜 이렇게 되는가

- `answer_count`는 트리거가 `qna_answers` INSERT/DELETE 이벤트마다 업데이트한다.
- GET /qna 목록 쿼리와 GET /qna/:id 상세 쿼리는 별개 트랜잭션이다.
- 두 쿼리 사이 답변이 추가/삭제되면 count가 달라 보일 수 있다.
- 이는 **의도된 설계**(비정규화 캐시 + 결과적 일관성). FE가 동기화를 강제하면 안 된다.

---

## 참고: FE 에러 코드 전체 목록 (커뮤니티)

| 코드 | 의미 | HTTP |
|---|---|---|
| `ALREADY_REVIEWED` | 이미 리뷰 작성됨 | 409 |
| `ALREADY_LIKED` | 이미 좋아요 누름 | 409 |
| `REVIEW_NOT_FOUND` | 리뷰 없음 | 404 |
| `LIKE_NOT_FOUND` | 좋아요 없음 | 404 |
| `QNA_NOT_FOUND` | QnA 글 없음 | 404 |
| `ANSWER_NOT_FOUND` | 답변 없음 | 404 |
| `PRODUCT_NOT_FOUND` | 상품 없음 | 404 |
| `FORBIDDEN_REVIEW` | 타인 리뷰 수정·삭제 시도 | 403 |
| `FORBIDDEN_QNA` | 타인 글 수정·삭제 시도 | 403 |
| `FORBIDDEN_ANSWER` | 타인 답변 수정·삭제 시도 | 403 |
| `FORBIDDEN_PROFILE` | 타인 프로필 접근 | 403 |
| `PROFILE_NOT_FOUND` | 프로필 없음 | 404 |
| `DB_UNAVAILABLE` | DB 장애 | 503 |
| `SERVICE_DISABLED` | 커뮤니티 기능 비활성화(킬스위치) | 503 |
| `TOO_MANY_REQUESTS` | rate-limit 초과 | 429 |
| `INVALID_INPUT` | 잘못된 body 입력 | 400 |
| `INVALID_QUERY` | 잘못된 쿼리 파라미터 | 400 |
