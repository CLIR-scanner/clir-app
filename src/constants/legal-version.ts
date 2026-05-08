// 현재 약관·개인정보 버전. waitlist-landing 의 terms.html / privacy.html "Last updated" 와 일치.
//
// 변경 시 운영 절차 (terms.html 수정과 동시에):
//   1. waitlist-landing 의 HTML 의 "Last updated" 일자 갱신 + 본 상수 동시 변경
//   2. App Store Connect Custom EULA 재업로드 (수동 — Apple Standard EULA 안 사용 시)
//   3. 앱 재배포 (build-time 상수라 OTA 만으로 부족 — 네이티브 빌드 새로 컷)
//
// 사용자가 BE 의 terms_version 과 본 상수가 다르면 가입/로그인 직후 acceptTerms() 자동 호출 (audit trail 갱신).
export const TERMS_VERSION = '2026-05-07';
