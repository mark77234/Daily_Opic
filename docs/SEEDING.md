# Firestore Seeding & Toggle Guide

## What’s where
- Firebase config: `firebase.ts` (uses `.env` values)
- Seed logic: `admin/adminSeedQuestions.ts`
- Admin UI: `app/admin/AdminSeedScreen.tsx`
- Question fetch hook: `hooks/use-questions.ts`

## Quick switches
- **Disable Firestore access (use local `questions.json` only):**  
  In `hooks/use-questions.ts`, set `FIRESTORE_DISABLED = true`.
- **Enable Firestore access again:**  
  Set `FIRESTORE_DISABLED = false`.
- **Allow auto-seeding on empty Firestore:**  
  Set `.env` `EXPO_PUBLIC_ENABLE_SEED=true` (temporary for seeding).  
  When done, revert to `EXPO_PUBLIC_ENABLE_SEED=false`.

## Seeding steps (manual, recommended)
1) In `.env`, set `EXPO_PUBLIC_ENABLE_SEED=true` (temporarily).  
2) Run the app and open `/admin`.  
3) 로그인 후 “Firestore로 업로드” 실행 → 콘솔에 seed 결과 확인.  
4) `.env`를 다시 `EXPO_PUBLIC_ENABLE_SEED=false`로 돌립니다.  
5) 필요하면 `FIRESTORE_DISABLED`를 `false`로 바꿔 Firestore 데이터를 읽도록 전환합니다.

## Seeding steps (auto, optional)
- 조건: `EXPO_PUBLIC_ENABLE_SEED=true` + Firestore `questions` 컬렉션이 비어 있음.  
- `use-questions`가 Firestore를 읽을 때 비어 있으면 익명 로그인 후 자동 업로드를 시도합니다.  
- Anonymous Sign-in이 Firebase Auth에서 허용되어 있어야 합니다.

## Local-only mode
- Keep `FIRESTORE_DISABLED = true` → 항상 로컬 `questions.json` 사용.  
- Firestore 읽기/쓰기 없음. 차후 업데이트 시 false로 전환.

## Firestore 규칙 참고 (요약)
- `questions`: 읽기 모두 허용, 쓰기는 로그인 사용자 허용(현재 규칙 기준).  
- 다른 컬렉션은 규칙에 따라 적절한 auth 필요.

## 체크리스트
- Firestore 모드로 전환 시: `FIRESTORE_DISABLED=false`, `.env`에서 seeding flag 필요에 따라 조정.  
- Seeding 완료 후: `.env` flag false로 복구.  
- 로컬 모드 유지 시: `FIRESTORE_DISABLED=true` 그대로 둡니다.
