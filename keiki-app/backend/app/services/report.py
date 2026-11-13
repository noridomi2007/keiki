from __future__ import annotations

from collections import defaultdict
from agent.report import summarize_report
from backend.app.config import settings
from backend.app.models import (
    LoanReadinessSummary,
    PriceIncreaseAlert,
    ReportResponse,
    TaxBreakdownItem,
    TopItemSummary,
)
from backend.app.repositories.memory import MemoryRepo


TAX_RATES: dict[str, tuple[str, float]] = {
    "phan_phoi_hang_hoa": ("Phân phối, cung cấp hàng hóa (GTGT 1% + TNCN 0,5%)", 1.5),
    "san_xuat_van_tai_an_uong": ("Sản xuất, vận tải, dịch vụ gắn với hàng hóa, ăn uống (GTGT 3% + TNCN 1,5%)", 4.5),
    "dich_vu_xay_dung": ("Dịch vụ, lưu trú, du lịch, xây dựng không bao thầu (GTGT 5% + TNCN 2%)", 7.0),
    "kinh_doanh_khac": ("Hoạt động kinh doanh khác (GTGT 2% + TNCN 1%)", 3.0),
}


async def build_report(
    repo: MemoryRepo,
    household_id: str = "demo",
    period: str = "month",
    anchor: str = "2026-11-12",
) -> ReportResponse:
    """Compute financial totals, Circular 152/2025/TT-BTC tax estimates, and Bank Loan Readiness."""
    month_prefix = anchor[:7] if len(anchor) >= 7 else "2026-11"
    date_from = f"{month_prefix}-01"
    date_to = f"{month_prefix}-31"

    all_tx = repo.list_transactions(household_id=household_id, date_from=date_from, date_to=date_to)
    recorded_tx = [t for t in all_tx if t.status == "recorded"]
    pending_tx = [t for t in repo.list_transactions(household_id=household_id, status="needs_review")]

    revenue_vnd = sum(t.amount_vnd for t in recorded_tx if t.type == "revenue")
    expense_vnd = sum(t.amount_vnd for t in recorded_tx if t.type == "expense")
    profit_vnd = revenue_vnd - expense_vnd

    # Tax breakdown under Circular 152/2025/TT-BTC
    group_rev: dict[str, int] = defaultdict(int)
    for t in recorded_tx:
        if t.type == "revenue":
            grp = t.tax_group if t.tax_group in TAX_RATES else "phan_phoi_hang_hoa"
            group_rev[grp] += t.amount_vnd

    tax_breakdown: list[TaxBreakdownItem] = []
    total_tax_vnd = 0
    for grp_key, (label, rate_pct) in TAX_RATES.items():
        rev_val = group_rev.get(grp_key, 0)
        tax_val = int(round(rev_val * (rate_pct / 100.0)))
        total_tax_vnd += tax_val
        tax_breakdown.append(
            TaxBreakdownItem(
                tax_group=grp_key,  # type: ignore[arg-type]
                label=label,
                revenue_vnd=rev_val,
                rate_pct=rate_pct,
                tax_vnd=tax_val,
            )
        )

    # Top items by spend/revenue
    item_totals: dict[str, int] = defaultdict(int)
    for t in recorded_tx:
        if t.items:
            for item in t.items:
                item_totals[item.name] += item.line_total_vnd
        elif t.counterparty:
            item_totals[t.counterparty] += t.amount_vnd

    top_items = [
        TopItemSummary(name=name, total_vnd=val)
        for name, val in sorted(item_totals.items(), key=lambda x: x[1], reverse=True)[:5]
    ]

    # Price increases detected across transactions (including needs_review)
    price_increases: list[PriceIncreaseAlert] = []
    for t in all_tx:
        if any(w.code == "PRICE_ANOMALY" for w in t.warnings) and t.items:
            first_item = t.items[0]
            price_increases.append(
                PriceIncreaseAlert(
                    item=first_item.name,
                    counterparty=t.counterparty or "Nhà cung cấp",
                    old_vnd=180000,
                    new_vnd=first_item.unit_price_vnd,
                    pct=round(((first_item.unit_price_vnd - 180000) / 180000) * 100, 1),
                )
            )

    # Bank Loan Readiness score
    total_rec = len(recorded_tx)
    with_evidence = sum(
        1 for t in recorded_tx if t.document_id or len(t.linked_document_ids) > 0 or t.transcript
    )
    cross_verified = sum(1 for t in recorded_tx if len(t.linked_document_ids) >= 2)
    verified_ratio = round((with_evidence / total_rec) * 100.0, 1) if total_rec > 0 else 100.0

    loan_readiness = LoanReadinessSummary(
        verified_ratio_pct=verified_ratio,
        with_evidence_count=with_evidence,
        total_recorded_count=total_rec,
        cross_verified_count=cross_verified,
    )

    totals = {
        "revenue_vnd": revenue_vnd,
        "expense_vnd": expense_vnd,
        "profit_vnd": profit_vnd,
        "estimated_tax_vnd": total_tax_vnd,
    }

    summary_text = await summarize_report(
        numbers={
            "period": {"from": date_from, "to": date_to},
            "totals": totals,
            "loan_readiness": loan_readiness.model_dump(),
            "pending_review": len(pending_tx),
        },
        gemini_api_key=settings.gemini_api_key or None,
        model=settings.gemini_model,
    )

    return ReportResponse(
        period={"from": date_from, "to": date_to},
        totals=totals,
        tax_breakdown=tax_breakdown,
        top_items=top_items,
        price_increases=price_increases,
        loan_readiness=loan_readiness,
        pending_review=len(pending_tx),
        summary_text=summary_text,
    )
