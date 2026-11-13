from __future__ import annotations

from typing import Any
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, Response

from agent.schemas import ExtractionResult, Transaction
from agent.tools.category import classify_category_and_tax
from backend.app.errors import ApiError
from backend.app.models import (
    ConfirmRequest,
    RejectRequest,
    TransactionCreateRequest,
    TransactionListResponse,
    TransactionPatchRequest,
)
from backend.app.repositories.memory import repo
from backend.app.security import require_session

router = APIRouter(
    prefix="/api/transactions",
    tags=["transactions"],
    dependencies=[Depends(require_session)],
)


def _get_owned_transaction(tx_id: str, household_id: str) -> Transaction:
    tx = repo.get_transaction(tx_id)
    if not tx or tx.household_id != household_id:
        raise ApiError(status_code=404, code="NOT_FOUND", message="Không tìm thấy giao dịch.")
    return tx


@router.get("", response_model=TransactionListResponse)
async def list_transactions(
    status: str | None = Query(None),
    type: str | None = Query(None),
    from_date: str | None = Query(None, alias="from"),
    to_date: str | None = Query(None, alias="to"),
    session: dict[str, Any] = Depends(require_session),
) -> TransactionListResponse:
    hid = str(session.get("hid", "demo"))
    items = repo.list_transactions(
        household_id=hid,
        status=status,
        tx_type=type,
        date_from=from_date,
        date_to=to_date,
    )
    return TransactionListResponse(items=items, total=len(items))


@router.post("", response_model=Transaction, status_code=201)
async def create_manual_transaction(
    payload: TransactionCreateRequest,
    session: dict[str, Any] = Depends(require_session),
) -> Transaction:
    hid = str(session.get("hid", "demo"))
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    ext_tmp = ExtractionResult(
        date=payload.date,
        type=payload.type,
        category=payload.category,
        tax_group=payload.tax_group,
        amount_vnd=payload.amount_vnd,
        counterparty=payload.counterparty,
        items=payload.items,
    )
    cat, tax_grp = classify_category_and_tax(ext_tmp)
    tx = Transaction(
        id=f"txn_{uuid.uuid4().hex[:8]}",
        household_id=hid,
        document_id=None,
        linked_document_ids=[],
        duplicate_of_id=None,
        date=payload.date,
        type=payload.type,
        category=payload.category or cat,
        tax_group=payload.tax_group or tax_grp,
        payment_method=payload.payment_method,
        amount_vnd=payload.amount_vnd,
        counterparty=payload.counterparty,
        tax_code=payload.tax_code,
        items=payload.items,
        transcript=None,
        confidence={},
        status="recorded",
        clarification_question=None,
        warnings=[],
        source="manual",
        created_at=now_iso,
        updated_at=now_iso,
    )
    return repo.save_transaction(tx)


@router.patch("/{tx_id}", response_model=Transaction)
async def patch_transaction(
    tx_id: str,
    payload: TransactionPatchRequest,
    session: dict[str, Any] = Depends(require_session),
) -> Transaction:
    hid = str(session.get("hid", "demo"))
    tx = _get_owned_transaction(tx_id, hid)

    updates = payload.model_dump(exclude_unset=True)
    updates["updated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    updated_tx = tx.model_copy(update=updates)
    return repo.save_transaction(updated_tx)


@router.delete("/{tx_id}", status_code=204)
async def delete_transaction(
    tx_id: str,
    session: dict[str, Any] = Depends(require_session),
) -> Response:
    hid = str(session.get("hid", "demo"))
    _get_owned_transaction(tx_id, hid)
    repo.delete_transaction(tx_id)
    return Response(status_code=204)


@router.post("/{tx_id}/confirm", response_model=Transaction)
async def confirm_transaction(
    tx_id: str,
    payload: ConfirmRequest | None = None,
    session: dict[str, Any] = Depends(require_session),
) -> Transaction:
    hid = str(session.get("hid", "demo"))
    tx = _get_owned_transaction(tx_id, hid)

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    merge_flag = payload.merge_into_duplicate if payload else False

    if merge_flag and tx.duplicate_of_id:
        orig_tx = repo.get_transaction(tx.duplicate_of_id)
        if orig_tx and orig_tx.household_id == hid:
            merged_docs = list(orig_tx.linked_document_ids)
            for doc_id in ([tx.document_id] if tx.document_id else []) + tx.linked_document_ids:
                if doc_id and doc_id not in merged_docs:
                    merged_docs.append(doc_id)

            new_payment = "transfer" if tx.payment_method == "transfer" else orig_tx.payment_method
            updated_orig = orig_tx.model_copy(
                update={
                    "linked_document_ids": merged_docs,
                    "payment_method": new_payment,
                    "status": "recorded",
                    "clarification_question": None,
                    "updated_at": now_iso,
                }
            )
            repo.save_transaction(updated_orig)

            rejected_dup = tx.model_copy(
                update={
                    "status": "rejected",
                    "clarification_question": None,
                    "updated_at": now_iso,
                }
            )
            repo.save_transaction(rejected_dup)
            return updated_orig

    confirmed_tx = tx.model_copy(
        update={
            "status": "recorded",
            "clarification_question": None,
            "updated_at": now_iso,
        }
    )
    return repo.save_transaction(confirmed_tx)


@router.post("/{tx_id}/reject", response_model=Transaction)
async def reject_transaction(
    tx_id: str,
    payload: RejectRequest | None = None,
    session: dict[str, Any] = Depends(require_session),
) -> Transaction:
    hid = str(session.get("hid", "demo"))
    tx = _get_owned_transaction(tx_id, hid)

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    rejected_tx = tx.model_copy(
        update={
            "status": "rejected",
            "updated_at": now_iso,
        }
    )
    return repo.save_transaction(rejected_tx)
