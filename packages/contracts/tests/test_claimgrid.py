from pathlib import Path

SOURCE = Path(__file__).parents[1] / "claimgrid.py"
TEXT = SOURCE.read_text(encoding="utf-8")


def test_contract_contains_required_writes():
    methods = [
        "register_provider", "update_policy", "add_pool", "withdraw_pool",
        "set_provider_active", "register_item", "approve_item", "file_claim",
        "judge_claim", "withdraw_claim", "settle_claim", "expire_item",
    ]
    for method in methods:
        assert f"def {method}(" in TEXT


def test_contract_contains_required_views():
    for method in ["get_config", "get_provider", "get_item", "get_claim", "get_provider_items", "get_customer_items", "get_claim_ids"]:
        assert f"def {method}(" in TEXT


def test_security_guards_exist():
    assert "provider.pool) - value < int(provider.reserved" in TEXT
    assert "item.policy_version" in TEXT
    assert "safe_evidence" in TEXT
    assert "prompt_comparative" in TEXT
