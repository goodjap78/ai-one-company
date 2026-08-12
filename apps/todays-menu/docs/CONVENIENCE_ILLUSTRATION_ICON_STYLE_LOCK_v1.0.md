# HANKKI Convenience Illustration Icon Style Lock v1.0

| Field | Value |
| --- | --- |
| **Style id** | `HANKKI_CONVENIENCE_ILLUSTRATION_ICON_STYLE_VERSION = v1.0` |
| **Locked sprint** | 56-A.3 (cup_ramen) · 56-B.2 (cup_rice) |
| **Reference masters** | `cup_ramen` · `cup_rice` |
| **Code** | `scripts/convenience-illustration-icon-factory/convenienceIconStyleLock.ts` |
| **Aligned with** | HANKKI Ingredient Icon Style v1.0 |
| **Production** | Not wired (review / generated masters only) |

---

## 1. Approved masters

| iconKey | Source | Master copy | Sprint |
| --- | --- | --- | --- |
| `cup_ramen` | `review/cup_ramen_v15.png` | `masters/cup_ramen.png` | 56-A.3 |
| `cup_rice` | `review/cup_rice_v11.png` | `masters/cup_rice.png` | 56-B.2 |

### cup_ramen (v1.5)

| Metric | Value |
| --- | --- |
| Canvas | 1024×1024 PNG |
| Bbox area | **37.4%** (target **35–38%**) |
| Background | opaque warm cream rgb(240, 225, 199) |
| Padding (T / B) | 21.7% / 22.0% |

### cup_rice (v1.1)

| Metric | Value |
| --- | --- |
| Canvas | 1024×1024 PNG |
| Bbox area | **33.5%** (target **33–38%**) |
| Background | **opaque warm cream** rgb(252, 238, 211) |
| Padding (T / B) | 21.3% / 18.0% |
| Body | dark charcoal low-wide container `#2D2D2D` |
| Accent | yellow band `#F5C542` |
| Legibility | **40px** |
| Shadow | soft contact shadow |

---

## 2. Locked visual rules (mandatory)

| Rule | Requirement |
| --- | --- |
| **Bbox footprint** | ~**33–38%** canvas area — strong presence at 40px |
| **Background** | **Opaque warm cream** matching production ingredient icons |
| **Illustration mode** | **Semi-flat 3D** |
| **Silhouette** | **Rounded, friendly** |
| **Subject** | **Single product** only |
| **Shadow** | **Soft contact shadow** |
| **Branding** | **No brand, text, logo, barcode** |
| **Legibility** | Must read at **40px** |

---

## 3. cup_ramen master specifics

- Open rounded rim · 2–3 noodle strands inside · orange band `#FF8C42`
- History: `history/cup_ramen/cup_ramen_v1.png`, `cup_ramen_v2.png`

---

## 4. cup_rice master specifics

- Low-wide dark charcoal cup · yellow band · rice mound at top
- Programmatic scale-up from v1 at 1.12× (Sprint 56-B.1)
- History: `history/cup_rice/cup_rice_v1.png`
- Review copies: `review/cup_rice_v1.png`, `review/cup_rice_v11.png`

---

## 5. Next pilot (prepared only)

| iconKey | Status | Prompt file |
| --- | --- | --- |
| `triangle_kimbap` | **Prompt prepared · generation NOT approved** | `prompts/triangle_kimbap_pilot.md` |

Spec: triangle silhouette · black seaweed `#2A2A2A` · cream rice bottom `#FFF5E6` · 2–3 grain lines · no label text

---

## 6. Not in scope

- `assets/convenience-illustration-icons/` production PNGs
- `convenienceIllustrationIconAssets.ts` registry
- UI wiring

---

## 7. Commands

```bash
npm run convenience-icon:approve-cup-rice-master
npm run convenience-icon:prepare-triangle-kimbap-pilot
```

---

## 8. References

- System spec: `docs/CONVENIENCE_ILLUSTRATION_ICON_SYSTEM_v1.0.md`
- Style lock code: `scripts/convenience-illustration-icon-factory/convenienceIconStyleLock.ts`
