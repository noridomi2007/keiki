from __future__ import annotations

from typing import Any, Literal
from pydantic import BaseModel, Field
from agent.schemas import (
    CategoryType,
    DocumentKind,
    Item,
    PaymentMethodType,
    TaxGroupType,
    Transaction,
    TransactionStatus,
    TransactionType,
)


class DocumentRecord(BaseModel):
    id: str
    household_id: str = "demo"
    kind: DocumentKind
    mime_type: str
    sha256: str
    storage_path: str
    uploaded_at: str
    preset_hint: str | None = None


class JobEventRecord(BaseModel):
    job_id: str
    seq: int
    step: str
    status: Literal["running", "ok", "warn", "error"]
    message: str
    data: dict[str, Any] = Field(default_factory=dict)


class JobRecord(BaseModel):
    id: str
    household_id: str = "demo"
    document_id: str
    status: Literal["queued", "running", "done", "error"] = "queued"
    events: list[JobEventRecord] = Field(default_factory=list)
    transaction_id: str | None = None
    error: str | None = None


class TransactionCreateRequest(BaseModel):
    date: str
    type: TransactionType
    category: CategoryType | None = None
    tax_group: TaxGroupType | None = None
    payment_method: PaymentMethodType = "cash"
    amount_vnd: int = Field(gt=0)
    counterparty: str | None = None
    tax_code: str | None = None
    items: list[Item] = Field(default_factory=list)


class TransactionPatchRequest(BaseModel):
    date: str | None = None
    type: TransactionType | None = None
    category: CategoryType | None = None
    tax_group: TaxGroupType | None = None
    payment_method: PaymentMethodType | None = None
    amount_vnd: int | None = Field(default=None, gt=0)
    counterparty: str | None = None
    tax_code: str | None = None
    items: list[Item] | None = None
    status: TransactionStatus | None = None


class ConfirmRequest(BaseModel):
    merge_into_duplicate: bool = False


class RejectRequest(BaseModel):
    reason: str | None = None


class TransactionListResponse(BaseModel):
    items: list[Transaction]
    total: int


class TaxBreakdownItem(BaseModel):
    tax_group: TaxGroupType
    label: str
    revenue_vnd: int
    rate_pct: float
    tax_vnd: int


class TopItemSummary(BaseModel):
    name: str
    total_vnd: int


class PriceIncreaseAlert(BaseModel):
    item: str
    counterparty: str
    old_vnd: int
    new_vnd: int
    pct: float


class LoanReadinessSummary(BaseModel):
    verified_ratio_pct: float
    with_evidence_count: int
    total_recorded_count: int
    cross_verified_count: int


class ReportResponse(BaseModel):
    period: dict[str, str]
    totals: dict[str, int]
    tax_breakdown: list[TaxBreakdownItem]
    top_items: list[TopItemSummary]
    price_increases: list[PriceIncreaseAlert]
    loan_readiness: LoanReadinessSummary
    pending_review: int
    summary_text: str | None = None


class ApiKeyUpdateRequest(BaseModel):
    gemini_api_key: str
    gemini_model: str = "gemini-2.5-flash"
