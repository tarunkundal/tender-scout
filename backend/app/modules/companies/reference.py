"""Fixed option lists for the company profile (onboarding wizard + settings).

Codes are stored in `companies`; labels live only here and reach the frontend through
`GET /reference/onboarding`. The Literal types drive Pydantic validation and the generated
frontend types; the label tables must list exactly the same codes (checked at import).
"""

from typing import Literal, get_args

EntityType = Literal[
    "proprietorship", "partnership", "llp", "private_limited", "public_limited", "other"
]

# ISO 3166-2:IN subdivision suffixes (2023 codes: CG, OD, TS, UK). 28 states + 8 UTs.
StateCode = Literal[
    "AP", "AR", "AS", "BR", "CG", "GA", "GJ", "HR", "HP", "JH", "KA", "KL", "MP", "MH",
    "MN", "ML", "MZ", "NL", "OD", "PB", "RJ", "SK", "TN", "TS", "TR", "UP", "UK", "WB",
    "AN", "CH", "DH", "DL", "JK", "LA", "LD", "PY",
]  # fmt: skip

WorkType = Literal[
    "buildings",
    "roads_bridges",
    "water_sewerage",
    "irrigation",
    "electrical",
    "railways",
    "repair_maintenance",
    "other",
]

RegistrationAuthority = Literal["cpwd", "state_pwd", "mes", "railways", "other", "none"]

REGISTRATION_NONE: RegistrationAuthority = "none"

ENTITY_TYPES: dict[EntityType, str] = {
    "proprietorship": "Proprietorship",
    "partnership": "Partnership firm",
    "llp": "Limited liability partnership (LLP)",
    "private_limited": "Private limited company",
    "public_limited": "Public limited company",
    "other": "Other",
}

STATES: dict[StateCode, str] = {
    # States
    "AP": "Andhra Pradesh",
    "AR": "Arunachal Pradesh",
    "AS": "Assam",
    "BR": "Bihar",
    "CG": "Chhattisgarh",
    "GA": "Goa",
    "GJ": "Gujarat",
    "HR": "Haryana",
    "HP": "Himachal Pradesh",
    "JH": "Jharkhand",
    "KA": "Karnataka",
    "KL": "Kerala",
    "MP": "Madhya Pradesh",
    "MH": "Maharashtra",
    "MN": "Manipur",
    "ML": "Meghalaya",
    "MZ": "Mizoram",
    "NL": "Nagaland",
    "OD": "Odisha",
    "PB": "Punjab",
    "RJ": "Rajasthan",
    "SK": "Sikkim",
    "TN": "Tamil Nadu",
    "TS": "Telangana",
    "TR": "Tripura",
    "UP": "Uttar Pradesh",
    "UK": "Uttarakhand",
    "WB": "West Bengal",
    # Union territories
    "AN": "Andaman and Nicobar Islands",
    "CH": "Chandigarh",
    "DH": "Dadra and Nagar Haveli and Daman and Diu",
    "DL": "Delhi",
    "JK": "Jammu and Kashmir",
    "LA": "Ladakh",
    "LD": "Lakshadweep",
    "PY": "Puducherry",
}

# (label, short helper text)
WORK_TYPES: dict[WorkType, tuple[str, str]] = {
    "buildings": ("Buildings", "Offices, schools, hospitals, housing"),
    "roads_bridges": ("Roads and bridges", "Roads, highways, culverts, bridges, flyovers"),
    "water_sewerage": ("Water supply and sewerage", "Pipelines, sewer lines, treatment plants"),
    "irrigation": ("Irrigation", "Canals, check dams, lift irrigation"),
    "electrical": ("Electrical works", "Electrification, substations, street lighting"),
    "railways": ("Railway works", "Track, platforms, station buildings"),
    "repair_maintenance": ("Repair and maintenance", "Repairs, renovation, annual maintenance"),
    "other": ("Other civil works", "Anything not listed above"),
}

REGISTRATION_AUTHORITIES: dict[RegistrationAuthority, str] = {
    "cpwd": "CPWD (Central Public Works Department)",
    "state_pwd": "State PWD",
    "mes": "MES (Military Engineer Services)",
    "railways": "Indian Railways",
    "other": "Other department",
    "none": "Not registered yet",
}

for _literal, _table in (
    (EntityType, ENTITY_TYPES),
    (StateCode, STATES),
    (WorkType, WORK_TYPES),
    (RegistrationAuthority, REGISTRATION_AUTHORITIES),
):
    if list(get_args(_literal)) != list(_table):
        raise RuntimeError(f"Label table out of sync with {_literal}")

ENTITY_TYPE_CODES: tuple[str, ...] = get_args(EntityType)
STATE_CODES: tuple[str, ...] = get_args(StateCode)
WORK_TYPE_CODES: tuple[str, ...] = get_args(WorkType)
REGISTRATION_AUTHORITY_CODES: tuple[str, ...] = get_args(RegistrationAuthority)
