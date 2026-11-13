from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient
from backend.app.config import settings
from backend.app.main import app
from backend.app.repositories.memory import repo


@pytest.mark.asyncio
async def test_health_and_transactions_and_cross_duplicate_merge():
    repo.reset_to_seed()
    orig_demo = settings.demo_mode
    settings.demo_mode = True
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Health check (public)
            r_health = await client.get("/api/health")
            assert r_health.status_code == 200
            assert r_health.json()["service"] == "keiki"

            # 2. Authenticate via demo preset in DEMO_MODE=true to receive HttpOnly session cookie
            r_login = await client.post(
                "/api/auth/login",
                json={
                    "owner": "Nguyễn Minh Tâm",
                    "name": "Cửa hàng Thương mại & Dịch vụ Minh Tâm",
                    "auth_method": "preset",
                },
            )
            assert r_login.status_code == 200
            assert "keiki_session" in r_login.cookies

            # 3. List transactions
            r_list = await client.get("/api/transactions")
            assert r_list.status_code == 200
            data = r_list.json()
            assert data["total"] >= 7

            # 4. Merge CROSS_DUPLICATE transaction (txn_seed_02 into txn_seed_01)
            r_merge = await client.post(
                "/api/transactions/txn_seed_02/confirm",
                json={"merge_into_duplicate": True},
            )
            assert r_merge.status_code == 200
            merged_tx = r_merge.json()
            assert merged_tx["id"] == "txn_seed_01"
            assert "doc_seed_01" in merged_tx["linked_document_ids"]
            assert "doc_seed_02" in merged_tx["linked_document_ids"]
            assert merged_tx["payment_method"] == "transfer"

            # 5. Report calculation
            r_rep = await client.get("/api/report?period=month&anchor=2026-11-12")
            assert r_rep.status_code == 200
            rep = r_rep.json()
            assert rep["totals"]["revenue_vnd"] > 0
            assert rep["loan_readiness"]["cross_verified_count"] >= 2

            # 6. Export TT152 Excel & ZIP
            r_xlsx = await client.get("/api/export?month=2026-11&evidence=false")
            assert r_xlsx.status_code == 200
            assert len(r_xlsx.content) > 2000

            r_zip = await client.get("/api/export?month=2026-11&evidence=true")
            assert r_zip.status_code == 200
            assert len(r_zip.content) > 2000
    finally:
        settings.demo_mode = orig_demo
