"""company profile columns on companies

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-27 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0003"
down_revision: str | Sequence[str] | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Frozen copies of the codes in app/modules/companies/reference.py at this revision.
ENTITY_TYPES = (
    "proprietorship",
    "partnership",
    "llp",
    "private_limited",
    "public_limited",
    "other",
)
STATES = (
    "AP", "AR", "AS", "BR", "CG", "GA", "GJ", "HR", "HP", "JH", "KA", "KL", "MP", "MH",
    "MN", "ML", "MZ", "NL", "OD", "PB", "RJ", "SK", "TN", "TS", "TR", "UP", "UK", "WB",
    "AN", "CH", "DH", "DL", "JK", "LA", "LD", "PY",
)  # fmt: skip
WORK_TYPES = (
    "buildings",
    "roads_bridges",
    "water_sewerage",
    "irrigation",
    "electrical",
    "railways",
    "repair_maintenance",
    "other",
)
REGISTRATION_AUTHORITIES = ("cpwd", "state_pwd", "mes", "railways", "other", "none")


def _sql_list(codes: tuple[str, ...]) -> str:
    return ", ".join(f"'{code}'" for code in codes)


def upgrade() -> None:
    """Add the onboarding profile fields (entity type, states, work types, registration...)."""
    op.add_column("companies", sa.Column("entity_type", sa.Text(), nullable=True))
    op.add_column(
        "companies",
        sa.Column(
            "states", postgresql.ARRAY(sa.Text()), server_default=sa.text("'{}'"), nullable=False
        ),
    )
    op.add_column(
        "companies",
        sa.Column(
            "work_types",
            postgresql.ARRAY(sa.Text()),
            server_default=sa.text("'{}'"),
            nullable=False,
        ),
    )
    op.add_column("companies", sa.Column("registration_authority", sa.Text(), nullable=True))
    op.add_column("companies", sa.Column("registration_class", sa.String(length=50), nullable=True))
    op.add_column("companies", sa.Column("has_bid_before", sa.Boolean(), nullable=True))
    op.add_column(
        "companies",
        sa.Column("profile_completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_check_constraint(
        op.f("ck_companies_entity_type"),
        "companies",
        f"entity_type IN ({_sql_list(ENTITY_TYPES)})",
    )
    op.create_check_constraint(
        op.f("ck_companies_registration_authority"),
        "companies",
        f"registration_authority IN ({_sql_list(REGISTRATION_AUTHORITIES)})",
    )
    op.create_check_constraint(
        op.f("ck_companies_states"),
        "companies",
        f"states <@ ARRAY[{_sql_list(STATES)}]::text[]",
    )
    op.create_check_constraint(
        op.f("ck_companies_work_types"),
        "companies",
        f"work_types <@ ARRAY[{_sql_list(WORK_TYPES)}]::text[]",
    )


def downgrade() -> None:
    """Drop the profile checks and columns."""
    for name in ("work_types", "states", "registration_authority", "entity_type"):
        op.drop_constraint(op.f(f"ck_companies_{name}"), "companies", type_="check")
    for column in (
        "profile_completed_at",
        "has_bid_before",
        "registration_class",
        "registration_authority",
        "work_types",
        "states",
        "entity_type",
    ):
        op.drop_column("companies", column)
