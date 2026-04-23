/**
 * @deprecated — 알러지 도메인 데이터는 BE 의 `GET /allergens/catalog` 가 SSOT.
 *   FE 사용처는 `src/services/allergen.service.ts` 로 이전되었다.
 *
 *   - 카테고리/항목 트리: `fetchAllergenCatalog()` → Survey 화면에서 렌더
 *   - 표시명 조회: `getAllergenDisplay(id)`
 *   - Ingredient 빌더: `makeRiskIngredient` / `makeMayContainIngredient`
 *
 *   이 파일은 하위 호환을 위해 남겨둔 스텁. import 는 allergen.service 로 전환 필요.
 */

export {
  makeRiskIngredient,
  makeMayContainIngredient,
  getAllergenDisplay as getAllergenName,
} from '../services/allergen.service';
